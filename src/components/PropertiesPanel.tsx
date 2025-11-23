import React from 'react';
import { useDiagramStore } from '../core/store';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import './PropertiesPanel.css';

export const PropertiesPanel: React.FC = () => {
    const { pools, shapes, selectedIds, deletePool, deleteShape, updatePool, updateLane } = useDiagramStore();
    const [confirmDialog, setConfirmDialog] = React.useState<{ message: string; onConfirm: () => void } | null>(null);

    if (selectedIds.length === 0) {
        return (
            <div className="properties-panel">
                <div className="properties-header">
                    <h3>プロパティ</h3>
                </div>
                <div className="properties-content">
                    <p className="empty-message">アイテムを選択してください</p>
                </div>
            </div>
        );
    }

    const selectedId = selectedIds[0];

    // Check if selected item is a pool
    const selectedPool = pools.find(p => p.id === selectedId);
    if (selectedPool) {
        return (
            <>
                <div className="properties-panel">
                    <div className="properties-header">
                        <h3>Pool プロパティ</h3>
                    </div>
                    <div className="properties-content">
                        <div className="property-group">
                            <label>タイトル</label>
                            <input
                                type="text"
                                value={selectedPool.title}
                                onChange={(e) => updatePool(selectedPool.id, { title: e.target.value })}
                            />
                        </div>
                        <div className="property-group">
                            <label>幅</label>
                            <input
                                type="number"
                                value={selectedPool.width}
                                onChange={(e) => updatePool(selectedPool.id, { width: parseInt(e.target.value) })}
                                min={200}
                            />
                        </div>
                        <div className="property-group">
                            <label>向き</label>
                            <div className="orientation-label">
                                {selectedPool.orientation === 'horizontal' ? '水平 (レーン縦積み)' : '垂直 (レーン横並び)'}
                            </div>
                        </div>
                        <div className="property-group">
                            <label>レーン</label>
                            <div className="lanes-list">
                                {selectedPool.lanes.map((lane) => (
                                    <div key={lane.id} className="lane-item">
                                        <input
                                            type="text"
                                            value={lane.title}
                                            onChange={(e) => updateLane(selectedPool.id, lane.id, { title: e.target.value })}
                                            className="lane-title-input"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="property-actions">
                            <button
                                className="delete-btn"
                                onClick={() => {
                                    setConfirmDialog({
                                        message: 'このPoolを削除しますか？',
                                        onConfirm: () => {
                                            deletePool(selectedPool.id);
                                            setConfirmDialog(null);
                                        }
                                    });
                                }}
                            >
                                <Trash2 size={16} />
                                Poolを削除
                            </button>
                        </div>
                    </div>
                </div>
                {confirmDialog && (
                    <ConfirmDialog
                        message={confirmDialog.message}
                        onConfirm={confirmDialog.onConfirm}
                        onCancel={() => setConfirmDialog(null)}
                    />
                )}
            </>
        );
    }

    // Check if selected item is a lane
    for (const pool of pools) {
        const lane = pool.lanes.find(l => l.id === selectedId);
        if (lane) {
            return (
                <div className="properties-panel">
                    <div className="properties-header">
                        <h3>Lane プロパティ</h3>
                    </div>
                    <div className="properties-content">
                        <div className="property-group">
                            <label>タイトル</label>
                            <input
                                type="text"
                                value={lane.title}
                                onChange={(e) => updateLane(pool.id, lane.id, { title: e.target.value })}
                            />
                        </div>
                        <div className="property-group">
                            <label>高さ</label>
                            <input
                                type="number"
                                value={lane.height}
                                onChange={(e) => updateLane(pool.id, lane.id, { height: parseInt(e.target.value) })}
                                min={50}
                            />
                        </div>
                    </div>
                </div>
            );
        }
    }

    // Check if selected item is a shape
    const selectedShape = shapes[selectedId];
    if (selectedShape) {
        return (
            <>
                <div className="properties-panel">
                    <div className="properties-header">
                        <h3>Shape プロパティ</h3>
                    </div>
                    <div className="properties-content">
                        <div className="property-group">
                            <label>ラベル</label>
                            <input
                                type="text"
                                value={selectedShape.label || ''}
                                onChange={(e) => {
                                    const { updateShape } = useDiagramStore.getState();
                                    updateShape(selectedShape.id, { label: e.target.value });
                                }}
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
                                onChange={(e) => {
                                    const { updateShape } = useDiagramStore.getState();
                                    updateShape(selectedShape.id, {
                                        size: { ...selectedShape.size, width: parseInt(e.target.value) || 80 }
                                    });
                                }}
                                min={40}
                                step={10}
                            />
                        </div>
                        <div className="property-group">
                            <label>高さ (px)</label>
                            <input
                                type="number"
                                value={selectedShape.size.height}
                                onChange={(e) => {
                                    const { updateShape } = useDiagramStore.getState();
                                    updateShape(selectedShape.id, {
                                        size: { ...selectedShape.size, height: parseInt(e.target.value) || 60 }
                                    });
                                }}
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
                                        onClick={() => {
                                            const { updateShape } = useDiagramStore.getState();
                                            updateShape(selectedShape.id, { color: color || undefined });
                                        }}
                                        title={color || 'デフォルト'}
                                    >
                                        {!color && '×'}
                                    </button>
                                ))}
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
                    </div>
                </div>
                {confirmDialog && (
                    <ConfirmDialog
                        message={confirmDialog.message}
                        onConfirm={confirmDialog.onConfirm}
                        onCancel={() => setConfirmDialog(null)}
                    />
                )}
            </>
        );
    }

    return null;
};
