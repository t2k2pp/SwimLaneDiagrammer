import React from 'react';
import { useDiagramStore } from '../core/store';
import type { Connection } from '../core/types';

interface Props {
    connection: Connection;
}

export const ConnectionComponent: React.FC<Props> = ({ connection }) => {
    const { shapes } = useDiagramStore();
    const source = shapes[connection.sourceShapeId];
    const target = shapes[connection.targetShapeId];

    if (!source || !target) return null;

    // Calculate center points (simplified)
    // In a real app, we'd calculate intersection points with the shape borders
    // For now, we just use the center of the shape relative to the canvas
    // BUT wait, shapes are inside lanes, which are inside pools.
    // Their 'position' is relative to the Lane.
    // This makes rendering connections on the main Canvas tricky without knowing absolute positions.
    // We need a way to get absolute positions or render connections within the same coordinate space.

    // OPTION 1: Render connections on top of everything using absolute coordinates calculated from DOM or Store.
    // Since we have nested structure (Pool -> Lane -> Shape), the Store only knows relative positions.
    // We might need a helper to calculate absolute position if we want to draw lines across different lanes/pools.

    // For MVP, let's assume we can calculate it.
    // Actually, to keep it simple, we might need to look up the pool and lane for each shape.

    return null; // Placeholder until we solve the coordinate system issue
};
