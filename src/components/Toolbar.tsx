import React, { useRef, useState } from 'react';
import { Undo2, Redo2, Save, Upload, Trash2, FolderOpen, PanelRightClose, PanelRight, Group, Ungroup, Sun, Moon, AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { useDiagramStore } from '../core/store';
import { ProjectManager } from './ProjectManager';
import { normalizeProjectData } from '../utils/importUtils';
import './Toolbar.css';

export const Toolbar: React.FC = () => {
    const { pools, shapes, clearDiagram, loadDiagram, undo, redo, historyIndex, history, currentProjectName, propertiesPanelVisible, setPropertiesPanelVisible, groupShapes, ungroupShapes, theme, setTheme, selectedIds, alignShapes } = useDiagramStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

    const canAlign = selectedIds.length >= 2;

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
        setConfirmDialog({
            message: 'ダイアグラムをクリアしますか？この操作は取り消せません。',
            onConfirm: () => {
                clearDiagram();
                setConfirmDialog(null);
            }
        });
    };

    return (
        <>
            <div className="toolbar">
                <div className="toolbar-left">
                    {/* File Operations & Exports */}
                    <button className="tool-btn" title="Save Diagram" onClick={handleSave}>
                        <Save size={20} />
                    </button>
                    <button className="tool-btn" title="Load Diagram" onClick={() => fileInputRef.current?.click()}>
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
                        title="Export SVG"
                        onClick={async () => {
                            const { exportToSVG } = await import('../utils/SVGExporter');
                            exportToSVG();
                        }}
                    >
                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>SVG</span>
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

                    <div className="toolbar-separator" />

                    {/* Undo / Redo */}
                    <button className="tool-btn" title="Undo (Ctrl+Z)" onClick={undo} disabled={historyIndex <= 0}>
                        <Undo2 size={20} />
                    </button>
                    <button className="tool-btn" title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={historyIndex >= history.length - 1}>
                        <Redo2 size={20} />
                    </button>

                    <div className="toolbar-separator" />

                    {/* Grouping */}
                    <button className="tool-btn" title="Group Selected" onClick={groupShapes}>
                        <Group size={20} />
                    </button>
                    <button className="tool-btn" title="Ungroup Selected" onClick={ungroupShapes}>
                        <Ungroup size={20} />
                    </button>

                    <div className="toolbar-separator" />

                    {/* Alignment */}
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

                    <div className="toolbar-separator" />

                    {/* Theme */}
                    <button
                        className="tool-btn"
                        title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = async (e) => {
                                    try {
                                        const json = JSON.parse(e.target?.result as string);
                                        // Handle both ProjectData (wrapped in data property) and direct DiagramState
                                        const rawData = json.data || json;

                                        if (rawData.pools) {
                                            const normalizedData = normalizeProjectData(rawData);

                                            // Determine project name: use JSON name or file name (without extension)
                                            const projectName = json.name || file.name.replace(/\.[^/.]+$/, "");

                                            loadDiagram({
                                                ...normalizedData,
                                                activeTool: 'select',
                                                connectionSourceId: null,
                                                poolPlacementMode: null,
                                                propertiesPanelVisible: true,
                                                clipboard: null,
                                                currentProjectName: projectName,
                                            } as any);

                                            // Auto-save to IndexedDB
                                            const { saveCurrentProject } = useDiagramStore.getState();
                                            await saveCurrentProject();
                                        } else {
                                            alert('Invalid diagram file');
                                        }
                                    } catch (err) {
                                        console.error(err);
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
                    <button className="tool-btn" title="Clear Diagram" onClick={handleClear} style={{ marginRight: '8px' }}>
                        <Trash2 size={20} />
                    </button>

                    {currentProjectName && (
                        <div className="current-project-name">
                            {currentProjectName}
                        </div>
                    )}
                    <button
                        className="tool-btn"
                        title={propertiesPanelVisible ? "プロパティパネルを非表示" : "プロパティパネルを表示"}
                        onClick={() => setPropertiesPanelVisible(!propertiesPanelVisible)}
                    >
                        {propertiesPanelVisible ? <PanelRightClose size={20} /> : <PanelRight size={20} />}
                    </button>
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

            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}
        </>
    );
};
