import React from 'react';
import { useDiagramStore } from '../core/store';
import type { ID, Position } from '../core/types';

export const ConnectionLayer: React.FC = () => {
    const { connections, shapes, pools } = useDiagramStore();

    const getShapeAbsolutePosition = (shapeId: ID): Position | null => {
        const shape = shapes[shapeId];
        if (!shape) return null;

        // Find the lane and pool for this shape
        for (const pool of pools) {
            let currentLaneY = 0;
            for (const lane of pool.lanes) {
                if (lane.id === shape.parentId) {
                    // Found the lane
                    // Pool Header Height = 40px (defined in Pool.css)
                    // Lane Header Width = 40px (defined in Lane.css)
                    // Pool position + Pool Header Height (40) + Lane Offset Y + Shape Position
                    // Also add Lane Header Width (40) to x
                    return {
                        x: pool.position.x + 40 + shape.position.x,
                        y: pool.position.y + 40 + currentLaneY + shape.position.y
                    };
                }
                currentLaneY += lane.height;
            }
        }
        return null;
    };

    return (
        <svg className="connection-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 50 }}>
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#646cff" />
                </marker>
            </defs>
            {connections.map(conn => {
                const start = getShapeAbsolutePosition(conn.sourceShapeId);
                const end = getShapeAbsolutePosition(conn.targetShapeId);

                if (!start || !end) return null;

                const sourceShape = shapes[conn.sourceShapeId];
                const targetShape = shapes[conn.targetShapeId];

                if (!sourceShape || !targetShape) return null;

                // Calculate center points
                const sourceCenterX = start.x + sourceShape.size.width / 2;
                const sourceCenterY = start.y + sourceShape.size.height / 2;
                const targetCenterX = end.x + targetShape.size.width / 2;
                const targetCenterY = end.y + targetShape.size.height / 2;

                // Determine connection points based on relative positions
                let startX, startY, endX, endY;

                // Calculate angle between centers
                const dx = targetCenterX - sourceCenterX;
                const dy = targetCenterY - sourceCenterY;
                const angle = Math.atan2(dy, dx);

                // Source shape connection point (which side to exit from)
                if (Math.abs(angle) < Math.PI / 4) {
                    // Right side
                    startX = start.x + sourceShape.size.width;
                    startY = sourceCenterY;
                } else if (Math.abs(angle) > 3 * Math.PI / 4) {
                    // Left side
                    startX = start.x;
                    startY = sourceCenterY;
                } else if (angle > 0) {
                    // Bottom side
                    startX = sourceCenterX;
                    startY = start.y + sourceShape.size.height;
                } else {
                    // Top side
                    startX = sourceCenterX;
                    startY = start.y;
                }

                // Target shape connection point (which side to enter from)
                const reverseAngle = angle + Math.PI; // Angle from target to source
                if (Math.abs(reverseAngle) < Math.PI / 4 || Math.abs(reverseAngle) > 7 * Math.PI / 4) {
                    // Right side
                    endX = end.x + targetShape.size.width;
                    endY = targetCenterY;
                } else if (Math.abs(reverseAngle) > 3 * Math.PI / 4 && Math.abs(reverseAngle) < 5 * Math.PI / 4) {
                    // Left side
                    endX = end.x;
                    endY = targetCenterY;
                } else if (reverseAngle > 0 && reverseAngle < Math.PI) {
                    // Bottom side
                    endX = targetCenterX;
                    endY = end.y + targetShape.size.height;
                } else {
                    // Top side
                    endX = targetCenterX;
                    endY = end.y;
                }

                return (
                    <line
                        key={conn.id}
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke="#646cff"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                    />
                );
            })}
        </svg>
    );
};
