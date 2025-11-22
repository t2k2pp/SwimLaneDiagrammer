import React from 'react';
import { useDiagramStore } from '../core/store';
import { Trash2 } from 'lucide-react';
import './PropertiesPanel.css';

export const PropertiesPanel: React.FC = () => {
    const { pools, shapes, selectedIds, deletePool, updatePool, updateLane } = useDiagramStore();

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
                                if (window.confirm('このPoolを削除しますか？')) {
                                    deletePool(selectedPool.id);
                                }
                            }}
                        >
                            <Trash2 size={16} />
                            Poolを削除
                        </button>
                    </div>
                </div>
            </div>
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
                </div>
            </div>
        );
    }

    return null;
};
