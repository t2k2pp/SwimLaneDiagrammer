import React, { useEffect } from 'react';
import { useDiagramStore } from '../core/store';
import { PoolComponent } from './Pool';
import { ConnectionLayer } from './ConnectionLayer';
import './Canvas.css';

export const Canvas: React.FC = () => {
    const { pools, addPool, clearSelection, copyShape, pasteShape, undo, redo } = useDiagramStore();

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
            if (e.ctrl Key || e.metaKey) {
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

return (
    <div
        className="canvas"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
                clearSelection();
            }
        }}
        onDoubleClick={(e) => {
            if (e.target === e.currentTarget) {
                addPool({ x: e.clientX, y: e.clientY });
            }
        }}
    >
        {pools.map(pool => (
            <PoolComponent key={pool.id} pool={pool} />
        ))}
        <ConnectionLayer />

        <div className="canvas-hint">
            Drag shapes from toolbar or double click to add a Pool
        </div>
    </div>
);
};
