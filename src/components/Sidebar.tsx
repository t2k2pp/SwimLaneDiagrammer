import React from 'react';
import { useDiagramStore } from '../core/store';
import { MousePointer, ArrowRight, Square, Circle, Diamond, PlayCircle, StopCircle, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignLeft, AlignCenter, AlignRight, Columns2, Rows2 } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { activeTool, setActiveTool, poolPlacementMode, setPoolPlacementMode, selectedIds, alignShapes } = useDiagramStore();

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

    const canAlign = selectedIds.length >= 2;

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
            </div>

            {/* Alignment */}
            <div className="sidebar-separator" />
            <div className="sidebar-group">
                <button className="sidebar-btn" title="Align Left" onClick={() => alignShapes('left')} disabled={!canAlign}>
                    <AlignStartVertical size={20} />
                </button>
                <button className="sidebar-btn" title="Align Center" onClick={() => alignShapes('center')} disabled={!canAlign}>
                    <AlignCenterVertical size={20} />
                </button>
                <button className="sidebar-btn" title="Align Right" onClick={() => alignShapes('right')} disabled={!canAlign}>
                    <AlignEndVertical size={20} />
                </button>
                <button className="sidebar-btn" title="Align Top" onClick={() => alignShapes('top')} disabled={!canAlign}>
                    <AlignLeft size={20} style={{ transform: 'rotate(90deg)' }} />
                </button>
                <button className="sidebar-btn" title="Align Middle" onClick={() => alignShapes('middle')} disabled={!canAlign}>
                    <AlignCenter size={20} style={{ transform: 'rotate(90deg)' }} />
                </button>
                <button className="sidebar-btn" title="Align Bottom" onClick={() => alignShapes('bottom')} disabled={!canAlign}>
                    <AlignRight size={20} style={{ transform: 'rotate(90deg)' }} />
                </button>
            </div>
        </div>
    );
};
