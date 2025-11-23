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
    textColor?: 'auto' | 'white' | 'black'; // Text color (optional)
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
    type?: 'straight' | 'step' | 'bezier'; // Default: straight
    style?: 'solid' | 'dashed' | 'dotted'; // Default: solid
    startMarker?: 'none' | 'arrow' | 'circle'; // Default: none
    endMarker?: 'none' | 'arrow' | 'circle'; // Default: arrow
    width?: number; // Default: 2
    color?: string; // Default: black
    label?: string; // Optional label
    controlPoints?: Position[]; // Manual routing points
}

export interface TextBox {
    id: ID;
    position: Position; // Absolute position on Canvas
    size: Size;
    content: string; // Markdown text
    textColor?: 'auto' | 'black' | 'white'; // Default: 'auto'
    backgroundColor?: string; // Default: 'transparent'
    opacity?: number; // 0-1, Default: 1
    showScrollBar?: boolean; // Default: true
    borderColor?: string; // Default: theme border color
    showBorder?: boolean; // Default: true
}

export interface DiagramState {
    pools: Pool[];
    shapes: Record<ID, Shape>;
    groups: Record<ID, Group>;
    connections: Connection[];
    textBoxes: TextBox[];
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
