import React, { useMemo } from 'react';
import type { Connection, NodeInstance, Viewport } from '../../types';

interface ConnectionLinesProps {
    connections: Connection[];
    nodes: NodeInstance[];
    viewport: Viewport;
    connectingFrom?: { nodeId: string; handleId: string; mouseX: number; mouseY: number } | null;
}

export function ConnectionLines({ connections, nodes, viewport, connectingFrom }: ConnectionLinesProps) {
    const lines = useMemo(() => {
        return connections.map(conn => {
            const source = nodes.find(n => n.id === conn.source);
            const target = nodes.find(n => n.id === conn.target);
            if (!source || !target) return null;

            // Calculate connection points
            const sourceX = source.position.x + 240; // Width of node
            const sourceY = source.position.y + 36; // Mid-height
            const targetX = target.position.x;
            const targetY = target.position.y + 36;

            // Bezier curve for smooth connections
            const d = `M ${sourceX} ${sourceY} C ${sourceX + 50} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`;

            return (
                <path
                    key={conn.id}
                    d={d}
                    stroke="#475569"
                    strokeWidth="1"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-200 hover:stroke-indigo-400 hover:stroke-[1.5]"
                />
            );
        });
    }, [connections, nodes]);

    // Temporary connection line while dragging
    const tempLine = useMemo(() => {
        if (!connectingFrom) return null;

        const sourceNode = nodes.find(n => n.id === connectingFrom.nodeId);
        if (!sourceNode) return null;

        const sourceX = sourceNode.position.x + 240;
        const sourceY = sourceNode.position.y + 36;

        // Mouse position in canvas coordinates
        const targetX = (connectingFrom.mouseX - viewport.x) / viewport.k;
        const targetY = (connectingFrom.mouseY - viewport.y) / viewport.k;

        const d = `M ${sourceX} ${sourceY} C ${sourceX + 50} ${sourceY}, ${targetX - 50} ${targetY}, ${targetX} ${targetY}`;

        return (
            <path
                d={d}
                stroke="#6366f1"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                className="animate-pulse"
            />
        );
    }, [connectingFrom, nodes, viewport]);

    return (
        <svg className="absolute inset-0 overflow-visible pointer-events-none z-10">
            <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#475569" />
                </marker>
            </defs>
            <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.k})`}>
                {lines}
                {tempLine}
            </g>
        </svg>
    );
}
