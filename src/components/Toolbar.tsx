import React, { useRef, useState } from 'react';
import { Undo2, Redo2, Save, Upload, Trash2, FolderOpen } from 'lucide-react';
import { useDiagramStore } from '../core/store';
import { ProjectManager } from './ProjectManager';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
    const { pools, shapes, clearDiagram, loadDiagram, undo, redo, historyIndex, history, currentProjectName } = useDiagramStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

    const handleSave = () => {
        const data = JSON.stringify({ pools, shapes }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the diagram?')) {
            clearDiagram();
        }
    };

    return (
        <>
            <div className="toolbar">
                <div className="toolbar-left">
                    <button className="tool-btn" title="Undo (Ctrl+Z)" onClick={undo} disabled={historyIndex <= 0}>
                        <Undo2 size={20} />
                    </button>
                    <button className="tool-btn" title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={historyIndex >= history.length - 1}>
                        <Redo2 size={20} />
                    </button>

                    <div className="toolbar-separator" />

                    <button className="tool-btn" title="Save Diagram" onClick={handleSave}>
                        <Save size={20} />
                    </button>
                    <button className="tool-btn" title="Load Diagram" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={20} />
                    </button>
                    <button className="tool-btn" title="Clear Diagram" onClick={handleClear}>
                        <Trash2 size={20} />
                    </button>

                    <div className="toolbar-separator" />

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
                            if (e.target) e.target.value = '';
                        }}
                    />
                </div>

                <div className="toolbar-right">
                    {currentProjectName && (
                        <div className="current-project-name">
                            {currentProjectName}
                        </div>
                    )}
                    <button
                        className="tool-btn project-btn"
                        title="Project Manager"
                        onClick={() => setIsProjectManagerOpen(true)}
                    >
                        <FolderOpen size={20} />
                        <span>Project</span>
                    </button>
                </div>
            </div>

            <ProjectManager
                isOpen={isProjectManagerOpen}
                onClose={() => setIsProjectManagerOpen(false)}
            />
        </>
    );
};
