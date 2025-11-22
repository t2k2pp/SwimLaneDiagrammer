import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { DiagramState, Pool, Lane, Shape, Position, ShapeType, ID, Connection } from './types';

interface DiagramActions {
    addPool: (position: Position, orientation?: 'horizontal' | 'vertical') => void;
    deletePool: (poolId: ID) => void;
    addLane: (poolId: ID) => void;
    deleteLane: (poolId: ID, laneId: ID) => void;
    addShape: (laneId: ID, type: ShapeType, position: Position) => void;
    updatePoolPosition: (poolId: ID, position: Position) => void;
    updatePool: (poolId: ID, updates: Partial<Pool>) => void;
    updateLaneHeight: (poolId: ID, laneId: ID, height: number) => void;
    updateShape: (shapeId: ID, updates: Partial<Shape>) => void;
    updateShapePosition: (shapeId: ID, position: Position) => void;
    selectItem: (id: ID, multi?: boolean) => void;
    selectMultipleShapes: (ids: ID[]) => void;
    clearSelection: () => void;
    clearDiagram: () => void;
    loadDiagram: (state: DiagramState) => void;
    addConnection: (sourceId: ID, targetId: ID) => void;
    setActiveTool: (tool: 'select' | 'connection') => void;
    setConnectionSource: (sourceId: ID | null) => void;
    setPoolPlacementMode: (mode: 'horizontal' | 'vertical' | null) => void;
    setPropertiesPanelVisible: (visible: boolean) => void;
    updateLane: (poolId: ID, laneId: ID, updates: Partial<Lane>) => void;
    copyShape: () => void;
    pasteShape: () => void;
    // Project management
    setProjectName: (name: string | null) => void;
    saveCurrentProject: () => Promise<void>;
    // Undo/Redo
    undo: () => void;
    redo: () => void;
    addHistorySnapshot: () => void;
    // Alignment
    alignShapes: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
}

const SNAP_SIZE = 20;
const snap = (val: number) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;

const MAX_HISTORY = 50;

