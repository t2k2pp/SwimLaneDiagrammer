import React from 'react';
import { useDiagramStore } from '../core/store';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { selectedIds, shapes, pools, updateShape, updatePool, updateLane, deleteLane, deletePool } = useDiagramStore();

    const selectedId = selectedIds[0];
    const selectedShape = shapes[selectedId];
    const selectedPool = pools.find(p => p.id === selectedId);

    // Find selected lane
    let selectedLane = null;
    let parentPoolId = null;
    for (const pool of pools) {
        const lane = pool.lanes.find(l => l.id === selectedId);
        if (lane) {
            selectedLane = lane;
            parentPoolId = pool.id;
            break;
        }
    }

    if (!selectedId) {
        return (
            <div className="sidebar">
                <div className="sidebar-header">Properties</div>
                <div className="sidebar-content">
                    <p className="sidebar-hint">Select an item to edit properties</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">Properties</div>
            <div className="sidebar-content">
                {selectedShape && (
                    <div className="property-group">
                        <label>Label</label>
                        <input
                            type="text"
                            value={selectedShape.label || ''}
                            onChange={(e) => updateShape(selectedShape.id, { label: e.target.value })}
                        />
                    </div>
                )}
                {selectedPool && (
                    <>
                        <div className="property-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={selectedPool.title || ''}
                                onChange={(e) => updatePool(selectedPool.id, { title: e.target.value })}
                            />
                        </div>
                        <div className="property-group">
                            <label>Width</label>
                            <input
                                type="number"
                                value={selectedPool.width || 1000}
                                onChange={(e) => updatePool(selectedPool.id, { width: Number(e.target.value) })}
                            />
                        </div>
                        <div className="property-group">
                            <button
                                className="delete-btn"
                                onClick={() => {
                                    if (window.confirm('このPoolを削除しますか？（Pool内のすべてのLaneとShapeも削除されます）')) {
                                        deletePool(selectedPool.id);
                                    }
                                }}
                            >
                                Delete Pool
                            </button>
                        </div>
                    </>
                )}
                {selectedLane && parentPoolId && (
                    <>
                        <div className="property-group">
                            <label>Lane Title</label>
                            <input
                                type="text"
                                value={selectedLane.title || ''}
                                onChange={(e) => updateLane(parentPoolId!, selectedLane!.id, { title: e.target.value })}
                            />
                        </div>
                        <div className="property-group">
                            <label>Lane Height</label>
                            <input
                                type="number"
                                value={selectedLane.height || 200}
                                onChange={(e) => updateLane(parentPoolId!, selectedLane!.id, { height: Number(e.target.value) })}
                            />
                        </div>
                        <div className="property-group">
                            <button
                                className="delete-btn"
                                onClick={() => {
                                    if (window.confirm('このLaneを削除しますか？（Lane内のShapeも削除されます）')) {
                                        deleteLane(parentPoolId!, selectedLane!.id);
                                    }
                                }}
                            >
                                Delete Lane
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
