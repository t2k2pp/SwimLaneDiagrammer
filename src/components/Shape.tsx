import React, { useState, useEffect } from 'react';
import type { Shape } from '../core/types';
import { useDiagramStore } from '../core/store';
import './Shape.css';

interface Props {
    shape: Shape;
}

export const ShapeComponent: React.FC<Props> = ({ shape }) => {
    const { selectItem, selectedIds, updateShapePosition, activeTool, connectionSourceId, setConnectionSource, addConnection, addHistorySnapshot } = useDiagramStore();

    // Check if shape is directly selected OR if its group is selected
    const isGroupSelected = shape.groupId && selectedIds.includes(shape.groupId);
    const isSelected = selectedIds.includes(shape.id) || isGroupSelected;

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

        // Determine what ID to select (shape ID or group ID)
        const idToSelect = shape.groupId || shape.id;
        const isTargetSelected = selectedIds.includes(idToSelect);

        // If shift key is pressed, toggle selection
        if (e.shiftKey) {
            selectItem(idToSelect, true);
        }
        // If not shift key, and target is NOT selected, select it (clearing others)
        else if (!isTargetSelected) {
            selectItem(idToSelect, false);
        }
        // If target IS selected and no shift key, do nothing to selection
        // This preserves multi-selection for dragging

        setIsDragging(true);
        setDragStart({
            x: e.clientX - shape.position.x,
            y: e.clientY - shape.position.y
        });
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
            style={{
                left: shape.position.x,
                top: shape.position.y,
                width: `${shape.size.width}px`,
                height: `${shape.size.height}px`,
                boxSizing: 'border-box',
                ...(shape.color ? { backgroundColor: shape.color } : {})
            }}
        >
            <span
                className="shape-label"
                style={{ color: shape.textColor === 'auto' ? 'inherit' : shape.textColor }}
            >
                {shape.label}
            </span>
        </div>
    );
};