export const useDiagramStore = create<DiagramState & DiagramActions>((set, get) => ({
    pools: [],
    shapes: {},
    connections: [],
    selectedIds: [],
    activeTool: 'select',
    connectionSourceId: null,
    poolPlacementMode: null,
    propertiesPanelVisible: true,
    clipboard: null,
    currentProjectName: null,
    history: [],
    historyIndex: -1,

    setActiveTool: (tool) => set({ activeTool: tool, connectionSourceId: null, selectedIds: [], poolPlacementMode: null }),
    setConnectionSource: (sourceId) => set({ connectionSourceId: sourceId }),
    setPoolPlacementMode: (mode) => set({ poolPlacementMode: mode, activeTool: 'select' }),
    setPropertiesPanelVisible: (visible) => set({ propertiesPanelVisible: visible }),

    addConnection: (sourceId, targetId) => {
        const state = get();
        // Prevent duplicate connections
        if (state.connections.some(c => c.sourceShapeId === sourceId && c.targetShapeId === targetId)) {
            return;
        }
        const newConnection: Connection = {
            id: uuidv4(),
            sourceShapeId: sourceId,
            targetShapeId: targetId,
        };
        set({ connections: [...state.connections, newConnection] });
        get().addHistorySnapshot();
    },

    updateLane: (poolId, laneId, updates) => {
        set((state) => ({
            pools: state.pools.map(p => {
                if (p.id !== poolId) return p;
                return {
                    ...p,
                    lanes: p.lanes.map(l => l.id === laneId ? { ...l, ...updates } : l)
                };
            })
        }));
        get().addHistorySnapshot();
    },

    copyShape: () => set((state) => {
        if (state.selectedIds.length === 0) return {};

        const selectedShapes = state.selectedIds
            .map(id => state.shapes[id])
            .filter(s => s !== undefined);

        if (selectedShapes.length === 0) return {};

        // Find connections where both source and target are in the selection
        const selectedConnections = state.connections.filter(conn =>
            state.selectedIds.includes(conn.sourceShapeId) &&
            state.selectedIds.includes(conn.targetShapeId)
        );

        return {
            clipboard: {
                shapes: selectedShapes,
                connections: selectedConnections
            }
        };
    }),

    pasteShape: () => {
        const state = get();
        if (!state.clipboard || state.clipboard.shapes.length === 0) return;

        const idMap = new Map<ID, ID>();
        const newShapes: Record<ID, Shape> = {};
        const newShapeIds: ID[] = [];

        // 1. Create new shapes with new IDs
        state.clipboard.shapes.forEach(original => {
            const newId = uuidv4();
            idMap.set(original.id, newId);

            const newShape: Shape = {
                ...original,
                id: newId,
                position: { x: original.position.x + 20, y: original.position.y + 20 },
                label: (original.label || 'Shape').endsWith('(Copy)') ? original.label : `${original.label || 'Shape'} (Copy)`,
            };

            newShapes[newId] = newShape;
            newShapeIds.push(newId);
        });

        // 2. Create new connections
        const newConnections: Connection[] = state.clipboard.connections.map(conn => ({
            id: uuidv4(),
            sourceShapeId: idMap.get(conn.sourceShapeId)!,
            targetShapeId: idMap.get(conn.targetShapeId)!,
        }));

        // 3. Add shapes to pools/lanes
        const newPools = state.pools.map(pool => {
            let lanesChanged = false;
            const newLanes = [...pool.lanes];

            state.clipboard!.shapes.forEach(original => {
                const laneIndex = pool.lanes.findIndex(l => l.id === original.parentId);
                if (laneIndex !== -1) {
                    const newId = idMap.get(original.id)!;
                    newLanes[laneIndex] = {
                        ...newLanes[laneIndex],
                        shapeIds: [...newLanes[laneIndex].shapeIds, newId]
                    };
                    lanesChanged = true;
                }
            });

            if (lanesChanged) {
                return { ...pool, lanes: newLanes };
            }
            return pool;
        });

        set({
            shapes: { ...state.shapes, ...newShapes },
            pools: newPools,
            connections: [...state.connections, ...newConnections],
            selectedIds: newShapeIds,
        });
        get().addHistorySnapshot();
    },

    addPool: (position, orientation = 'horizontal') => {
        const poolId = uuidv4();
        const laneId = uuidv4();
        const newLane: Lane = {
            id: laneId,
            title: 'Lane 1',
            height: 200,
            shapeIds: [],
        };
        const newPool: Pool = {
            id: poolId,
            title: orientation === 'horizontal' ? 'Horizontal Pool' : 'Vertical Pool',
            position: { x: snap(position.x), y: snap(position.y) },
            width: 1000,
            orientation,
            lanes: [newLane],
        };
        set((state) => ({ pools: [...state.pools, newPool], poolPlacementMode: null }));
        get().addHistorySnapshot();
    },

    deletePool: (poolId) => {
        const state = get();
        const pool = state.pools.find(p => p.id === poolId);
        if (!pool) return;

        const shapeIdsToDelete = new Set<ID>();
        pool.lanes.forEach(lane => {
            lane.shapeIds.forEach(shapeId => shapeIdsToDelete.add(shapeId));
        });

        const newShapes = { ...state.shapes };
        shapeIdsToDelete.forEach(shapeId => {
            delete newShapes[shapeId];
        });

        const newConnections = state.connections.filter(
            c => !shapeIdsToDelete.has(c.sourceShapeId) && !shapeIdsToDelete.has(c.targetShapeId)
        );

        set({
            pools: state.pools.filter(p => p.id !== poolId),
            shapes: newShapes,
            connections: newConnections,
            selectedIds: state.selectedIds.filter(id => {
                if (id === poolId) return false;
                if (shapeIdsToDelete.has(id)) return false;
                return !pool.lanes.some(l => l.id === id);
            }),
        });
        get().addHistorySnapshot();
    },

    addLane: (poolId) => {
        const state = get();
        const pool = state.pools.find(p => p.id === poolId);
        if (!pool) return;

        const newLane: Lane = {
            id: uuidv4(),
            title: `Lane ${pool.lanes.length + 1}`,
            height: 200,
            shapeIds: [],
        };
        set({
            pools: state.pools.map(p =>
                p.id === poolId ? { ...p, lanes: [...p.lanes, newLane] } : p
            ),
        });
        get().addHistorySnapshot();
    },

    deleteLane: (poolId, laneId) => {
        const state = get();
        const pool = state.pools.find(p => p.id === poolId);
        if (!pool || pool.lanes.length <= 1) {
            return;
        }

        const laneToDelete = pool.lanes.find(l => l.id === laneId);
        if (!laneToDelete) return;

        const newShapes = { ...state.shapes };
        laneToDelete.shapeIds.forEach(shapeId => {
            delete newShapes[shapeId];
        });

        const deletedShapeIds = new Set(laneToDelete.shapeIds);
        const newConnections = state.connections.filter(
            c => !deletedShapeIds.has(c.sourceShapeId) && !deletedShapeIds.has(c.targetShapeId)
        );

        set({
            pools: state.pools.map(p =>
                p.id === poolId
                    ? { ...p, lanes: p.lanes.filter(l => l.id !== laneId) }
                    : p
            ),
            shapes: newShapes,
            connections: newConnections,
            selectedIds: state.selectedIds.filter(id => id !== laneId && !deletedShapeIds.has(id)),
        });
        get().addHistorySnapshot();
    },

    addShape: (laneId, type, position) => {
        const shapeId = uuidv4();

        let size = { width: 100, height: 60 };
        if (type === 'diamond') {
            size = { width: 80, height: 80 };
        } else if (type === 'circle') {
            size = { width: 80, height: 80 };
        }

        const newShape: Shape = {
            id: shapeId,
            type,
            position: { x: snap(position.x), y: snap(position.y) },
            size,
            parentId: laneId,
            label: 'Shape',
        };

        const state = get();
        const newPools = state.pools.map(pool => {
            const laneIndex = pool.lanes.findIndex(l => l.id === laneId);
            if (laneIndex === -1) return pool;

            const newLanes = [...pool.lanes];
            newLanes[laneIndex] = {
                ...newLanes[laneIndex],
                shapeIds: [...newLanes[laneIndex].shapeIds, shapeId]
            };
            return { ...pool, lanes: newLanes };
        });

        set({
            shapes: { ...state.shapes, [shapeId]: newShape },
            pools: newPools,
        });
        get().addHistorySnapshot();
    },

    updatePoolPosition: (poolId, position) => {
        set((state) => ({
            pools: state.pools.map(p =>
                p.id === poolId ? { ...p, position: { x: snap(position.x), y: snap(position.y) } } : p
            ),
        }));
        get().addHistorySnapshot();
    },

    updatePool: (poolId, updates) => {
        set((state) => ({
            pools: state.pools.map(p => p.id === poolId ? { ...p, ...updates } : p),
        }));
        get().addHistorySnapshot();
    },

    updateLaneHeight: (poolId, laneId, height) => {
        set((state) => ({
            pools: state.pools.map(p => {
                if (p.id !== poolId) return p;
                return {
                    ...p,
                    lanes: p.lanes.map(l => l.id === laneId ? { ...l, height } : l)
                };
            }),
        }));
        get().addHistorySnapshot();
    },

    updateShape: (shapeId, updates) => {
        set((state) => ({
            shapes: {
                ...state.shapes,
                [shapeId]: { ...state.shapes[shapeId], ...updates }
            }
        }));
        get().addHistorySnapshot();
    },

    updateShapePosition: (shapeId, position) => {
        set((state) => {
            const shape = state.shapes[shapeId];
            if (!shape) return state;

            // Calculate center position
            const centerX = position.x + shape.size.width / 2;
            const centerY = position.y + shape.size.height / 2;

            // Snap center to grid
            const snappedCenterX = snap(centerX);
            const snappedCenterY = snap(centerY);

            // Calculate top-left position from snapped center
            const snappedX = snappedCenterX - shape.size.width / 2;
            const snappedY = snappedCenterY - shape.size.height / 2;

            return {
                shapes: {
                    ...state.shapes,
                    [shapeId]: {
                        ...shape,
                        position: { x: snappedX, y: snappedY }
                    }
                }
            };
        });
        // Note: History snapshot is saved in Shape.tsx on mouseup to avoid creating snapshots for every mousemove
    },

    selectItem: (id, multi) => set((state) => {
        if (multi) {
            if (state.selectedIds.includes(id)) {
                // Toggle off if already selected
                return { selectedIds: state.selectedIds.filter(i => i !== id) };
            } else {
                // Add to selection
                return { selectedIds: [...state.selectedIds, id] };
            }
        } else {
            // Single selection
            return { selectedIds: [id] };
        }
    }),

    selectMultipleShapes: (ids) => set({ selectedIds: ids }),

    clearSelection: () => set({ selectedIds: [] }),

    clearDiagram: () => {
        set({ pools: [], shapes: {}, connections: [], selectedIds: [], poolPlacementMode: null, history: [], historyIndex: -1 });
    },

    loadDiagram: (newState) => set({
        pools: newState.pools,
        shapes: newState.shapes,
        connections: newState.connections || [],
        selectedIds: [],
        history: [],
        historyIndex: -1
    }),

    // Project management
    setProjectName: (name) => set({ currentProjectName: name }),

    saveCurrentProject: async () => {
        const state = get();
        if (!state.currentProjectName) {
            console.warn('No project name set');
            return;
        }

        const { saveProject } = await import('./db');
        await saveProject(state.currentProjectName, {
            pools: state.pools,
            shapes: state.shapes,
            connections: state.connections
        });
    },

    // Undo/Redo
    addHistorySnapshot: () => {
        const state = get();
        const snapshot: DiagramState = {
            pools: state.pools,
            shapes: state.shapes,
            connections: state.connections,
            selectedIds: state.selectedIds,
            activeTool: state.activeTool,
            connectionSourceId: state.connectionSourceId,
            poolPlacementMode: state.poolPlacementMode,
            propertiesPanelVisible: state.propertiesPanelVisible,
            clipboard: state.clipboard,
            currentProjectName: state.currentProjectName,
            history: [],
            historyIndex: -1
        };

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);

        if (newHistory.length > MAX_HISTORY) {
            newHistory.shift();
        }

        set({
            history: newHistory,
            historyIndex: newHistory.length - 1
        });
    },

    undo: () => {
        const state = get();
        if (state.historyIndex <= 0) return;

        const newIndex = state.historyIndex - 1;
        const previousState = state.history[newIndex];

        set({
            ...previousState,
            history: state.history,
            historyIndex: newIndex
        });
    },

    redo: () => {
        const state = get();
        if (state.historyIndex >= state.history.length - 1) return;

        const newIndex = state.historyIndex + 1;
        const nextState = state.history[newIndex];

        set({
            ...nextState,
            history: state.history,
            historyIndex: newIndex
        });
    },

    // Alignment
    alignShapes: (alignment) => {
        const state = get();
        const selectedShapes = state.selectedIds
            .map(id => state.shapes[id])
            .filter(shape => shape !== undefined);

        if (selectedShapes.length < 2) return; // Need at least 2 shapes to align

        let referenceValue: number;

        // Calculate reference value based on alignment type
        switch (alignment) {
            case 'left':
                referenceValue = Math.min(...selectedShapes.map(s => s.position.x));
                break;
            case 'center':
                const avgCenterX = selectedShapes.reduce((sum, s) => sum + s.position.x + s.size.width / 2, 0) / selectedShapes.length;
                referenceValue = avgCenterX;
                break;
            case 'right':
                referenceValue = Math.max(...selectedShapes.map(s => s.position.x + s.size.width));
                break;
            case 'top':
                referenceValue = Math.min(...selectedShapes.map(s => s.position.y));
                break;
            case 'middle':
                const avgCenterY = selectedShapes.reduce((sum, s) => sum + s.position.y + s.size.height / 2, 0) / selectedShapes.length;
                referenceValue = avgCenterY;
                break;
            case 'bottom':
                referenceValue = Math.max(...selectedShapes.map(s => s.position.y + s.size.height));
                break;
        }

        const newShapes = { ...state.shapes };
        selectedShapes.forEach(shape => {
            let newPosition = { ...shape.position };

            switch (alignment) {
                case 'left':
                    newPosition.x = referenceValue;
                    break;
                case 'center':
                    newPosition.x = referenceValue - shape.size.width / 2;
                    break;
                case 'right':
                    newPosition.x = referenceValue - shape.size.width;
                    break;
                case 'top':
                    newPosition.y = referenceValue;
                    break;
                case 'middle':
                    newPosition.y = referenceValue - shape.size.height / 2;
                    break;
                case 'bottom':
                    newPosition.y = referenceValue - shape.size.height;
                    break;
            }

            newShapes[shape.id] = { ...shape, position: newPosition };
        });

        set({ shapes: newShapes });
        get().addHistorySnapshot();
    },
}));
