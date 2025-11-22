import React, { useState, useEffect } from 'react';
import type { Pool } from '../core/types';
import { useDiagramStore } from '../core/store';
import { LaneComponent } from './Lane';
import './Pool.css';

interface Props {
    pool: Pool;
}

export const PoolComponent: React.FC<Props> = ({ pool }) => {
    const { updatePoolPosition, addLane, selectItem, selectedIds, activeTool, clearSelection } = useDiagramStore();
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const isSelected = selectedIds.includes(pool.id);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.pool-controls')) return;

        // In select tool, allow canvas drag selection to work
        if (activeTool === 'select') {
            // Only stop propagation if clicking on pool header (not lane area)
            if ((e.target as HTMLElement).closest('.pool-header')) {
                e.stopPropagation();
                selectItem(pool.id);
            }
            // If clicking empty space in pool, clear selection
            else if (e.target === e.currentTarget) {
                clearSelection();
            }
            return;
        }

        e.stopPropagation();
        selectItem(pool.id);

        setIsDragging(true);
        setDragOffset({
            x: e.clientX - pool.position.x,
            y: e.clientY - pool.position.y
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updatePoolPosition(pool.id, {
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleMouseUp = () => {
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
    }, [isDragging, dragOffset, pool.id, updatePoolPosition]);

    return (
        <div
            className={`pool ${isSelected ? 'is-selected' : ''}`}
            style={{
                left: pool.position.x,
                top: pool.position.y,
                width: pool.width
            }}
        >
            <div className="pool-header" onMouseDown={handleMouseDown}>
                <div className="pool-title">{pool.title}</div>
                <div className="pool-controls">
                    <button onClick={() => addLane(pool.id)} title="Add Lane">+</button>
                </div>
            </div>
            <div className="pool-lanes">
                {pool.lanes.map(lane => (
                    <LaneComponent key={lane.id} lane={lane} poolId={pool.id} />
                ))}
            </div>
        </div>
    );
};
