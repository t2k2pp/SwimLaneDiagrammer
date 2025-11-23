import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { DiagramState, Pool, Lane, Shape, Position, ShapeType, ID, Connection, Group } from './types';

interface DiagramActions {
    addPool: (position: Position, orientation?: 'horizontal' | 'vertical') => void;
    deletePool: (poolId: ID) => void;
    deleteShape: (shapeId: ID) => void;
    deleteConnection: (connectionId: ID) => void;
    addLane: (poolId: ID) => void;
    deleteLane: (poolId: ID, laneId: ID) => void;
    addShape: (laneId: ID, type: string, position: Position) => void;
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
    // Grouping
    groupShapes: () => void;
    ungroupShapes: () => void;
    // Theme
    setTheme: (theme: 'light' | 'dark') => void;
    // TextBox
    addTextBox: (position: Position) => void;
    updateTextBox: (id: ID, updates: Partial<import('./types').TextBox>) => void;
    deleteTextBox: (id: ID) => void;
    updateConnection: (id: ID, updates: Partial<Connection>) => void;
}

const SNAP_SIZE = 20;
const snap = (val: number) => Math.round(val / SNAP_SIZE) * SNAP_SIZE;

const MAX_HISTORY = 50;

export const useDiagramStore = create<DiagramState & DiagramActions>((set, get) => ({
    pools: [],
    shapes: {},
    groups: {},
    connections: [],
    textBoxes: [],
    selectedIds: [],
    activeTool: 'select',
    connectionSourceId: null,
    poolPlacementMode: null,
    propertiesPanelVisible: true,
    clipboard: null,
    currentProjectName: null,
    history: [],
    historyIndex: -1,
    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',

    setTheme: (theme) => {
        set({ theme });
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },

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

        const clipboardShapes = state.clipboard.shapes;
        const clipboardConnections = state.clipboard.connections;

        // 1. Determine Target Lane
        let targetLaneId: ID | null = null;

        // Check if a Lane is selected
        if (state.selectedIds.length === 1) {
            // Check if selected item is a Lane
            for (const pool of state.pools) {
                const lane = pool.lanes.find(l => l.id === state.selectedIds[0]);
                if (lane) {
                    targetLaneId = lane.id;
                    break;
                }
            }

            // If not a lane, check if it's a Pool (use first lane)
            if (!targetLaneId) {
                const pool = state.pools.find(p => p.id === state.selectedIds[0]);
                if (pool && pool.lanes.length > 0) {
                    targetLaneId = pool.lanes[0].id;
                }
            }
        }

        // Fallback: Try to find original lanes or use first available lane
        const idMap = new Map<ID, ID>();
        const newShapes: Record<ID, Shape> = {};
        const newShapeIds: ID[] = [];
        let updatedPools = [...state.pools];

        // Calculate bounding box of clipboard shapes for relative positioning
        const minX = Math.min(...clipboardShapes.map(s => s.position.x));
        const minY = Math.min(...clipboardShapes.map(s => s.position.y));

        clipboardShapes.forEach(original => {
            const newId = uuidv4();
            idMap.set(original.id, newId);

            // Determine effective target lane for this specific shape
            let effectiveTargetLaneId = targetLaneId;

            // If no explicit target selected, try original parent
            if (!effectiveTargetLaneId) {
                // Check if original parent still exists
                const originalParentExists = state.pools.some(p => p.lanes.some(l => l.id === original.parentId));
                if (originalParentExists) {
                    effectiveTargetLaneId = original.parentId;
                } else {
                    // Fallback to first available lane in the system
                    if (state.pools.length > 0 && state.pools[0].lanes.length > 0) {
                        effectiveTargetLaneId = state.pools[0].lanes[0].id;
                    }
                }
            }

            if (!effectiveTargetLaneId) return; // Should not happen unless diagram is empty

            // Calculate new position
            let newPosition = { ...original.position };

            if (effectiveTargetLaneId !== original.parentId) {
                // Pasting into different lane: Reposition relative to top-left (50, 50)
                newPosition = {
                    x: original.position.x - minX + 50,
                    y: original.position.y - minY + 50
                };
            } else {
                // Pasting into same lane: Offset slightly
                newPosition = {
                    x: original.position.x + 20,
                    y: original.position.y + 20
                };
            }

            const newShape: Shape = {
                ...original,
                id: newId,
                parentId: effectiveTargetLaneId,
                position: newPosition,
                label: (original.label || 'Shape').endsWith('(Copy)') ? original.label : `${original.label || 'Shape'} (Copy)`,
            };

            newShapes[newId] = newShape;
            newShapeIds.push(newId);

            // Add to pool/lane structure
            updatedPools = updatedPools.map(pool => ({
                ...pool,
                lanes: pool.lanes.map(lane => {
                    if (lane.id === effectiveTargetLaneId) {
                        return {
                            ...lane,
                            shapeIds: [...lane.shapeIds, newId]
                        };
                    }
                    return lane;
                })
            }));
        });

        // 2. Create new connections
        const newConnections: Connection[] = clipboardConnections.map(conn => ({
            id: uuidv4(),
            sourceShapeId: idMap.get(conn.sourceShapeId)!,
            targetShapeId: idMap.get(conn.targetShapeId)!,
        }));

        set({
            shapes: { ...state.shapes, ...newShapes },
            pools: updatedPools,
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

    deleteShape: (shapeId: ID) => {
        const state = get();
        const shape = state.shapes[shapeId];
        if (!shape) return;

        // Remove shape from its parent lane
        const updatedPools = state.pools.map(pool => ({
            ...pool,
            lanes: pool.lanes.map(lane => ({
                ...lane,
                shapeIds: lane.shapeIds.filter(id => id !== shapeId)
            }))
        }));

        // Remove the shape
        const newShapes = { ...state.shapes };
        delete newShapes[shapeId];

        // Remove all connections involving this shape (cascade delete)
        const newConnections = state.connections.filter(
            c => c.sourceShapeId !== shapeId && c.targetShapeId !== shapeId
        );

        set({
            pools: updatedPools,
            shapes: newShapes,
            connections: newConnections,
            selectedIds: state.selectedIds.filter(id => id !== shapeId),
        });
        get().addHistorySnapshot();
    },

    updateConnection: (id, updates) => {
        set((state) => ({
            connections: state.connections.map(c =>
                c.id === id ? { ...c, ...updates } : c
            )
        }));
        get().addHistorySnapshot();
    },

    deleteConnection: (connectionId: ID) => {
        set((state) => ({
            connections: state.connections.filter(c => c.id !== connectionId),
            selectedIds: state.selectedIds.filter(id => id !== connectionId),
        }));
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

        // Determine size based on type
        let size = { width: 100, height: 60 }; // default rect
        let actualType: ShapeType = 'rect';

        if (type === 'rect-wide') {
            size = { width: 150, height: 60 };
            actualType = 'rect';
        } else if (type === 'rect-extra-wide') {
            size = { width: 200, height: 60 };
            actualType = 'rect';
        } else if (type === 'diamond') {
            size = { width: 80, height: 80 };
            actualType = 'diamond';
        } else if (type === 'circle') {
            size = { width: 80, height: 80 };
            actualType = 'circle';
        } else if (type === 'document') {
            size = { width: 100, height: 80 };
            actualType = 'document';
        } else if (type === 'database') {
            size = { width: 90, height: 90 };
            actualType = 'database';
        } else if (type === 'manual-input') {
            size = { width: 100, height: 60 };
            actualType = 'manual-input';
        } else if (type === 'delay') {
            size = { width: 100, height: 60 };
            actualType = 'delay';
        } else if (type === 'start' || type === 'end') {
            actualType = type;
        }

        const newShape: Shape = {
            id: shapeId,
            type: actualType,
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

    clearDiagram: () => {
        set({ pools: [], shapes: {}, connections: [], selectedIds: [], poolPlacementMode: null, history: [], historyIndex: -1 });
    },

    loadDiagram: (newState) => set({
        pools: newState.pools,
        shapes: newState.shapes,
        connections: newState.connections || [],
        groups: newState.groups || {},
        textBoxes: newState.textBoxes || [],
        theme: newState.theme || 'dark',
        currentProjectName: newState.currentProjectName || null,
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
            groups: state.groups,
            connections: state.connections,
            textBoxes: state.textBoxes,
            selectedIds: state.selectedIds,
            activeTool: state.activeTool,
            connectionSourceId: state.connectionSourceId,
            poolPlacementMode: state.poolPlacementMode,
            propertiesPanelVisible: state.propertiesPanelVisible,
            clipboard: state.clipboard,
            currentProjectName: state.currentProjectName,
            theme: state.theme,
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
        if (state.selectedIds.length < 2) return;

        const selectedShapes = state.selectedIds
            .map(id => state.shapes[id])
            .filter(s => s !== undefined);

        if (selectedShapes.length < 2) return;

        let targetValue: number;

        switch (alignment) {
            case 'left':
                targetValue = Math.min(...selectedShapes.map(s => s.position.x));
                break;
            case 'center':
                {
                    const minX = Math.min(...selectedShapes.map(s => s.position.x));
                    const maxX = Math.max(...selectedShapes.map(s => s.position.x + s.size.width));
                    targetValue = minX + (maxX - minX) / 2;
                }
                break;
            case 'right':
                targetValue = Math.max(...selectedShapes.map(s => s.position.x + s.size.width));
                break;
            case 'top':
                targetValue = Math.min(...selectedShapes.map(s => s.position.y));
                break;
            case 'middle':
                {
                    const minY = Math.min(...selectedShapes.map(s => s.position.y));
                    const maxY = Math.max(...selectedShapes.map(s => s.position.y + s.size.height));
                    targetValue = minY + (maxY - minY) / 2;
                }
                break;
            case 'bottom':
                targetValue = Math.max(...selectedShapes.map(s => s.position.y + s.size.height));
                break;
        }

        const newShapes = { ...state.shapes };

        selectedShapes.forEach(shape => {
            let newX = shape.position.x;
            let newY = shape.position.y;

            switch (alignment) {
                case 'left':
                    newX = targetValue;
                    break;
                case 'center':
                    newX = targetValue - shape.size.width / 2;
                    break;
                case 'right':
                    newX = targetValue - shape.size.width;
                    break;
                case 'top':
                    newY = targetValue;
                    break;
                case 'middle':
                    newY = targetValue - shape.size.height / 2;
                    break;
                case 'bottom':
                    newY = targetValue - shape.size.height;
                    break;
            }

            newShapes[shape.id] = {
                ...shape,
                position: { x: newX, y: newY }
            };
        });

        set({ shapes: newShapes });
        get().addHistorySnapshot();
    },

    groupShapes: () => {
        const state = get();
        if (state.selectedIds.length < 2) return;

        const groupId = uuidv4();
        const newGroup: Group = {
            id: groupId,
            shapeIds: [...state.selectedIds]
        };

        const newShapes = { ...state.shapes };
        state.selectedIds.forEach(id => {
            if (newShapes[id]) {
                newShapes[id] = { ...newShapes[id], groupId };
            }
        });

        set({
            groups: { ...state.groups, [groupId]: newGroup },
            shapes: newShapes,
            selectedIds: [groupId] // Select the group
        });
        get().addHistorySnapshot();
    },

    ungroupShapes: () => {
        const state = get();
        // Find selected groups
        // Since selectedIds can contain both shape IDs and Group IDs (though UI should handle this),
        // we check if any selected ID corresponds to a group.
        const selectedGroupIds = state.selectedIds.filter(id => state.groups[id]);

        if (selectedGroupIds.length === 0) return;

        const newGroups = { ...state.groups };
        const newShapes = { ...state.shapes };
        let newSelectedIds: ID[] = [];

        selectedGroupIds.forEach(groupId => {
            const group = state.groups[groupId];
            if (group) {
                // Remove groupId from shapes
                group.shapeIds.forEach(shapeId => {
                    if (newShapes[shapeId]) {
                        const { groupId: _, ...rest } = newShapes[shapeId];
                        newShapes[shapeId] = rest as Shape;
                        newSelectedIds.push(shapeId); // Select individual shapes after ungrouping
                    }
                });
                delete newGroups[groupId];
            }
        });

        set({
            groups: newGroups,
            shapes: newShapes,
            selectedIds: newSelectedIds
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

            const newPosition = { x: snappedX, y: snappedY };

            // Calculate delta
            const deltaX = newPosition.x - shape.position.x;
            const deltaY = newPosition.y - shape.position.y;

            if (deltaX === 0 && deltaY === 0) return state;

            const newShapes = { ...state.shapes };
            const shapesToMove = new Set<ID>();

            // 1. Always move the dragged shape
            // (We don't add it to shapesToMove to avoid double application, handled explicitly below)

            // 2. If dragged shape is in a group, move all group members
            if (shape.groupId && state.groups[shape.groupId]) {
                state.groups[shape.groupId].shapeIds.forEach(id => {
                    if (id !== shapeId) shapesToMove.add(id);
                });
            }

            // 3. If dragged shape (or its group) is selected, move all other selected items
            const isDraggedShapeSelected = state.selectedIds.includes(shapeId);
            const isDraggedGroupSelected = shape.groupId && state.selectedIds.includes(shape.groupId);

            if (isDraggedShapeSelected || isDraggedGroupSelected) {
                state.selectedIds.forEach(selectedId => {
                    // If selected ID is a group, add all its members
                    if (state.groups[selectedId]) {
                        state.groups[selectedId].shapeIds.forEach(id => {
                            if (id !== shapeId) shapesToMove.add(id);
                        });
                    }
                    // If selected ID is a shape, add it
                    else if (state.shapes[selectedId] && selectedId !== shapeId) {
                        shapesToMove.add(selectedId);
                    }
                });
            }

            // Apply updates
            // Update the dragged shape
            newShapes[shapeId] = {
                ...shape,
                position: newPosition
            };

            // Update other shapes
            shapesToMove.forEach(id => {
                if (newShapes[id]) {
                    newShapes[id] = {
                        ...newShapes[id],
                        position: {
                            x: newShapes[id].position.x + deltaX,
                            y: newShapes[id].position.y + deltaY
                        }
                    };
                }
            });

            return { shapes: newShapes };
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

    // TextBox actions
    addTextBox: (position) => {
        const textBoxId = uuidv4();
        const newTextBox: import('./types').TextBox = {
            id: textBoxId,
            position: { x: snap(position.x), y: snap(position.y) },
            size: { width: 400, height: 200 },
            content: ''
        };
        set((state) => ({
            textBoxes: [...state.textBoxes, newTextBox],
            selectedIds: [textBoxId]
        }));
        get().addHistorySnapshot();
    },

    updateTextBox: (id, updates) => {
        set((state) => ({
            textBoxes: state.textBoxes.map(tb =>
                tb.id === id ? { ...tb, ...updates } : tb
            )
        }));
    },

    deleteTextBox: (id) => {
        set((state) => ({
            textBoxes: state.textBoxes.filter(tb => tb.id !== id),
            selectedIds: state.selectedIds.filter(sid => sid !== id)
        }));
        get().addHistorySnapshot();
    },

}));
