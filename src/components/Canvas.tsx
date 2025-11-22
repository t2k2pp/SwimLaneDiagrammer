import React, { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../core/store';
import { PoolComponent } from './Pool';
import { ConnectionLayer } from './ConnectionLayer';
import './Canvas.css';
import type { Position } from '../core/types';

export const Canvas: React.FC = () => {
    const { pools, shapes, addPool, clearSelection, copyShape, pasteShape, undo, redo, activeTool, poolPlacementMode, selectMultipleShapes } = useDiagramStore();
    const [selectionBox, setSelectionBox] = useState<{ start: Position; current: Position } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo: Ctrl+Z
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Redo: Ctrl+Shift+Z or Ctrl+Y
            if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                redo();
                return;
            }

            // Copy/Paste
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'c') {
                    copyShape();
                } else if (e.key === 'v') {
                    pasteShape();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [copyShape, pasteShape, undo, redo]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (selectionBox && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setSelectionBox({
                    ...selectionBox,
                    current: {
                        x: e.clientX - rect.left + canvasRef.current.scrollLeft,
                        y: e.clientY - rect.top + canvasRef.current.scrollTop
                    }
                });
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (selectionBox) {
                // Find shapes within selection box
                const minX = Math.min(selectionBox.start.x, selectionBox.current.x);
                const maxX = Math.max(selectionBox.start.x, selectionBox.current.x);
                const minY = Math.min(selectionBox.start.y, selectionBox.current.y);
                const maxY = Math.max(selectionBox.start.y, selectionBox.current.y);

                const selectedShapeIds: string[] = [];
                Object.values(shapes).forEach(shape => {
                    // Get Pool and Lane for this shape
                    let poolX = 0, poolY = 0, laneY = 0;
                    for (const pool of pools) {
                        for (const lane of pool.lanes) {
                            if (lane.shapeIds.includes(shape.id)) {
                                poolX = pool.position.x;
                                poolY = pool.position.y;
                                // Calculate lane Y offset
                                let currentY = 50; // Pool header height
                                for (const l of pool.lanes) {
                                    if (l.id === lane.id) {
                                        laneY = currentY;
                                        break;
                                    }
                                    currentY += l.height;
                                }
                                break;
                            }
                        }
                    }

                    // Shape absolute position
                    const absoluteX = poolX + shape.position.x;
                    const absoluteY = poolY + laneY + shape.position.y;
                    const shapeCenterX = absoluteX + shape.size.width / 2;
                    const shapeCenterY = absoluteY + shape.size.height / 2;

                    console.log(`Shape ${shape.id}:`, {
                        shapePos: shape.position,
                        poolOffset: { poolX, poolY, laneY },
                        absolute: { absoluteX, absoluteY },
                        center: { shapeCenterX, shapeCenterY }
                    });

                    if (shapeCenterX >= minX && shapeCenterX <= maxX &&
                        shapeCenterY >= minY && shapeCenterY <= maxY) {
                        selectedShapeIds.push(shape.id);
                    }
                });

                console.log('Selection box:', { minX, maxX, minY, maxY });
                console.log('Selected shapes:', selectedShapeIds);

                if (selectedShapeIds.length > 0) {
                    selectMultipleShapes(selectedShapeIds);
                } else if (!(e as MouseEvent).shiftKey) {
                    // Clear selection if clicking empty space (and not holding shift)
                    selectMultipleShapes([]);
                }

                setSelectionBox(null);
            }
        };

        if (selectionBox) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [selectionBox, shapes, selectMultipleShapes]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/reactflow');

        if (type) {
            addPool({ x: e.clientX, y: e.clientY });
        }
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Handle pool placement mode
        if (poolPlacementMode && e.target === e.currentTarget) {
            addPool({ x: e.clientX, y: e.clientY }, poolPlacementMode);
            return;
        }

        // Allow drag selection even if clicking on Pool/Lane (bubbled events)
        // Shapes and specific controls stop propagation, so they won't trigger this
        if (canvasRef.current) {
            if (activeTool === 'select') {
                const rect = canvasRef.current.getBoundingClientRect();
                // Start drag selection with Canvas-relative coordinates
                setSelectionBox({
                    start: {
                        x: e.clientX - rect.left + canvasRef.current.scrollLeft,
                        y: e.clientY - rect.top + canvasRef.current.scrollTop
                    },
                    current: {
                        x: e.clientX - rect.left + canvasRef.current.scrollLeft,
                        y: e.clientY - rect.top + canvasRef.current.scrollTop
                    }
                });
            } else {
                // If not in select mode, clicking canvas clears selection
                // But only if clicking directly on canvas, to avoid clearing when interacting with other elements
                if (e.target === e.currentTarget) {
                    clearSelection();
                }
            }
        }
    };

    return (
        <div
            ref={canvasRef}
            className={`canvas ${poolPlacementMode ? 'pool-placement' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseDown={handleCanvasMouseDown}
        >
            {pools.map(pool => (
                <PoolComponent key={pool.id} pool={pool} />
            ))}
            <ConnectionLayer />

            {selectionBox && (
                <div
                    className="selection-box"
                    style={{
                        left: Math.min(selectionBox.start.x, selectionBox.current.x),
                        top: Math.min(selectionBox.start.y, selectionBox.current.y),
                        width: Math.abs(selectionBox.current.x - selectionBox.start.x),
                        height: Math.abs(selectionBox.current.y - selectionBox.start.y),
                    }}
                />
            )}

            <div className="canvas-hint">
                Drag shapes from toolbar or double click to add a Pool
            </div>
        </div>
    );
};
