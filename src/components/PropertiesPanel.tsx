import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDiagramStore } from '../core/store';
import { ConfirmDialog } from './ConfirmDialog';
import './PropertiesPanel.css';
import type { Position } from '../core/types';

export const PropertiesPanel: React.FC = () => {
    const {
        shapes,
        connections,
        pools,
        selectedIds,
        updateShape,
        deleteShape,
        updateConnection,
        deleteConnection,
        propertiesPanelVisible,
        textBoxes,
        updateTextBox,
        deleteTextBox
    } = useDiagramStore();

    const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

    if (!propertiesPanelVisible) return null;

    const selectedShapeId = selectedIds.length === 1 ? selectedIds[0] : null;
    const selectedShape = selectedShapeId ? shapes[selectedShapeId] : null;

    // Check if a connection is selected
    const selectedConnectionId = selectedIds.length === 1 && !selectedShape ? selectedIds[0] : null;
    const selectedConnection = selectedConnectionId ? connections.find(c => c.id === selectedConnectionId) : null;

    // Check if a TextBox is selected
    const selectedTextBoxId = selectedIds.length === 1 && !selectedShape && !selectedConnection ? selectedIds[0] : null;
    const selectedTextBox = selectedTextBoxId ? textBoxes.find(t => t.id === selectedTextBoxId) : null;

    // Helper to calculate absolute position of a shape
    const getShapeAbsolutePosition = (shapeId: string): Position | null => {
        const shape = shapes[shapeId];
        if (!shape) return null;

        for (const pool of pools) {
            let currentLaneY = 0;
            for (const lane of pool.lanes) {
                if (lane.id === shape.parentId) {
                    return {
                        x: pool.position.x + 40 + shape.position.x,
                        y: pool.position.y + 40 + currentLaneY + shape.position.y
                    };
                }
                currentLaneY += lane.height;
            }
        }
        return null;
    };

    if (!selectedShape && !selectedConnection && !selectedTextBox) {
        return (
            <div className="properties-panel">
                <div className="properties-header">
                    <h3>プロパティ</h3>
                </div>
                <div className="properties-content empty">
                    <p>要素を選択してください</p>
                </div>
            </div>
        );
    }

    return (
        <div className="properties-panel">
            <div className="properties-header">
                <h3>プロパティ</h3>
            </div>
            <div className="properties-content">
                {selectedShape && (
                    <>
                        <div className="property-group">
                            <label>ラベル</label>
                            <input
                                type="text"
                                value={selectedShape.label || ''}
                                onChange={(e) => updateShape(selectedShape.id, { label: e.target.value })}
                            />
                        </div>
                        <div className="property-group">
                            <label>タイプ</label>
                            <div className="type-label">{selectedShape.type}</div>
                        </div>
                        <div className="property-group">
                            <label>幅 (px)</label>
                            <input
                                type="number"
                                value={selectedShape.size.width}
                                onChange={(e) => updateShape(selectedShape.id, {
                                    size: { ...selectedShape.size, width: parseInt(e.target.value) || 80 }
                                })}
                                min={40}
                                step={10}
                            />
                        </div>
                        <div className="property-group">
                            <label>高さ (px)</label>
                            <input
                                type="number"
                                value={selectedShape.size.height}
                                onChange={(e) => updateShape(selectedShape.id, {
                                    size: { ...selectedShape.size, height: parseInt(e.target.value) || 60 }
                                })}
                                min={30}
                                step={10}
                            />
                        </div>
                        <div className="property-group">
                            <label>色</label>
                            <div className="color-picker">
                                {['#64b5f6', '#81c784', '#ffb74d', '#e57373', '#ba68c8', '#4dd0e1', '#aed581', '#9575cd', ''].map((color) => (
                                    <button
                                        key={color || 'default'}
                                        className={`color-btn ${selectedShape.color === color || (!selectedShape.color && !color) ? 'active' : ''}`}
                                        style={{ backgroundColor: color || 'var(--color-bg-secondary)' }}
                                        onClick={() => updateShape(selectedShape.id, { color: color || undefined })}
                                        title={color || 'デフォルト'}
                                    >
                                        {!color && '×'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="property-group">
                            <label>テキスト色</label>
                            <div className="text-color-selector">
                                <button
                                    className={`text-color-btn ${!selectedShape.textColor || selectedShape.textColor === 'black' ? 'active' : ''}`}
                                    onClick={() => updateShape(selectedShape.id, { textColor: 'black' })}
                                    title="黒"
                                >
                                    <span style={{ color: 'black' }}>A</span>
                                </button>
                                <button
                                    className={`text-color-btn ${selectedShape.textColor === 'white' ? 'active' : ''}`}
                                    onClick={() => updateShape(selectedShape.id, { textColor: 'white' })}
                                    title="白"
                                >
                                    <span style={{ color: 'white', textShadow: '0 0 2px black' }}>A</span>
                                </button>
                            </div>
                        </div>
                        <div className="property-actions">
                            <button
                                className="delete-btn"
                                onClick={() => {
                                    setConfirmDialog({
                                        message: 'このShapeを削除しますか？\n関連するConnectionも削除されます。',
                                        onConfirm: () => {
                                            deleteShape(selectedShape.id);
                                            setConfirmDialog(null);
                                        }
                                    });
                                }}
                            >
                                <Trash2 size={16} />
                                Shapeを削除
                            </button>
                        </div>
                    </>
                )}

                {selectedConnection && (
                    <>
                        <div className="property-group">
                            <label>ラベル</label>
                            <input
                                type="text"
                                value={selectedConnection.label || ''}
                                onChange={(e) => updateConnection(selectedConnection.id, { label: e.target.value })}
                                placeholder="接続ラベル"
                            />
                        </div>
                        <div className="property-group">
                            <label>線種</label>
                            <select
                                value={selectedConnection.type || 'straight'}
                                onChange={(e) => updateConnection(selectedConnection.id, { type: e.target.value as any })}
                            >
                                <option value="straight">直線</option>
                                <option value="step">カギ線</option>
                                <option value="bezier">曲線</option>
                            </select>
                        </div>
                        <div className="property-group">
                            <label>スタイル</label>
                            <select
                                value={selectedConnection.style || 'solid'}
                                onChange={(e) => updateConnection(selectedConnection.id, { style: e.target.value as any })}
                            >
                                <option value="solid">実線</option>
                                <option value="dashed">破線</option>
                                <option value="dotted">点線</option>
                            </select>
                        </div>
                        <div className="property-group">
                            <label>始点マーカー</label>
                            <select
                                value={selectedConnection.startMarker || 'none'}
                                onChange={(e) => updateConnection(selectedConnection.id, { startMarker: e.target.value as any })}
                            >
                                <option value="none">なし</option>
                                <option value="arrow">矢印</option>
                                <option value="circle">丸</option>
                            </select>
                        </div>
                        <div className="property-group">
                            <label>終点マーカー</label>
                            <select
                                value={selectedConnection.endMarker || 'arrow'}
                                onChange={(e) => updateConnection(selectedConnection.id, { endMarker: e.target.value as any })}
                            >
                                <option value="none">なし</option>
                                <option value="arrow">矢印</option>
                                <option value="circle">丸</option>
                            </select>
                        </div>
                        <div className="property-group">
                            <label>制御点数 (0-4)</label>
                            <input
                                type="number"
                                min="0"
                                max="4"
                                value={selectedConnection.controlPoints?.length || 0}
                                onChange={(e) => {
                                    const count = Math.max(0, Math.min(4, parseInt(e.target.value) || 0));
                                    const currentPoints = selectedConnection.controlPoints || [];
                                    let newPoints = [...currentPoints];

                                    if (count > currentPoints.length) {
                                        // Add points
                                        const start = getShapeAbsolutePosition(selectedConnection.sourceShapeId);
                                        const end = getShapeAbsolutePosition(selectedConnection.targetShapeId);

                                        if (start && end) {
                                            // Calculate center of shapes
                                            const sourceShape = shapes[selectedConnection.sourceShapeId];
                                            const targetShape = shapes[selectedConnection.targetShapeId];
                                            const startCenter = {
                                                x: start.x + sourceShape.size.width / 2,
                                                y: start.y + sourceShape.size.height / 2
                                            };
                                            const endCenter = {
                                                x: end.x + targetShape.size.width / 2,
                                                y: end.y + targetShape.size.height / 2
                                            };

                                            for (let i = currentPoints.length; i < count; i++) {
                                                // Determine previous point (or start) and next point (or end)
                                                // We always add to the end of the list, so we look at the last point and the end target.
                                                const prevPoint = i > 0 ? newPoints[i - 1] : startCenter;
                                                const nextPoint = endCenter;

                                                // Add at midpoint
                                                newPoints.push({
                                                    x: (prevPoint.x + nextPoint.x) / 2,
                                                    y: (prevPoint.y + nextPoint.y) / 2
                                                });
                                            }
                                        } else {
                                            // Fallback if positions can't be calculated
                                            for (let i = currentPoints.length; i < count; i++) {
                                                newPoints.push({ x: 100 + i * 50, y: 100 + i * 50 });
                                            }
                                        }
                                    } else {
                                        // Remove points
                                        newPoints = newPoints.slice(0, count);
                                    }
                                    updateConnection(selectedConnection.id, { controlPoints: newPoints });
                                }}
                            />
                        </div>
                        <div className="property-group">
                            <label>太さ (px)</label>
                            <input
                                type="number"
                                value={selectedConnection.width || 2}
                                onChange={(e) => updateConnection(selectedConnection.id, { width: parseInt(e.target.value) || 2 })}
                                min={1}
                                max={10}
                            />
                        </div>
                        <div className="property-group">
                            <label>色</label>
                            <input
                                type="color"
                                value={selectedConnection.color || '#646cff'}
                                onChange={(e) => updateConnection(selectedConnection.id, { color: e.target.value })}
                                style={{ width: '100%', height: '40px' }}
                            />
                        </div>
                        <div className="property-actions">
                            <button
                                className="delete-btn"
                                onClick={() => {
                                    setConfirmDialog({
                                        message: 'この接続を削除しますか？',
                                        onConfirm: () => {
                                            deleteConnection(selectedConnection.id);
                                            setConfirmDialog(null);
                                        }
                                    });
                                }}
                            >
                                <Trash2 size={16} />
                                接続を削除
                            </button>
                        </div>
                    </>
                )}

                {selectedTextBox && (
                    <>
                        <div className="property-group">
                            <label>内容 (Markdown)</label>
                            <textarea
                                value={selectedTextBox.content}
                                onChange={(e) => updateTextBox(selectedTextBox.id, { content: e.target.value })}
                                rows={10}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                        <div className="property-actions">
                            <button
                                className="delete-btn"
                                onClick={() => {
                                    setConfirmDialog({
                                        message: 'このテキストボックスを削除しますか？',
                                        onConfirm: () => {
                                            deleteTextBox(selectedTextBox.id);
                                            setConfirmDialog(null);
                                        }
                                    });
                                }}
                            >
                                <Trash2 size={16} />
                                削除
                            </button>
                        </div>
                    </>
                )}
            </div>

            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}
        </div>
    );
};
