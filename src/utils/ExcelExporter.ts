import ExcelJS from 'exceljs';
import { useDiagramStore } from '../core/store';

export const exportToExcelCells = async () => {
    const state = useDiagramStore.getState();
    const { pools, shapes } = state;

    if (pools.length === 0) {
        alert('出力する図形がありません');
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Swimlane Diagram', {
        views: [{ showGridLines: false }]
    });

    // Set column widths (6 pixels per unit approximately)
    for (let i = 1; i <= 200; i++) {
        worksheet.getColumn(i).width = 2;
    }

    // Set row heights
    for (let i = 1; i <= 200; i++) {
        worksheet.getRow(i).height = 15;
    }

    const pixelToCol = (px: number) => Math.round(px / 12);
    const pixelToRow = (px: number) => Math.round(px / 20);

    // Draw each pool
    pools.forEach(pool => {
        const poolX = pixelToCol(pool.position.x);
        const poolY = pixelToRow(pool.position.y);
        const poolWidth = pixelToCol(pool.width);

        // Calculate total pool height
        let totalHeight = 0;
        pool.lanes.forEach(lane => {
            totalHeight += lane.height;
        });

        const headerHeight = pixelToRow(40);

        // Merge cells for pool header
        worksheet.mergeCells(poolY, poolX, poolY + headerHeight - 1, poolX + poolWidth - 1);

        // Pool header cell styling
        const poolHeaderCell = worksheet.getCell(poolY, poolX);
        poolHeaderCell.value = pool.title;
        poolHeaderCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        poolHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
        poolHeaderCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2D2D2D' }
        };
        poolHeaderCell.border = {
            top: { style: 'medium', color: { argb: 'FF444444' } },
            left: { style: 'medium', color: { argb: 'FF444444' } },
            bottom: { style: 'medium', color: { argb: 'FF444444' } },
            right: { style: 'medium', color: { argb: 'FF444444' } }
        };

        // Draw lanes
        let currentY = poolY + headerHeight;
        pool.lanes.forEach(lane => {
            const laneHeight = pixelToRow(lane.height);
            const laneHeaderWidth = pixelToCol(40);

            // Merge cells for lane header (vertical orientation)
            worksheet.mergeCells(currentY, poolX, currentY + laneHeight - 1, poolX + laneHeaderWidth - 1);

            // Lane header cell
            const laneHeaderCell = worksheet.getCell(currentY, poolX);
            laneHeaderCell.value = lane.title;
            laneHeaderCell.font = { color: { argb: 'FFAAAAAA' }, size: 10, bold: true };
            laneHeaderCell.alignment = {
                textRotation: 90,
                vertical: 'middle',
                horizontal: 'center'
            };
            laneHeaderCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF383838' }
            };
            laneHeaderCell.border = {
                top: { style: 'thin', color: { argb: 'FF555555' } },
                left: { style: 'thin', color: { argb: 'FF555555' } },
                bottom: { style: 'thin', color: { argb: 'FF555555' } },
                right: { style: 'thin', color: { argb: 'FF555555' } }
            };

            // Draw lane content area
            for (let row = currentY; row < currentY + laneHeight; row++) {
                for (let col = poolX + laneHeaderWidth; col < poolX + poolWidth; col++) {
                    const cell = worksheet.getCell(row, col);
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF1E1E1E' }
                    };
                    if (row === currentY + laneHeight - 1) {
                        cell.border = {
                            bottom: { style: 'thin', color: { argb: 'FF444444' } }
                        };
                    }
                }
            }

            // Draw shapes in this lane
            lane.shapeIds.forEach(shapeId => {
                const shape = shapes[shapeId];
                if (!shape) return;

                const shapeX = poolX + laneHeaderWidth + pixelToCol(shape.position.x);
                const shapeY = currentY + pixelToRow(shape.position.y);
                const shapeWidth = pixelToCol(shape.size.width);
                const shapeHeight = pixelToRow(shape.size.height);

                // Merge cells for shape
                if (shapeWidth > 0 && shapeHeight > 0) {
                    worksheet.mergeCells(
                        shapeY,
                        shapeX,
                        shapeY + shapeHeight - 1,
                        shapeX + shapeWidth - 1
                    );
                }

                // Determine color based on type
                let fillColor = 'FF646CFF'; // Default blue
                if (shape.type === 'start') fillColor = 'FF4CAF50';
                if (shape.type === 'end') fillColor = 'FFF44336';
                if (shape.type === 'diamond') fillColor = 'FFFFEB3B';

                // Shape cell styling
                const shapeCell = worksheet.getCell(shapeY, shapeX);
                shapeCell.value = shape.label;
                shapeCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
                shapeCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                shapeCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: fillColor }
                };
                shapeCell.border = {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'medium', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'medium', color: { argb: 'FF000000' } }
                };
            });

            currentY += laneHeight;
        });
    });

    // Save file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swimlane-cells.xlsx';
    a.click();
    URL.revokeObjectURL(url);
};
