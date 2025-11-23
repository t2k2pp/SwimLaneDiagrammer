export type ID = string;

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export type ShapeType = 'rect' | 'circle' | 'diamond' | 'start' | 'end' | 'document' | 'database' | 'manual-input' | 'delay';

export interface Shape {
    id: ID;
    type: ShapeType;
    position: Position; // Relative to the lane
    size: Size;
    label?: string;
    color?: string; // Custom color (optional)
    parentId: ID; // ID of the Lane it belongs to
    groupId?: ID; // ID of the Group it belongs to
}

export interface Group {
    id: ID;
    shapeIds: ID[];
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
    orientation: 'horizontal' | 'vertical'; // horizontal: lanes stack vertically, vertical: lanes arranged horizontally
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
    groups: Record<ID, Group>;
    connections: Connection[];
    selectedIds: ID[];
    activeTool: 'select' | 'connection';
    connectionSourceId: ID | null;
    poolPlacementMode: 'horizontal' | 'vertical' | null;
    propertiesPanelVisible: boolean;
    clipboard: { shapes: Shape[]; connections: Connection[] } | null;
    currentProjectName: string | null;
    history: DiagramState[];
    historyIndex: number;
    theme: 'light' | 'dark';
}
