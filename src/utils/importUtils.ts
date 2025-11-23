import type { DiagramState, Shape, Pool, Connection, Group, TextBox, ID } from '../core/types';

// Loose type definition for imported data to allow flexibility
export interface ImportedProjectData {
    pools?: any[];
    shapes?: any; // Can be Record<ID, Shape> or Shape[]
    groups?: any;
    connections?: any[];
    textBoxes?: any[];
    theme?: 'light' | 'dark';
}

/**
 * Normalizes imported project data into a valid DiagramState structure.
 * Handles:
 * - Converting shapes array to record
 * - Rebuilding lane.shapeIds based on shape.parentId
 * - Ensuring default values for missing fields
 */
export const normalizeProjectData = (data: ImportedProjectData): Partial<DiagramState> => {
    const pools: Pool[] = Array.isArray(data.pools) ? data.pools : [];
    let shapes: Record<ID, Shape> = {};
    const groups: Record<ID, Group> = data.groups || {};
    const connections: Connection[] = Array.isArray(data.connections) ? data.connections : [];
    const textBoxes: TextBox[] = Array.isArray(data.textBoxes) ? data.textBoxes : [];
    const theme = data.theme || 'dark';

    // 1. Normalize Shapes (Array -> Record)
    if (Array.isArray(data.shapes)) {
        data.shapes.forEach((s: any) => {
            if (s.id) {
                shapes[s.id] = s as Shape;
            }
        });
    } else if (typeof data.shapes === 'object' && data.shapes !== null) {
        shapes = data.shapes;
    }

    // 2. Rebuild Lane shapeIds
    // This ensures that even if the JSON didn't explicitly list shapeIds in lanes,
    // we can reconstruct it from shape.parentId.
    // We also clear existing shapeIds to avoid duplicates or stale IDs.

    // Create a map of laneId -> shapeIds
    const laneShapesMap: Record<ID, ID[]> = {};

    Object.values(shapes).forEach(shape => {
        if (shape.parentId) {
            if (!laneShapesMap[shape.parentId]) {
                laneShapesMap[shape.parentId] = [];
            }
            laneShapesMap[shape.parentId].push(shape.id);
        }
    });

    // Update pools with rebuilt shapeIds
    const normalizedPools = pools.map(pool => ({
        ...pool,
        lanes: pool.lanes.map(lane => ({
            ...lane,
            shapeIds: laneShapesMap[lane.id] || []
        }))
    }));

    return {
        pools: normalizedPools,
        shapes,
        groups,
        connections,
        textBoxes,
        theme,
        selectedIds: [],
        history: [],
        historyIndex: -1
    };
};
