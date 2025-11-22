import React, { useState, useEffect } from 'react';
import type { Shape } from '../core/types';
import { useDiagramStore } from '../core/store';
import './Shape.css';

interface Props {
    shape: Shape;
}

export const ShapeComponent: React.FC<Props> = ({ shape }) => {
    const { selectItem, selectedIds, updateShapePosition, activeTool, connectionSourceId, setConnectionSource, addConnection, addHistorySnapshot } = useDiagramStore();
    const isSelected = selectedIds.includes(shape.id);
    const isConnectionSource = connectionSourceId === shape.id;
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (activeTool === 'connection') {
            if (connectionSourceId === null) {
                setConnectionSource(shape.id);
            } else if (connectionSourceId !== shape.id) {
                addConnection(connectionSourceId, shape.id);
                setConnectionSource(null); // Reset after connecting
            }
            return;
        }

        selectItem(shape.id, e.shiftKey);
        setIsDragging(true);
        setDragStart({
            x: e.clientX - shape.position.x,
            y: e.clientY - shape.position.y
        });
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (activeTool === 'connection') {
            e.preventDefault(); // Disable dragging in connection mode
            return;
        }
        e.dataTransfer.setData('application/shapeId', shape.id);
        e.dataTransfer.effectAllowed = 'move';
        // Store initial offset
        const rect = e.currentTarget.getBoundingClientRect();
        e.dataTransfer.setData('offsetX', (e.clientX - rect.left).toString());
        e.dataTransfer.setData('offsetY', (e.clientY - rect.top).toString());
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && activeTool === 'select') {
                updateShapePosition(shape.id, {
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                addHistorySnapshot(); // Save history after drag completes
            }
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, shape.id, updateShapePosition, activeTool, addHistorySnapshot]);

    return (
        <div
            className={`shape shape-${shape.type} ${isSelected ? 'selected' : ''} ${isConnectionSource ? 'connection-source' : ''}`}
            onMouseDown={handleMouseDown}
            draggable={activeTool === 'select'}
            onDragStart={handleDragStart}
            style={{
                left: shape.position.x,
                top: shape.position.y,
                width: `${shape.size.width}px`,
                height: `${shape.size.height}px`,
                boxSizing: 'border-box'
            }}
        >
            <span className="shape-label">{shape.label}</span>
        </div>
    );
};
