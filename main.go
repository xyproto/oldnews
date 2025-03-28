package main

import (
	"encoding/xml"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	_ "embed"
)

//go:embed embed/style.css
var styleCSS string

//go:embed embed/main.js
var mainJS string

type Article struct {
	Headline     string
	Subheadline  string
	Byline       string
	Paragraphs1  []string
	ImageURL     string
	ImageAlt     string
	ImageCaption string
	Paragraphs2  []string
	Content      []string
}

type SideBox struct {
	Type   string
	Title  string
	Byline string
	Lines  []string
}

type PageData struct {
	Title         string
	IssueInfo     string
	NewspaperName string
	Motto         string
	Date          string
	Price         string
	MainArticles  []Article
	SideBoxes     []SideBox
	Footer        string
}

type RSSItem struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
}

type RSSFeed struct {
	Channel struct {
		Items []RSSItem `xml:"item"`
	} `xml:"channel"`
}

func sanitizeContent(s string) string {
	// Remove HTML tags
	s = strings.ReplaceAll(s, "<[^>]*>", "")

	// Truncate long content
	if len(s) > 300 {
		s = s[:300] + "..."
	}
	return s
}

func fetchRSSFeed(url string) ([]Article, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch RSS feed: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read RSS feed body: %v", err)
	}

	var feed RSSFeed
	if err := xml.Unmarshal(body, &feed); err != nil {
		return nil, fmt.Errorf("failed to parse RSS feed: %v", err)
	}

	var articles []Article
	for _, item := range feed.Channel.Items {
		articles = append(articles, Article{
			Headline: item.Title,
			Content: []string{
				fmt.Sprintf("Full story available at: %s", item.Link),
				sanitizeContent(item.Description),
			},
		})

		if len(articles) >= 3 {
			break
		}
	}

	return articles, nil
}

func fetchSubredditRSS(subreddit string) ([]Article, error) {
	return fetchRSSFeed(fmt.Sprintf("https://www.reddit.com/r/%s/top/.rss", subreddit))
}

func fetchAllNews() ([]Article, error) {
	var allArticles []Article

	sources := []struct {
		Name        string
		URL         string
		FetchMethod func(string) ([]Article, error)
	}{
		{Name: "Hacker News", URL: "https://hnrss.org/best", FetchMethod: fetchRSSFeed},
		{Name: "Lobsters", URL: "https://lobste.rs/rss", FetchMethod: fetchRSSFeed},
		{Name: "Reddit Programming", URL: "https://www.reddit.com/r/programming/top/.rss", FetchMethod: fetchRSSFeed},
		{Name: "Reddit Linux", URL: "https://www.reddit.com/r/linux/top/.rss", FetchMethod: fetchRSSFeed},
		{Name: "Reddit Arch Linux", URL: "https://www.reddit.com/r/archlinux/top/.rss", FetchMethod: fetchRSSFeed},
		{Name: "Reddit Golang", URL: "https://www.reddit.com/r/golang/top/.rss", FetchMethod: fetchRSSFeed},
		{Name: "Reddit World News", URL: "https://www.reddit.com/r/worldnews/top/.rss", FetchMethod: fetchRSSFeed},
	}

	for _, source := range sources {
		articles, err := source.FetchMethod(source.URL)
		if err != nil {
			log.Printf("Error fetching from %s: %v", source.Name, err)
			continue
		}

		for i := range articles {
			articles[i].Byline = fmt.Sprintf("Source: %s", source.Name)
		}

		allArticles = append(allArticles, articles...)
	}

	return allArticles, nil
}

func main() {
	funcMap := template.FuncMap{
		"sub": func(a, b int) int {
			return a - b
		},
	}

	tmpl, err := template.New("index.html").Funcs(funcMap).ParseFiles("static/index.html")
	if err != nil {
		log.Fatalf("Error parsing template: %v", err)
	}

	// Get current date in the desired format
	currentDate := time.Now().Format("MONDAY, 2 JANUARY, 2006")

	data := PageData{
		Title:         "The Tech Chronicle - Accessible Edition",
		IssueInfo:     "Issue 127, Volume 87",
		NewspaperName: "THE TECH CHRONICLE",
		Motto:         `"Bits, Bytes, and Breaking News"`,
		Date:          strings.ToUpper(currentDate),
		Price:         "FIVE PENCE",
		SideBoxes: []SideBox{
			{
				Type:  "weather",
				Title: "WEATHER FORECAST",
				Lines: []string{
					"<strong>Today:</strong> Partly cloudy with scattered showers. High of 17°C.",
					"<strong>Tonight:</strong> Clearing skies, cooler. Low of 8°C.",
					"<strong>Tomorrow:</strong> Sunny and pleasant. High near 20°C.",
				},
			},
		},
		Footer: "Printed 2025, The Tech Chronicle Publishing Company | BSD3-licensed",
	}

	dynamicArticles, err := fetchAllNews()
	if err != nil {
		log.Printf("Error fetching initial news: %v", err)
	} else {
		data.MainArticles = dynamicArticles
	}

	go func() {
		for {
			time.Sleep(1 * time.Hour)
			freshArticles, err := fetchAllNews()
			if err != nil {
				log.Printf("Error refreshing news: %v", err)
				continue
			}
			data.MainArticles = freshArticles
		}
	}()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		err := tmpl.Execute(w, data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			log.Printf("Error executing template: %v", err)
		}
	})

	http.HandleFunc("/style.css", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/css")
		w.Write([]byte(styleCSS))
	})

	http.HandleFunc("/main.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/javascript")
		w.Write([]byte(mainJS))
	})

	log.Printf("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
