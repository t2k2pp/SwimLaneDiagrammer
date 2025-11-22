import React, { useRef } from 'react';
import { Square, Circle, Diamond, PlayCircle, StopCircle, MousePointer, Save, Upload, Trash2, ArrowRight, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical } from 'lucide-react';
import { useDiagramStore } from '../core/store';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
    const { pools, shapes, clearDiagram, loadDiagram, activeTool, setActiveTool, undo, redo, historyIndex, history, selectedIds, alignShapes } = useDiagramStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('application/reactflow', type);
        e.dataTransfer.effectAllowed = 'move';
    };

    const canAlign = selectedIds.length >= 2;

    return (
        <div className="toolbar">
            <div className="tool-group">
                <button className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`} title="Select" onClick={() => setActiveTool('select')}>
                    <MousePointer size={20} />
                </button>
                <button className={`tool-btn ${activeTool === 'connection' ? 'active' : ''}`} title="Connection Tool" onClick={() => setActiveTool('connection')}>
                    <ArrowRight size={20} />
                </button>
                <button
                    className="tool-btn"
                    title="Undo (Ctrl+Z)"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                >
                    <Undo2 size={20} />
                </button>
                <button
                    className="tool-btn"
                    title="Redo (Ctrl+Shift+Z)"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                >
                    <Redo2 size={20} />
                </button>
            </div>

            <div className="separator" />

            <div className="tool-group">
                <button className="tool-btn" title="Align Left" onClick={() => alignShapes('left')} disabled={!canAlign}>
                    <AlignStartVertical size={20} />
                </button>
                <button className="tool-btn" title="Align Center" onClick={() => alignShapes('center')} disabled={!canAlign}>
                    <AlignCenterVertical size={20} />
                </button>
                <button className="tool-btn" title="Align Right" onClick={() => alignShapes('right')} disabled={!canAlign}>
                    <AlignEndVertical size={20} />
                </button>
                <button className="tool-btn" title="Align Top" onClick={() => alignShapes('top')} disabled={!canAlign}>
                    <AlignLeft size={20} style={{ transform: 'rotate(90deg)' }} />
                </button>
                <button className="tool-btn" title="Align Middle" onClick={() => alignShapes('middle')} disabled={!canAlign}>
                    <AlignCenter size={20} style={{ transform: 'rotate(90deg)' }} />
                </button>
                <button className="tool-btn" title="Align Bottom" onClick={() => alignShapes('bottom')} disabled={!canAlign}>
                    <AlignRight size={20} style={{ transform: 'rotate(90deg)' }} />
                </button>
            </div>

            <div className="separator" />

            <div className="tool-group">
                <button
                    className="tool-btn"
                    title="Rectangle"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'rect')}
                >
                    <Square size={20} />
                </button>
                <button
                    className="tool-btn"
                    title="Circle"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'circle')}
                >
                    <Circle size={20} />
                </button>
                <button
                    className="tool-btn"
                    title="Diamond"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'diamond')}
                >
                    <Diamond size={20} />
                </button>
            </div>

            <div className="separator" />

            <div className="tool-group">
                <button
                    className="tool-btn"
                    title="Start"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'start')}
                >
                    <PlayCircle size={20} />
                </button>
                <button
                    className="tool-btn"
                    title="End"
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'end')}
                >
                    <StopCircle size={20} />
                </button>
            </div>

            <div className="separator" />

            <div className="tool-group">
                <button
                    className="tool-btn"
                    title="Clear Diagram"
                    onClick={() => {
                        if (window.confirm('Are you sure you want to clear the diagram?')) {
                            clearDiagram();
                        }
                    }}
                >
                    <Trash2 size={20} />
                </button>
                <button
                    className="tool-btn"
                    title="Save Diagram"
                    onClick={() => {
                        const data = JSON.stringify({ pools, shapes }, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'diagram.json';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    <Save size={20} />
                </button>
                <button
                    className="tool-btn"
                    title="Load Diagram"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload size={20} />
                </button>
                <button
                    className="tool-btn"
                    title="Export PDF"
                    onClick={async () => {
                        const { exportToPDF } = await import('../utils/PDFExporter');
                        exportToPDF();
                    }}
                >
                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>PDF</span>
                </button>
                <button
                    className="tool-btn"
                    title="Export Excel (Cells)"
                    onClick={async () => {
                        const { exportToExcelCells } = await import('../utils/ExcelExporter');
                        exportToExcelCells();
                    }}
                >
                    <span style={{ fontSize: '9px', fontWeight: 'bold' }}>XLS-C</span>
                </button>
                <button
                    className="tool-btn"
                    title="Export Excel (Shapes)"
                    onClick={async () => {
                        const { exportToExcelShapes } = await import('../utils/ExcelShapeExporter');
                        exportToExcelShapes();
                    }}
                >
                    <span style={{ fontSize: '9px', fontWeight: 'bold' }}>XLS-S</span>
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".json"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                try {
                                    const data = JSON.parse(e.target?.result as string);
                                    if (data.pools && data.shapes) {
                                        loadDiagram(data);
                                    } else {
                                        alert('Invalid diagram file');
                                    }
                                } catch (err) {
                                    alert('Failed to load diagram');
                                }
                            };
                            reader.readAsText(file);
                        }
                        // Reset input
                        if (e.target) e.target.value = '';
                    }}
                />
            </div>
        </div>
    );
};
