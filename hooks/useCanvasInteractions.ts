import React, { useState, useRef, useCallback, RefObject } from 'react';
import { Viewport, NodeInstance } from '../types';

interface UseCanvasInteractionsProps {
    viewport: Viewport;
    setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
    nodes: NodeInstance[];
    setSelectedNodeId: (id: string | null) => void;
    setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setQuickAdd: React.Dispatch<React.SetStateAction<{ visible: boolean; x: number; y: number; sourceNodeId?: string }>>;
    connectingNodeId: string | null;
    canvasRef: RefObject<HTMLDivElement>;
}

export function useCanvasInteractions({
    viewport,
    setViewport,
    nodes,
    setSelectedNodeId,
    setSelectedNodeIds,
    setQuickAdd,
    connectingNodeId,
    canvasRef
}: UseCanvasInteractionsProps) {
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [isBoxSelecting, setIsBoxSelecting] = useState(false);
    const [boxSelectStart, setBoxSelectStart] = useState<{ x: number; y: number } | null>(null);
    const [boxSelectEnd, setBoxSelectEnd] = useState<{ x: number; y: number } | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const canvasBounds = useRef<DOMRect | null>(null);

    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0 && !connectingNodeId) { // Left click
            if (e.target === canvasRef.current) {
                // Cache bounds on start
                if (canvasRef.current) {
                    canvasBounds.current = canvasRef.current.getBoundingClientRect();
                }

                if (!e.ctrlKey && !e.shiftKey) {
                    // Start box selection or panning
                    if (e.altKey) {
                        // Alt + Click = Box selection
                        setIsBoxSelecting(true);
                        const rect = canvasBounds.current!;
                        const x = (e.clientX - rect.left - viewport.x) / viewport.k;
                        const y = (e.clientY - rect.top - viewport.y) / viewport.k;
                        setBoxSelectStart({ x, y });
                        setBoxSelectEnd({ x, y });
                    } else {
                        // Normal panning
                        setIsPanning(true);
                        setLastMousePos({ x: e.clientX, y: e.clientY });
                    }
                }
                // Deselect all if clicking on empty canvas without modifiers
                if (!e.ctrlKey && !e.shiftKey && !e.altKey) {
                    setSelectedNodeId(null);
                    setSelectedNodeIds(new Set());
                }
                setQuickAdd(prev => ({ ...prev, visible: false }));
            }
        }
    }, [connectingNodeId, canvasRef, viewport, setSelectedNodeId, setSelectedNodeIds, setQuickAdd]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        if (!canvasRef.current) return;

        // FAST PATH: Use cached bounds if dragging/panning
        let rect = canvasBounds.current;
        if (!rect) {
            rect = canvasRef.current.getBoundingClientRect();
            canvasBounds.current = rect;
        }

        mousePos.current = {
            x: (e.clientX - rect.left - viewport.x) / viewport.k,
            y: (e.clientY - rect.top - viewport.y) / viewport.k
        };

        // Box selection
        if (isBoxSelecting && boxSelectStart) {
            const x = (e.clientX - rect.left - viewport.x) / viewport.k;
            const y = (e.clientY - rect.top - viewport.y) / viewport.k;
            setBoxSelectEnd({ x, y });

            // Calculate box bounds
            const minX = Math.min(boxSelectStart.x, x);
            const maxX = Math.max(boxSelectStart.x, x);
            const minY = Math.min(boxSelectStart.y, y);
            const maxY = Math.max(boxSelectStart.y, y);

            // Find nodes within box
            const nodesInBox = nodes.filter(node => {
                const nodeRight = node.position.x + 240;
                const nodeBottom = node.position.y + 72;
                return (
                    node.position.x < maxX &&
                    nodeRight > minX &&
                    node.position.y < maxY &&
                    nodeBottom > minY
                );
            });

            setSelectedNodeIds(new Set(nodesInBox.map(n => n.id)));
        }

        // Panning
        if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    }, [canvasRef, viewport, isBoxSelecting, boxSelectStart, nodes, setSelectedNodeIds, isPanning, lastMousePos, setViewport]);

    const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
        setIsPanning(false);
        setIsBoxSelecting(false);
        setBoxSelectStart(null);
        setBoxSelectEnd(null);

        if (connectingNodeId && !e.defaultPrevented) {
            // MAGIC CONNECT: If we released over canvas (not a handle), open Quick Add to create & connect
            if (canvasRef.current) {
                setQuickAdd({
                    visible: true,
                    x: (mousePos.current.x * viewport.k) + viewport.x + canvasRef.current.getBoundingClientRect().left,
                    y: (mousePos.current.y * viewport.k) + viewport.y + canvasRef.current.getBoundingClientRect().top,
                    sourceNodeId: connectingNodeId
                });
            }
        }
    }, [connectingNodeId, canvasRef, viewport, setQuickAdd]);

    const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setQuickAdd({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            sourceNodeId: undefined
        });
    }, [setQuickAdd]);

    return {
        isPanning,
        isBoxSelecting,
        boxSelectStart,
        boxSelectEnd,
        mousePos,
        handleCanvasMouseDown,
        handleCanvasMouseMove,
        handleCanvasMouseUp,
        handleCanvasContextMenu
    };
}
