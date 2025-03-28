        document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('newspaper-container');
            const bgCanvas = document.getElementById('background-canvas');
            const overlayCanvas = document.getElementById('overlay-canvas');
            const bgCtx = bgCanvas.getContext('2d');
            const overlayCtx = overlayCanvas.getContext('2d');

            const createInkBleedFilter = () => {
                const svgNS = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(svgNS, "svg");
                svg.setAttribute("width", "0");
                svg.setAttribute("height", "0");
                svg.style.position = "absolute";

                const filter = document.createElementNS(svgNS, "filter");
                filter.setAttribute("id", "ink-bleed");

                const turbulence = document.createElementNS(svgNS, "feTurbulence");
                turbulence.setAttribute("type", "fractalNoise");
                turbulence.setAttribute("baseFrequency", "0.02");
                turbulence.setAttribute("numOctaves", "3");
                turbulence.setAttribute("seed", "3");
                turbulence.setAttribute("result", "noise");

                const displacementMap = document.createElementNS(svgNS, "feDisplacementMap");
                displacementMap.setAttribute("in", "SourceGraphic");
                displacementMap.setAttribute("in2", "noise");
                displacementMap.setAttribute("scale", "1");
                displacementMap.setAttribute("xChannelSelector", "R");
                displacementMap.setAttribute("yChannelSelector", "G");

                const blur = document.createElementNS(svgNS, "feGaussianBlur");
                blur.setAttribute("stdDeviation", "0.3");
                blur.setAttribute("result", "blur");

                const blend = document.createElementNS(svgNS, "feBlend");
                blend.setAttribute("in", "blur");
                blend.setAttribute("in2", "SourceGraphic");
                blend.setAttribute("mode", "multiply");

                filter.appendChild(turbulence);
                filter.appendChild(displacementMap);
                filter.appendChild(blur);
                filter.appendChild(blend);
                svg.appendChild(filter);

                return svg;
            };

            const svg = createInkBleedFilter();
            document.body.appendChild(svg);

            const style = document.createElement('style');
            style.textContent = `
                .newspaper-name, .article-headline {
                    filter: url('#ink-bleed');
                }

                .main-article .article-headline {
                    letter-spacing: 0.5px;
                    filter: url('#ink-bleed');
                }

                .textured-box-title, .advertisement-title {
                    filter: url('#ink-bleed');
                    letter-spacing: 0.3px;
                }

                .article-content p {
                    text-shadow: 0 0 0.7px rgba(0,0,0,0.2);
                    letter-spacing: 0.2px;
                    word-spacing: 0.5px;
                }
            `;
            document.head.appendChild(style);

            function setupCanvases() {
                const width = container.offsetWidth;
                const height = container.offsetHeight;

                bgCanvas.width = width;
                bgCanvas.height = height;
                overlayCanvas.width = width;
                overlayCanvas.height = height;

                drawBackground(bgCtx, width, height);
                drawOverlay(overlayCtx, width, height);
            }

            function drawBackground(ctx, width, height) {
                ctx.clearRect(0, 0, width, height);

                drawPaperTexture(ctx, width, height);
                drawFolds(ctx, width, height);
                drawStains(ctx, width, height);
            }

            function drawOverlay(ctx, width, height) {
                ctx.clearRect(0, 0, width, height);

                drawNoise(ctx, width, height);
                applyInkBlots(ctx, width, height);
                drawVignette(ctx, width, height);
            }

            function drawPaperTexture(ctx, width, height) {
                const gridSize = 10;
                ctx.strokeStyle = 'rgba(161, 146, 117, 0.05)';
                ctx.lineWidth = 0.5;

                for (let y = 0; y < height; y += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }

                for (let x = 0; x < width; x += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                    ctx.stroke();
                }

                for (let i = -height; i < width + height; i += 20) {
                    ctx.beginPath();
                    ctx.moveTo(i, 0);
                    ctx.lineTo(i + height, height);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(i, height);
                    ctx.lineTo(i + height, 0);
                    ctx.stroke();
                }
            }

            function drawFolds(ctx, width, height) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width / 2, height);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
                ctx.stroke();

                for (let i = 0; i < 8; i++) {
                    const x1 = Math.random() * width;
                    const y1 = Math.random() * height;
                    const length = 50 + Math.random() * 150;
                    const angle = Math.random() * Math.PI * 2;

                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(
                        x1 + Math.cos(angle) * length,
                        y1 + Math.sin(angle) * length
                    );
                    ctx.stroke();
                }
            }

            function drawStains(ctx, width, height) {
                const stainColors = [
                    'rgba(139, 100, 10, 0.13)',
                    'rgba(162, 122, 42, 0.10)',
                    'rgba(126, 88, 53, 0.09)',
                    'rgba(95, 75, 45, 0.08)',
                    'rgba(70, 55, 30, 0.07)'
                ];

                for (let i = 0; i < 25; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = 20 + Math.random() * 150;
                    const colorIndex = Math.floor(Math.random() * stainColors.length);

                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, stainColors[colorIndex]);
                    gradient.addColorStop(1, 'rgba(139, 100, 10, 0)');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }

                // More pronounced corner aging
                const corners = [
                    { x: 0, y: 0 },
                    { x: width, y: 0 },
                    { x: 0, y: height },
                    { x: width, y: height }
                ];

                corners.forEach(corner => {
                    const radius = Math.max(width, height) * 0.4;
                    const gradient = ctx.createRadialGradient(
                        corner.x, corner.y, 0,
                        corner.x, corner.y, radius
                    );
                    gradient.addColorStop(0, 'rgba(126, 88, 53, 0.15)');
                    gradient.addColorStop(1, 'rgba(126, 88, 53, 0)');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(corner.x, corner.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Coffee/tea stains
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = 30 + Math.random() * 50;

                    const gradient = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius);
                    gradient.addColorStop(0, 'rgba(140, 75, 45, 0.05)');
                    gradient.addColorStop(0.7, 'rgba(140, 75, 45, 0.08)');
                    gradient.addColorStop(1, 'rgba(140, 75, 45, 0)');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.strokeStyle = 'rgba(120, 70, 40, 0.07)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // Finger smudges
                for (let i = 0; i < 8; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = 10 + Math.random() * 25;

                    ctx.fillStyle = 'rgba(70, 60, 40, 0.04)';

                    // Draw oval-like shape for fingerprint
                    ctx.beginPath();
                    ctx.ellipse(
                        x, y,
                        radius, radius * (0.5 + Math.random() * 0.5),
                        Math.random() * Math.PI,
                        0, Math.PI * 2
                    );
                    ctx.fill();

                    // Add fingerprint-like lines
                    const lineCount = 3 + Math.random() * 5;
                    const lineLength = radius * 0.7;

                    for (let j = 0; j < lineCount; j++) {
                        const angle = Math.random() * Math.PI * 2;
                        ctx.strokeStyle = 'rgba(70, 60, 40, 0.03)';
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(
                            x + Math.cos(angle) * lineLength,
                            y + Math.sin(angle) * lineLength
                        );
                        ctx.stroke();
                    }
                }

                // Water damage
                for (let i = 0; i < 3; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = 40 + Math.random() * 80;

                    // Create irregular shape
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);

                    for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 8) {
                        const r = radius * (0.7 + Math.random() * 0.6);
                        const xPoint = x + Math.cos(angle) * r;
                        const yPoint = y + Math.sin(angle) * r;
                        ctx.lineTo(xPoint, yPoint);
                    }

                    ctx.closePath();

                    // Fill with subtle water damage color
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, 'rgba(180, 170, 150, 0.06)');
                    gradient.addColorStop(0.7, 'rgba(100, 90, 70, 0.04)');
                    gradient.addColorStop(1, 'rgba(100, 90, 70, 0)');

                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // Add darker edge to water damage
                    ctx.strokeStyle = 'rgba(90, 75, 50, 0.03)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            function drawNoise(ctx, width, height) {
                const imageData = ctx.createImageData(width, height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const value = Math.random() * 20;
                    data[i] = value;
                    data[i + 1] = value;
                    data[i + 2] = value;
                    data[i + 3] = 8;
                }

                ctx.putImageData(imageData, 0, 0);

                for (let i = 0; i < 500; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const radius = 0.2 + Math.random() * 1.2;

                    ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Add paper fiber texture
                for (let i = 0; i < 2000; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const length = 2 + Math.random() * 5;
                    const angle = Math.random() * Math.PI;

                    ctx.strokeStyle = `rgba(${180 + Math.random() * 40}, ${170 + Math.random() * 40}, ${150 + Math.random() * 40}, 0.1)`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
                    ctx.stroke();
                }
            }

            function applyInkBlots(ctx, width, height) {
                ctx.save();

                ctx.fillStyle = 'rgba(60, 45, 15, 0.03)';
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = 'rgba(54, 36, 10, 0.025)';

                const columnWidth = width * 0.7;
                ctx.fillRect(30, 200, columnWidth - 60, height - 250);

                for (let i = 0; i < 30; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = 10 + Math.random() * 50;

                    ctx.globalAlpha = 0.01 + Math.random() * 0.025;
                    ctx.fillStyle = `rgba(${40 + Math.random() * 20}, ${25 + Math.random() * 15}, ${5 + Math.random() * 10}, 0.05)`;
                    ctx.fillRect(x, y, size, size);
                }

                ctx.fillStyle = 'rgba(255, 252, 235, 0.01)';
                for (let i = 0; i < 15; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = 20 + Math.random() * 60;
                    ctx.fillRect(x, y, size, size);
                }

                ctx.restore();
            }

            function drawVignette(ctx, width, height) {
                const gradient = ctx.createRadialGradient(
                    width/2, height/2, width * 0.3,
                    width/2, height/2, width * 0.9
                );

                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(0.7, 'rgba(30, 20, 10, 0.05)');
                gradient.addColorStop(1, 'rgba(30, 20, 10, 0.2)');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = 'rgba(255, 240, 200, 0.03)';
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillRect(0, 0, width, height);
                ctx.globalCompositeOperation = 'source-over';
            }

            function applyInkBlotEffect() {
                const textElements = document.querySelectorAll('.article-content p, .article-headline, .textured-box p, .advertisement-content p');

                textElements.forEach(element => {
                    const text = element.textContent;
                    let newHtml = '';

                    const words = text.split(' ');
                    words.forEach((word, index) => {
                        // Increase chance of ink blots
                        if (Math.random() < 0.35) {
                            const blotIntensity = Math.random() < 0.3 ? 0.25 : 0.15;
                            // Add slight offset to some blots
                            const offsetX = Math.random() < 0.5 ? '0.5px' : '0';
                            const offsetY = Math.random() < 0.5 ? '0.5px' : '0';
                            const blurAmount = 0.7 + Math.random() * 0.5;

                            newHtml += `<span class="ink-blot" style="position:relative; display:inline-block;">
                                ${word}
                                <span style="position:absolute; left:${offsetX}; top:${offsetY}; opacity:${blotIntensity};
                                filter:blur(${blurAmount}px); transform:scale(1.01); pointer-events:none;">
                                ${word}
                                </span>
                            </span>`;
                        } else {
                            newHtml += word;
                        }

                        if (index < words.length - 1) {
                            newHtml += ' ';
                        }
                    });

                    element.innerHTML = newHtml;
                });

                const container = document.getElementById('newspaper-content');

                // More ink spots and more variety
                for (let i = 0; i < 40; i++) {
                    const spot = document.createElement('div');
                    const size = 1 + Math.random() * 4;
                    const opacity = 0.5 + Math.random() * 0.4;

                    spot.style.position = 'absolute';
                    spot.style.width = `${size}px`;
                    spot.style.height = `${size * (0.8 + Math.random() * 0.4)}px`;
                    spot.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
                    spot.style.borderRadius = '50%';
                    spot.style.left = `${Math.random() * 100}%`;
                    spot.style.top = `${Math.random() * 100}%`;
                    spot.style.pointerEvents = 'none';
                    spot.style.zIndex = '3';

                    // Randomly rotate some spots
                    if (Math.random() < 0.5) {
                        const rotation = Math.random() * 360;
                        spot.style.transform = `rotate(${rotation}deg)`;
                    }

                    container.appendChild(spot);
                }

                // Add ink smudges
                for (let i = 0; i < 15; i++) {
                    const smudge = document.createElement('div');
                    const width = 4 + Math.random() * 20;
                    const height = 2 + Math.random() * 5;
                    const opacity = 0.05 + Math.random() * 0.1;

                    smudge.style.position = 'absolute';
                    smudge.style.width = `${width}px`;
                    smudge.style.height = `${height}px`;
                    smudge.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
                    smudge.style.borderRadius = '40%';
                    smudge.style.left = `${Math.random() * 100}%`;
                    smudge.style.top = `${Math.random() * 100}%`;
                    smudge.style.pointerEvents = 'none';
                    smudge.style.zIndex = '3';
                    smudge.style.filter = 'blur(1px)';

                    // Rotate smudges randomly
                    const rotation = Math.random() * 360;
                    smudge.style.transform = `rotate(${rotation}deg)`;

                    container.appendChild(smudge);
                }

                // Add occasional torn edge effect
                if (Math.random() < 0.7) {
                    const tornEdge = document.createElement('div');
                    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
                    const size = 5 + Math.random() * 15;

                    tornEdge.style.position = 'absolute';
                    tornEdge.style.backgroundColor = 'transparent';
                    tornEdge.style.zIndex = '10';

                    // Position based on side
                    switch(side) {
                        case 0: // top
                            tornEdge.style.top = '0';
                            tornEdge.style.left = `${20 + Math.random() * 60}%`;
                            tornEdge.style.width = `${size * 2}px`;
                            tornEdge.style.height = `${size}px`;
                            tornEdge.style.borderBottomLeftRadius = '40%';
                            tornEdge.style.borderBottomRightRadius = '40%';
                            break;
                        case 1: // right
                            tornEdge.style.right = '0';
                            tornEdge.style.top = `${20 + Math.random() * 60}%`;
                            tornEdge.style.width = `${size}px`;
                            tornEdge.style.height = `${size * 2}px`;
                            tornEdge.style.borderTopLeftRadius = '40%';
                            tornEdge.style.borderBottomLeftRadius = '40%';
                            break;
                        case 2: // bottom
                            tornEdge.style.bottom = '0';
                            tornEdge.style.left = `${20 + Math.random() * 60}%`;
                            tornEdge.style.width = `${size * 2}px`;
                            tornEdge.style.height = `${size}px`;
                            tornEdge.style.borderTopLeftRadius = '40%';
                            tornEdge.style.borderTopRightRadius = '40%';
                            break;
                        case 3: // left
                            tornEdge.style.left = '0';
                            tornEdge.style.top = `${20 + Math.random() * 60}%`;
                            tornEdge.style.width = `${size}px`;
                            tornEdge.style.height = `${size * 2}px`;
                            tornEdge.style.borderTopRightRadius = '40%';
                            tornEdge.style.borderBottomRightRadius = '40%';
                            break;
                    }

                    tornEdge.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.3)';
                    tornEdge.style.background = '#1a2633';

                    document.getElementById('newspaper-container').appendChild(tornEdge);
                }
            }

            setupCanvases();
            applyInkBlotEffect();
            window.addEventListener('resize', setupCanvases);
        });
