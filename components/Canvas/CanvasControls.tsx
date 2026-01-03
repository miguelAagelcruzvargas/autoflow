import React from 'react';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import type { Viewport } from '../../types';

interface CanvasControlsProps {
    viewport: Viewport;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
}

export function CanvasControls({ viewport, onZoomIn, onZoomOut, onResetView }: CanvasControlsProps) {
    return (
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-40">
            <button
                onClick={onZoomIn}
                className="p-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/20 shadow-lg"
                title="Zoom In"
            >
                <ZoomIn size={18} />
            </button>
            <button
                onClick={onZoomOut}
                className="p-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/20 shadow-lg"
                title="Zoom Out"
            >
                <ZoomOut size={18} />
            </button>
            <button
                onClick={onResetView}
                className="p-2 bg-[#1A1A1A] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-indigo-600/20 shadow-lg"
                title="Reset View"
            >
                <Maximize size={18} />
            </button>
        </div>
    );
}
