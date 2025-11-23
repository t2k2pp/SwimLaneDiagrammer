import type { Position } from '../core/types';

export const getStraightPath = (start: Position, end: Position): string => {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
};

export const getStepPath = (start: Position, end: Position): string => {
    const midX = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
};

export const getBezierPath = (start: Position, end: Position): string => {
    const dist = Math.abs(end.x - start.x);
    const cp1 = { x: start.x + dist * 0.5, y: start.y };
    const cp2 = { x: end.x - dist * 0.5, y: end.y };
    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${end.x} ${end.y}`;
};

export const getPath = (
    type: 'straight' | 'step' | 'bezier' | undefined,
    start: Position,
    end: Position,
    controlPoints?: Position[]
): string => {
    if (controlPoints && controlPoints.length > 0) {
        if (type === 'bezier') {
            if (controlPoints.length === 1) {
                // Quadratic Bezier
                return `M ${start.x} ${start.y} Q ${controlPoints[0].x} ${controlPoints[0].y} ${end.x} ${end.y}`;
            } else if (controlPoints.length === 2) {
                // Cubic Bezier
                return `M ${start.x} ${start.y} C ${controlPoints[0].x} ${controlPoints[0].y} ${controlPoints[1].x} ${controlPoints[1].y} ${end.x} ${end.y}`;
            }
        }
        // Polyline for straight/step or complex bezier fallback
        const points = [start, ...controlPoints, end];
        return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    }

    switch (type) {
        case 'step':
            return getStepPath(start, end);
        case 'bezier':
            return getBezierPath(start, end);
        case 'straight':
        default:
            return getStraightPath(start, end);
    }
};
