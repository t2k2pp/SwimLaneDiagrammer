export type ID = string;

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export type ShapeType = 'rect' | 'circle' | 'diamond' | 'start' | 'end';

export interface Shape {
    id: ID;
    type: ShapeType;
    position: Position; // Relative to the lane
    size: Size;
    label?: string;
    parentId: ID; // ID of the Lane it belongs to
}

export interface Lane {
    id: ID;
    title: string;
    height: number; // Width is determined by the pool
    shapeIds: ID[]; // References to shapes
}

export interface Pool {
    id: ID;
    title: string;
    position: Position; // Absolute position on canvas
    width: number;
    lanes: Lane[];
}

export interface Connection {
    id: ID;
    sourceShapeId: ID;
    targetShapeId: ID;
}

export interface DiagramState {
    pools: Pool[];
    shapes: Record<ID, Shape>;
    connections: Connection[];
    selectedIds: ID[];
    activeTool: 'select' | 'connection';
    connectionSourceId: ID | null;
    clipboard: { shapes: Shape[]; connections: Connection[] } | null;
    currentProjectName: string | null;
    history: DiagramState[];
    historyIndex: number;
}
