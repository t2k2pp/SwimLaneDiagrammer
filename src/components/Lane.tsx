import React, { useState, useEffect, useRef } from 'react';
import type { Lane } from '../core/types';
import { useDiagramStore } from '../core/store';
import { ShapeComponent } from './Shape';
import './Lane.css';

interface Props {
    lane: Lane;
    poolId: string;
    poolOrientation: 'horizontal' | 'vertical';
}

export const LaneComponent: React.FC<Props> = ({ lane, poolId, poolOrientation }) => {
    const { updateLaneHeight, addShape, shapes, selectItem, selectedIds, activeTool, clearSelection } = useDiagramStore();
    const [isResizing, setIsResizing] = useState(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);
    const isSelected = selectedIds.includes(lane.id);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const type = e.dataTransfer.getData('application/reactflow');
        const offsetX = parseFloat(e.dataTransfer.getData('offsetX') || '0');
        const offsetY = parseFloat(e.dataTransfer.getData('offsetY') || '0');

        if (type) {
            const rect = e.currentTarget.getBoundingClientRect();
            let x = e.clientX - rect.left - offsetX;
            let y = e.clientY - rect.top - offsetY;

            // Adjust for lane header
            if (poolOrientation === 'horizontal') {
                x -= 40; // Subtract header width
            } else {
                y -= 40; // Subtract header height
            }

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
        if (poolOrientation === 'horizontal') {
            startYRef.current = e.clientY;
        } else {
            startYRef.current = e.clientX; // For vertical pools, track horizontal movement
        }
        startHeightRef.current = lane.height;
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                let delta: number;
                if (poolOrientation === 'horizontal') {
                    delta = e.clientY - startYRef.current;
                } else {
                    delta = e.clientX - startYRef.current; // For vertical pools, use horizontal movement
                }
                const newHeight = Math.max(50, startHeightRef.current + delta);
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
            className={`lane lane-${poolOrientation} ${isSelected ? 'is-selected' : ''}`}
            style={
                poolOrientation === 'horizontal'
                    ? { height: lane.height }
                    : { width: lane.height } // For vertical pools, height becomes width
            }
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
