import React from 'react';
import { useDiagramStore } from '../core/store';
import type { ID, Position } from '../core/types';
import { getPath } from '../utils/routing';

export const ConnectionLayer: React.FC = () => {
    const { connections, shapes, pools, selectItem, selectedIds } = useDiagramStore();

    const getShapeAbsolutePosition = (shapeId: ID): Position | null => {
        const shape = shapes[shapeId];
        if (!shape) return null;

        // Find the lane and pool for this shape
        for (const pool of pools) {
            let currentLaneY = 0;
            for (const lane of pool.lanes) {
                if (lane.id === shape.parentId) {
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
                {/* Arrow Marker */}
                <marker id="arrow-end" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                    <polygon points="0 0, 10 5, 0 10" fill="currentColor" />
                </marker>
                <marker id="arrow-start" markerWidth="10" markerHeight="10" refX="1" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                    <polygon points="10 0, 0 5, 10 10" fill="currentColor" />
                </marker>

                {/* Circle Marker */}
                <marker id="circle-end" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                    <circle cx="4" cy="4" r="3" fill="currentColor" />
                </marker>
                <marker id="circle-start" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                    <circle cx="4" cy="4" r="3" fill="currentColor" />
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

                // Determine target for source connection (first control point or target shape center)
                const firstTargetX = conn.controlPoints && conn.controlPoints.length > 0 ? conn.controlPoints[0].x : targetCenterX;
                const firstTargetY = conn.controlPoints && conn.controlPoints.length > 0 ? conn.controlPoints[0].y : targetCenterY;

                // Determine source for target connection (last control point or source shape center)
                const lastSourceX = conn.controlPoints && conn.controlPoints.length > 0 ? conn.controlPoints[conn.controlPoints.length - 1].x : sourceCenterX;
                const lastSourceY = conn.controlPoints && conn.controlPoints.length > 0 ? conn.controlPoints[conn.controlPoints.length - 1].y : sourceCenterY;

                // Calculate angle for source connection
                const dxStart = firstTargetX - sourceCenterX;
                const dyStart = firstTargetY - sourceCenterY;
                const angleStart = Math.atan2(dyStart, dxStart);

                // Source shape connection point
                if (Math.abs(angleStart) < Math.PI / 4) { // Right
                    startX = start.x + sourceShape.size.width;
                    startY = sourceCenterY;
                } else if (Math.abs(angleStart) > 3 * Math.PI / 4) { // Left
                    startX = start.x;
                    startY = sourceCenterY;
                } else if (angleStart > 0) { // Bottom
                    startX = sourceCenterX;
                    startY = start.y + sourceShape.size.height;
                } else { // Top
                    startX = sourceCenterX;
                    startY = start.y;
                }

                // Calculate angle for target connection
                // dxEnd, dyEnd, angleEnd were unused

                // Target shape connection point (incoming angle is opposite of angleEnd)
                // Actually we want the point on the target shape that faces the last source.
                // So we calculate angle from target center to last source to find which side to attach to.
                const dxTargetToSource = lastSourceX - targetCenterX;
                const dyTargetToSource = lastSourceY - targetCenterY;
                const angleTarget = Math.atan2(dyTargetToSource, dxTargetToSource);

                if (Math.abs(angleTarget) < Math.PI / 4) { // Right side of target faces source
                    endX = end.x + targetShape.size.width;
                    endY = targetCenterY;
                } else if (Math.abs(angleTarget) > 3 * Math.PI / 4) { // Left side of target faces source
                    endX = end.x;
                    endY = targetCenterY;
                } else if (angleTarget > 0) { // Bottom side of target faces source
                    endX = targetCenterX;
                    endY = end.y + targetShape.size.height;
                } else { // Top side of target faces source
                    endX = targetCenterX;
                    endY = end.y;
                }

                const pathD = getPath(conn.type, { x: startX, y: startY }, { x: endX, y: endY }, conn.controlPoints);
                const isSelected = selectedIds.includes(conn.id);
                const strokeColor = conn.color || '#646cff';
                const strokeWidth = conn.width || 2;

                // Marker logic
                const markerStart = conn.startMarker === 'arrow' ? 'url(#arrow-start)' :
                    conn.startMarker === 'circle' ? 'url(#circle-start)' : undefined;
                const markerEnd = conn.endMarker === 'none' ? undefined :
                    conn.endMarker === 'circle' ? 'url(#circle-end)' : 'url(#arrow-end)'; // Default to arrow

                return (
                    <g key={conn.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            selectItem(conn.id, e.shiftKey || e.ctrlKey);
                        }}
                        style={{ pointerEvents: 'stroke', cursor: 'pointer', color: strokeColor }}
                    >
                        {/* Invisible wide path for easier selection */}
                        <path
                            d={pathD}
                            stroke="transparent"
                            strokeWidth={Math.max(10, strokeWidth + 8)}
                            fill="none"
                        />
                        {/* Visible path */}
                        <path
                            d={pathD}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={conn.style === 'dashed' ? '5,5' : conn.style === 'dotted' ? '2,2' : undefined}
                            fill="none"
                            markerStart={markerStart}
                            markerEnd={markerEnd}
                            filter={isSelected ? 'drop-shadow(0 0 2px #ffeb3b)' : undefined}
                        />
                        {conn.label && (
                            <text
                                x={(startX + endX) / 2}
                                y={(startY + endY) / 2 - 10}
                                textAnchor="middle"
                                fill={strokeColor}
                                fontSize="12"
                                style={{ pointerEvents: 'none', textShadow: '0 0 2px white' }}
                            >
                                {conn.label}
                            </text>
                        )}

                        {/* Control Points Handles */}
                        {isSelected && conn.controlPoints?.map((cp, index) => (
                            <circle
                                key={index}
                                cx={cp.x}
                                cy={cp.y}
                                r={6}
                                fill="#ffeb3b"
                                stroke="#333"
                                strokeWidth={1}
                                style={{ cursor: 'move', pointerEvents: 'all' }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    const startX = e.clientX;
                                    const startY = e.clientY;
                                    const initialCp = { ...cp };

                                    const handleMouseMove = (moveEvent: MouseEvent) => {
                                        const dx = moveEvent.clientX - startX;
                                        const dy = moveEvent.clientY - startY;
                                        const { updateConnection } = useDiagramStore.getState();
                                        const newPoints = [...(conn.controlPoints || [])];
                                        newPoints[index] = {
                                            x: initialCp.x + dx,
                                            y: initialCp.y + dy
                                        };
                                        updateConnection(conn.id, { controlPoints: newPoints });
                                    };

                                    const handleMouseUp = () => {
                                        window.removeEventListener('mousemove', handleMouseMove);
                                        window.removeEventListener('mouseup', handleMouseUp);
                                    };

                                    window.addEventListener('mousemove', handleMouseMove);
                                    window.addEventListener('mouseup', handleMouseUp);
                                }}
                            />
                        ))}
                    </g>
                );
            })}
        </svg>
    );
};
