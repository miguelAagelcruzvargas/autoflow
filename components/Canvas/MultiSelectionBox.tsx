import React from 'react';
import type { NodeInstance, Viewport } from '../../types';

interface MultiSelectionBoxProps {
    selectedNodeIds: Set<string>;
    nodes: NodeInstance[];
    viewport: Viewport;
}

export function MultiSelectionBox({ selectedNodeIds, nodes, viewport }: MultiSelectionBoxProps) {
    if (selectedNodeIds.size <= 1) return null;

    const selectedNodes = nodes.filter(n => selectedNodeIds.has(n.id));
    if (selectedNodes.length === 0) return null;

    const minX = Math.min(...selectedNodes.map(n => n.position.x));
    const minY = Math.min(...selectedNodes.map(n => n.position.y));
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + 240));
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + 72));

    return (
        <div
            className="absolute border-2 border-dashed border-indigo-400 rounded-lg pointer-events-none z-10"
            style={{
                left: (minX - 8) * viewport.k + viewport.x,
                top: (minY - 8) * viewport.k + viewport.y,
                width: (maxX - minX + 16) * viewport.k,
                height: (maxY - minY + 16) * viewport.k,
            }}
        >
            <div className="absolute -top-6 left-0 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded">
                {selectedNodeIds.size} selected
            </div>
        </div>
    );
}
