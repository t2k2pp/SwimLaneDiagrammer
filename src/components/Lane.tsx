import React, { useState, useEffect, useRef } from 'react';
import type { Lane } from '../core/types';
import { useDiagramStore } from '../core/store';
import { ShapeComponent } from './Shape';
import './Lane.css';

interface Props {
    lane: Lane;
    poolId: string;
}

export const LaneComponent: React.FC<Props> = ({ lane, poolId }) => {
    const { updateLaneHeight, addShape, shapes, selectItem, selectedIds, activeTool, clearSelection } = useDiagramStore();
    const [isResizing, setIsResizing] = useState(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);
    const isSelected = selectedIds.includes(lane.id);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const type = e.dataTransfer.getData('application/reactflow');
        if (type) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            addShape(lane.id, type as any, { x, y });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // In select tool, allow canvas drag selection unless clicking lane title
        if (activeTool === 'select') {
            if ((e.target as HTMLElement).closest('.lane-title')) {
                e.stopPropagation();
                selectItem(lane.id);
            } else if (e.target === e.currentTarget) {
                // Clicking empty lane area - clear selection
                clearSelection();
            }
            // Don't stop propagation for lane body to allow drag selection
            return;
        }

        e.stopPropagation();
        selectItem(lane.id);
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        startYRef.current = e.clientY;
        startHeightRef.current = lane.height;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                const deltaY = e.clientY - startYRef.current;
                const newHeight = Math.max(50, startHeightRef.current + deltaY);
                updateLaneHeight(poolId, lane.id, newHeight);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, lane.id, poolId, updateLaneHeight]);

    return (
        <div
            className={`lane ${isSelected ? 'is-selected' : ''}`}
            style={{ height: lane.height }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseDown={handleMouseDown}
        >
            <div className="lane-header">
                <div className="lane-title-text">{lane.title}</div>
            </div>
            <div className="lane-content">
                {lane.shapeIds.map(shapeId => {
                    const shape = shapes[shapeId];
                    if (!shape) return null;
                    return <ShapeComponent key={shape.id} shape={shape} />;
                })}
            </div>
            <div
                className="lane-resize-handle"
                onMouseDown={handleResizeStart}
            />
        </div>
    );
};
