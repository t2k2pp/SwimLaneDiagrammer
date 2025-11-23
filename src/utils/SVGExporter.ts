// SVG Exporter Utility

export const exportToSVG = async () => {
    // Use .canvas selector as identified in Canvas.tsx
    const element = document.querySelector('.canvas') as HTMLElement;
    if (!element) {
        console.error('Canvas element not found');
        alert('Canvas element not found');
        return;
    }

    try {
        // Get the actual dimensions
        const width = element.scrollWidth;
        const height = element.scrollHeight;

        // Get computed styles for background
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;
        const backgroundImage = computedStyle.backgroundImage;
        const backgroundSize = computedStyle.backgroundSize;
        const backgroundPosition = computedStyle.backgroundPosition;

        // Collect all CSS rules
        let styles = '';
        try {
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    const rules = sheet.cssRules;
                    if (rules) {
                        for (const rule of Array.from(rules)) {
                            styles += rule.cssText + '\n';
                        }
                    }
                } catch (e) {
                    console.warn('Could not access stylesheet rules', e);
                }
            }
        } catch (e) {
            console.warn('Error collecting styles', e);
        }

        // Create a deep clone of the canvas
        const clone = element.cloneNode(true) as HTMLElement;

        // Process all SVG elements in the clone to resolve dynamic styles
        const svgs = clone.querySelectorAll('svg');
        svgs.forEach(svg => {
            // Find the original SVG element to get computed styles
            const originalSvg = element.querySelector(`svg.${svg.className.baseVal || svg.classList[0]}`) as SVGElement;
            if (originalSvg) {
                // Process all paths and other SVG elements
                const paths = svg.querySelectorAll('path, line, circle, polygon, polyline, rect, text');
                const originalPaths = originalSvg.querySelectorAll('path, line, circle, polygon, polyline, rect, text');

                paths.forEach((path, index) => {
                    if (originalPaths[index]) {
                        const pathComputedStyle = window.getComputedStyle(originalPaths[index]);

                        // Explicitly set stroke and fill from computed values
                        // Handle currentColor which doesn't resolve properly in foreignObject
                        let strokeColor = pathComputedStyle.stroke;
                        let fillColor = pathComputedStyle.fill;

                        // Resolve currentColor or empty values to explicit color
                        if (!strokeColor || strokeColor === 'none' || strokeColor.toLowerCase().includes('currentcolor')) {
                            strokeColor = 'rgb(100, 108, 255)'; // Default connection color
                        }
                        if (!fillColor || fillColor === 'none' || fillColor.toLowerCase().includes('currentcolor')) {
                            fillColor = 'rgb(100, 108, 255)'; // Default connection color
                        }

                        if (strokeColor && strokeColor !== 'none') {
                            (path as SVGElement).setAttribute('stroke', strokeColor);
                        }
                        if (fillColor && fillColor !== 'none') {
                            (path as SVGElement).setAttribute('fill', fillColor);
                        }
                        if (pathComputedStyle.strokeWidth) {
                            (path as SVGElement).setAttribute('stroke-width', pathComputedStyle.strokeWidth);
                        }
                        if (pathComputedStyle.strokeDasharray && pathComputedStyle.strokeDasharray !== 'none') {
                            (path as SVGElement).setAttribute('stroke-dasharray', pathComputedStyle.strokeDasharray);
                        }
                    }
                });
            }

            // Ensure SVG is visible and properly sized
            svg.style.overflow = 'visible';
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');

            if (svg.classList.contains('connection-layer')) {
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.style.left = '0';
                svg.style.pointerEvents = 'none';
            }
        });

        // Process TextBox elements to ensure content is captured
        const textBoxes = clone.querySelectorAll('.textbox');
        const originalTextBoxes = element.querySelectorAll('.textbox');

        textBoxes.forEach((textBox, index) => {
            if (originalTextBoxes[index]) {
                const originalContent = originalTextBoxes[index].querySelector('.textbox-content');
                const clonedContent = textBox.querySelector('.textbox-content');

                if (originalContent && clonedContent) {
                    // Force copy the rendered HTML content
                    clonedContent.innerHTML = originalContent.innerHTML;
                }

                // Apply computed styles explicitly
                const textBoxComputedStyle = window.getComputedStyle(originalTextBoxes[index] as Element);
                (textBox as HTMLElement).style.backgroundColor = textBoxComputedStyle.backgroundColor;
                (textBox as HTMLElement).style.color = textBoxComputedStyle.color;
                (textBox as HTMLElement).style.border = textBoxComputedStyle.border;
                (textBox as HTMLElement).style.opacity = textBoxComputedStyle.opacity;
            }
        });

        // Serialize the clone
        const serializer = new XMLSerializer();
        const clonedHTML = serializer.serializeToString(clone);

        // Create the final SVG
        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml">
                        <style>
                            ${styles}
                            /* Ensure the cloned element fits and has correct background */
                            .canvas {
                                width: 100%;
                                height: 100%;
                                overflow: visible;
                                background-color: ${backgroundColor};
                                background-image: ${backgroundImage};
                                background-size: ${backgroundSize};
                                background-position: ${backgroundPosition};
                                position: relative;
                            }
                            /* Ensure textboxes are visible */
                            .textbox {
                                position: absolute;
                            }
                            /* Ensure connection layer is visible */
                            .connection-layer {
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                overflow: visible;
                                pointer-events: none;
                            }
                        </style>
                        ${clonedHTML}
                    </div>
                </foreignObject>
            </svg>
        `;

        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Failed to export SVG:', error);
        alert('SVGエクスポートに失敗しました。');
    }
};
