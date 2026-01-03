import { useState, useEffect, useCallback, RefObject } from 'react';
import { Viewport } from '../types';

export function useViewport(canvasRef: RefObject<HTMLDivElement>) {
    const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, k: 1 });

    // Zoom controls
    const zoomIn = useCallback(() => {
        setViewport(prev => ({ ...prev, k: Math.min(prev.k + 0.2, 5) }));
    }, []);

    const zoomOut = useCallback(() => {
        setViewport(prev => ({ ...prev, k: Math.max(prev.k - 0.2, 0.1) }));
    }, []);

    const resetView = useCallback(() => {
        setViewport({ x: 0, y: 0, k: 1 });
    }, []);

    // Wheel event handler with passive: false to prevent warnings
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const wheelHandler = (e: WheelEvent) => {
            e.preventDefault();

            if (e.shiftKey) {
                // Pan with Shift + Scroll
                setViewport(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
            } else {
                // Zoom with normal scroll
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const delta = -e.deltaY;
                const scaleAmount = delta > 0 ? 0.1 : -0.1;
                const newK = Math.max(0.1, Math.min(5, viewport.k + scaleAmount));

                if (newK !== viewport.k) {
                    const scaleChange = newK - viewport.k;
                    const newX = viewport.x - (mouseX - viewport.x) * (scaleChange / viewport.k);
                    const newY = viewport.y - (mouseY - viewport.y) * (scaleChange / viewport.k);

                    setViewport({ x: newX, y: newY, k: newK });
                }
            }
        };

        canvas.addEventListener('wheel', wheelHandler, { passive: false });
        return () => canvas.removeEventListener('wheel', wheelHandler);
    }, [viewport, canvasRef]);

    return {
        viewport,
        setViewport,
        zoomIn,
        zoomOut,
        resetView
    };
}
