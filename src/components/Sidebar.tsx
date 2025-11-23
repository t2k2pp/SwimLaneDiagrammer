import React from 'react';
import { useDiagramStore } from '../core/store';
import { MousePointer, ArrowRight, Square, Circle, Diamond, PlayCircle, StopCircle, Columns2, Rows2, Type } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { activeTool, setActiveTool, poolPlacementMode, setPoolPlacementMode, addTextBox } = useDiagramStore();

    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('application/reactflow', type);
        e.dataTransfer.effectAllowed = 'move';

        // Calculate offset of mouse within the dragged element
        const rect = e.currentTarget.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        e.dataTransfer.setData('offsetX', offsetX.toString());
        e.dataTransfer.setData('offsetY', offsetY.toString());
    };

    return (
        <div className="sidebar">
            {/* Tools */}
            <div className="sidebar-group">
                <button
                    className={`sidebar-btn ${activeTool === 'select' ? 'active' : ''}`}
                    title="Select"
                    onClick={() => setActiveTool('select')}
                >
                    <MousePointer size={20} />
                </button>
                <button
                    className={`sidebar-btn ${activeTool === 'connection' ? 'active' : ''}`}
                    title="Connection"
                    onClick={() => setActiveTool('connection')}
                >
                    <ArrowRight size={20} />
                </button>
            </div>

            {/* Pool Creation */}
            <div className="sidebar-separator" />
            <div className="sidebar-group">
                <button
                    className={`sidebar-btn ${poolPlacementMode === 'horizontal' ? 'active' : ''}`}
                    title="Horizontal Pool (Lanes stack vertically)"
                    onClick={() => setPoolPlacementMode(poolPlacementMode === 'horizontal' ? null : 'horizontal')}
                >
                    <Rows2 size={20} />
                </button>
                <button
                    className={`sidebar-btn ${poolPlacementMode === 'vertical' ? 'active' : ''}`}
                    title="Vertical Pool (Lanes arranged horizontally)"
                    onClick={() => setPoolPlacementMode(poolPlacementMode === 'vertical' ? null : 'vertical')}
                >
                    <Columns2 size={20} />
                </button>
            </div>

            {/* Shapes */}
            <div className="sidebar-separator" />
            <div className="sidebar-group">
                <button className="sidebar-btn" title="Rectangle" draggable onDragStart={(e) => handleDragStart(e, 'rect')}>
                    <Square size={20} />
                </button>
                <button className="sidebar-btn" title="Rectangle Wide (1.5х)" draggable onDragStart={(e) => handleDragStart(e, 'rect-wide')}>
                    <Square size={20} style={{ transform: 'scaleX(1.5)' }} />
                </button>
                <button className="sidebar-btn" title="Rectangle Extra Wide (2х)" draggable onDragStart={(e) => handleDragStart(e, 'rect-extra-wide')}>
                    <Square size={20} style={{ transform: 'scaleX(2)' }} />
                </button>
                <button className="sidebar-btn" title="Circle" draggable onDragStart={(e) => handleDragStart(e, 'circle')}>
                    <Circle size={20} />
                </button>
                <button className="sidebar-btn" title="Diamond" draggable onDragStart={(e) => handleDragStart(e, 'diamond')}>
                    <Diamond size={20} />
                </button>
                <button className="sidebar-btn" title="Start" draggable onDragStart={(e) => handleDragStart(e, 'start')}>
                    <PlayCircle size={20} />
                </button>
                <button className="sidebar-btn" title="End" draggable onDragStart={(e) => handleDragStart(e, 'end')}>
                    <StopCircle size={20} />
                </button>
                <button className="sidebar-btn shape-document" title="Document" draggable onDragStart={(e) => handleDragStart(e, 'document')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 2h14v14c0 1-1 2-2 2H5c-1 0-2-1-2-2V2z" />
                        <path d="M3 18c2-1 4-1 6 0s4 1 6 0" fill="currentColor" opacity="0.1" />
                    </svg>
                </button>
                <button className="sidebar-btn shape-database" title="Database" draggable onDragStart={(e) => handleDragStart(e, 'database')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <ellipse cx="10" cy="5" rx="7" ry="3" />
                        <path d="M3 5v10c0 1.5 3 3 7 3s7-1.5 7-3V5" />
                        <path d="M3 10c0 1.5 3 3 7 3s7-1.5 7-3" />
                    </svg>
                </button>
                <button className="sidebar-btn shape-manual-input" title="Manual Input" draggable onDragStart={(e) => handleDragStart(e, 'manual-input')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 6L4 4h12l2 2v10H2V6z" />
                    </svg>
                </button>
                <button className="sidebar-btn shape-delay" title="Delay" draggable onDragStart={(e) => handleDragStart(e, 'delay')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 4h12v12H2V4z" />
                        <path d="M14 4v12c2-2 2-10 0-12z" />
                    </svg>
                </button>
            </div>

            {/* TextBox */}
            <div className="sidebar-separator" />
            <div className="sidebar-group">
                <button
                    className="sidebar-btn"
                    title="Add TextBox"
                    onClick={() => {
                        addTextBox({ x: 100, y: 100 });
                    }}
                >
                    <Type size={20} />
                </button>
            </div>
        </div>
    );
};
