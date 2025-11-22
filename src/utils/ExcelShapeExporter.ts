import ExcelJS from 'exceljs';
import { useDiagramStore } from '../core/store';

export const exportToExcelShapes = async () => {
    const state = useDiagramStore.getState();
    const { pools, shapes, connections } = state;

    if (pools.length === 0) {
        alert('出力する図形がありません');
        return;
    }

    // Create an SVG representation of the diagram
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // Calculate bounds
    let maxX = 0;
    let maxY = 0;
    pools.forEach(pool => {
        const poolRight = pool.position.x + pool.width;
        let poolBottom = pool.position.y + 40; // header
        pool.lanes.forEach(lane => poolBottom += lane.height);
        maxX = Math.max(maxX, poolRight);
        maxY = Math.max(maxY, poolBottom);
    });

    svg.setAttribute('width', (maxX + 100).toString());
    svg.setAttribute('height', (maxY + 100).toString());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Style
    svg.style.backgroundColor = '#1e1e1e';

    // Draw each pool
    pools.forEach(pool => {
        const poolX = pool.position.x;
        const poolY = pool.position.y;

        // Pool header
        const poolHeader = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        poolHeader.setAttribute('x', poolX.toString());
        poolHeader.setAttribute('y', poolY.toString());
        poolHeader.setAttribute('width', pool.width.toString());
        poolHeader.setAttribute('height', '40');
        poolHeader.setAttribute('fill', '#2d2d2d');
        poolHeader.setAttribute('stroke', '#444');
        poolHeader.setAttribute('stroke-width', '2');
        svg.appendChild(poolHeader);

        // Pool title
        const poolTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        poolTitle.setAttribute('x', (poolX + pool.width / 2).toString());
        poolTitle.setAttribute('y', (poolY + 25).toString());
        poolTitle.setAttribute('text-anchor', 'middle');
        poolTitle.setAttribute('fill', 'white');
        poolTitle.setAttribute('font-size', '14');
        poolTitle.setAttribute('font-weight', 'bold');
        poolTitle.textContent = pool.title;
        svg.appendChild(poolTitle);

        // Draw lanes
        let currentY = poolY + 40;
        pool.lanes.forEach(lane => {
            // Lane header (left 40px)
            const laneHeader = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            laneHeader.setAttribute('x', poolX.toString());
            laneHeader.setAttribute('y', currentY.toString());
            laneHeader.setAttribute('width', '40');
            laneHeader.setAttribute('height', lane.height.toString());
            laneHeader.setAttribute('fill', '#383838');
            laneHeader.setAttribute('stroke', '#555');
            laneHeader.setAttribute('stroke-width', '1');
            svg.appendChild(laneHeader);

            // Lane title (rotated)
            const laneTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            laneTitle.setAttribute('x', (poolX + 20).toString());
            laneTitle.setAttribute('y', (currentY + lane.height / 2).toString());
            laneTitle.setAttribute('text-anchor', 'middle');
            laneTitle.setAttribute('fill', '#aaa');
            laneTitle.setAttribute('font-size', '12');
            laneTitle.setAttribute('transform', `rotate(-90, ${poolX + 20}, ${currentY + lane.height / 2})`);
            laneTitle.textContent = lane.title;
            svg.appendChild(laneTitle);

            // Lane content area
            const laneContent = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            laneContent.setAttribute('x', (poolX + 40).toString());
            laneContent.setAttribute('y', currentY.toString());
            laneContent.setAttribute('width', (pool.width - 40).toString());
            laneContent.setAttribute('height', lane.height.toString());
            laneContent.setAttribute('fill', '#1e1e1e');
            laneContent.setAttribute('stroke', '#444');
            laneContent.setAttribute('stroke-width', '1');
            svg.appendChild(laneContent);

            // Draw shapes in this lane
            lane.shapeIds.forEach(shapeId => {
                const shape = shapes[shapeId];
                if (!shape) return;

                const shapeX = poolX + 40 + shape.position.x;
                const shapeY = currentY + shape.position.y;

                // Determine color based on type
                let fillColor = '#646CFF'; // Default blue
                if (shape.type === 'start') fillColor = '#4CAF50';
                if (shape.type === 'end') fillColor = '#F44336';
                if (shape.type === 'diamond') fillColor = '#FFEB3B';

                // Draw shape based on type
                let shapeElement;
                if (shape.type === 'circle' || shape.type === 'start' || shape.type === 'end') {
                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                    shapeElement.setAttribute('cx', (shapeX + shape.size.width / 2).toString());
                    shapeElement.setAttribute('cy', (shapeY + shape.size.height / 2).toString());
                    shapeElement.setAttribute('rx', (shape.size.width / 2).toString());
                    shapeElement.setAttribute('ry', (shape.size.height / 2).toString());
                } else if (shape.type === 'diamond') {
                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    const cx = shapeX + shape.size.width / 2;
                    const cy = shapeY + shape.size.height / 2;
                    const points = `${cx},${shapeY} ${shapeX + shape.size.width},${cy} ${cx},${shapeY + shape.size.height} ${shapeX},${cy}`;
                    shapeElement.setAttribute('points', points);
                } else {
                    // rectangle
                    shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    shapeElement.setAttribute('x', shapeX.toString());
                    shapeElement.setAttribute('y', shapeY.toString());
                    shapeElement.setAttribute('width', shape.size.width.toString());
                    shapeElement.setAttribute('height', shape.size.height.toString());
                    shapeElement.setAttribute('rx', '4');
                }

                shapeElement.setAttribute('fill', fillColor);
                shapeElement.setAttribute('stroke', '#000');
                shapeElement.setAttribute('stroke-width', '2');
                svg.appendChild(shapeElement);

                // Shape label
                const shapeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                shapeLabel.setAttribute('x', (shapeX + shape.size.width / 2).toString());
                shapeLabel.setAttribute('y', (shapeY + shape.size.height / 2 + 4).toString());
                shapeLabel.setAttribute('text-anchor', 'middle');
                shapeLabel.setAttribute('fill', 'white');
                shapeLabel.setAttribute('font-size', '10');
                shapeLabel.setAttribute('font-weight', 'bold');
                shapeLabel.textContent = shape.label || '';
                svg.appendChild(shapeLabel);
            });

            currentY += lane.height;
        });
    });

    // Draw connections
    connections.forEach(conn => {
        const sourceShape = shapes[conn.sourceShapeId];
        const targetShape = shapes[conn.targetShapeId];
        if (!sourceShape || !targetShape) return;

        // Find absolute positions
        const getAbsolutePosition = (shape: typeof sourceShape) => {
            for (const pool of pools) {
                let laneY = 0;
                for (const lane of pool.lanes) {
                    if (lane.id === shape.parentId) {
                        return {
                            x: pool.position.x + 40 + shape.position.x,
                            y: pool.position.y + 40 + laneY + shape.position.y
                        };
                    }
                    laneY += lane.height;
                }
            }
            return null;
        };

        const sourcePos = getAbsolutePosition(sourceShape);
        const targetPos = getAbsolutePosition(targetShape);
        if (!sourcePos || !targetPos) return;

        // Calculate connection points (center of shapes for now)
        const sourceCenterX = sourcePos.x + sourceShape.size.width / 2;
        const sourceCenterY = sourcePos.y + sourceShape.size.height / 2;
        const targetCenterX = targetPos.x + targetShape.size.width / 2;
        const targetCenterY = targetPos.y + targetShape.size.height / 2;

        // Calculate edge points
        const dx = targetCenterX - sourceCenterX;
        const dy = targetCenterY - sourceCenterY;
        const angle = Math.atan2(dy, dx);

        let startX, startY, endX, endY;

        // Source exit point
        if (Math.abs(angle) < Math.PI / 4) {
            startX = sourcePos.x + sourceShape.size.width;
            startY = sourceCenterY;
        } else if (Math.abs(angle) > 3 * Math.PI / 4) {
            startX = sourcePos.x;
            startY = sourceCenterY;
        } else if (angle > 0) {
            startX = sourceCenterX;
            startY = sourcePos.y + sourceShape.size.height;
        } else {
            startX = sourceCenterX;
            startY = sourcePos.y;
        }

        // Target entry point
        const reverseAngle = angle + Math.PI;
        if (Math.abs(reverseAngle) < Math.PI / 4 || Math.abs(reverseAngle) > 7 * Math.PI / 4) {
            endX = targetPos.x + targetShape.size.width;
            endY = targetCenterY;
        } else if (Math.abs(reverseAngle) > 3 * Math.PI / 4 && Math.abs(reverseAngle) < 5 * Math.PI / 4) {
            endX = targetPos.x;
            endY = targetCenterY;
        } else if (reverseAngle > 0 && reverseAngle < Math.PI) {
            endX = targetCenterX;
            endY = targetPos.y + targetShape.size.height;
        } else {
            endX = targetCenterX;
            endY = targetPos.y;
        }

        // Draw line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX.toString());
        line.setAttribute('y1', startY.toString());
        line.setAttribute('x2', endX.toString());
        line.setAttribute('y2', endY.toString());
        line.setAttribute('stroke', '#646cff');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(line);
    });

    // Add arrowhead marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('refX', '10');
    marker.setAttribute('refY', '3.5');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
    polygon.setAttribute('fill', '#646cff');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.insertBefore(defs, svg.firstChild);

    // Convert SVG to image
    const svgString = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Load image
    const img = new Image();
    img.onload = async () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = maxX + 100;
        canvas.height = maxY + 100;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Convert to PNG
        canvas.toBlob(async (blob) => {
            if (!blob) return;

            const buffer = await blob.arrayBuffer();

            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Swimlane Diagram');

            // Add image to workbook
            const imageId = workbook.addImage({
                buffer: buffer as any,
                extension: 'png',
            });

            // Insert image at A1, scale to fit
            worksheet.addImage(imageId, {
                tl: { col: 0, row: 0 },
                ext: { width: maxX + 100, height: maxY + 100 }
            });

            // Set sheet view
            worksheet.views = [{ showGridLines: false }];

            // Save file
            const excelBuffer = await workbook.xlsx.writeBuffer();
            const excelBlob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const excelUrl = URL.createObjectURL(excelBlob);
            const a = document.createElement('a');
            a.href = excelUrl;
            a.download = 'swimlane-shapes.xlsx';
            a.click();
            URL.revokeObjectURL(excelUrl);
        }, 'image/png');

        URL.revokeObjectURL(url);
    };
    img.src = url;
};
