import React from 'react';
import type { Viewport } from '../../types';

interface BoxSelectionProps {
    isActive: boolean;
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
    viewport: Viewport;
}

export function BoxSelection({ isActive, start, end, viewport }: BoxSelectionProps) {
    if (!isActive || !start || !end) return null;

    return (
        <div
            className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none z-20"
            style={{
                left: Math.min(start.x, end.x) * viewport.k + viewport.x,
                top: Math.min(start.y, end.y) * viewport.k + viewport.y,
                width: Math.abs(end.x - start.x) * viewport.k,
                height: Math.abs(end.y - start.y) * viewport.k,
            }}
        />
    );
}
