import React, { useState, useCallback } from 'react';
import { Connection } from '../types';
import { generateId } from '../utils/helpers';

interface UseConnectionsProps {
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useConnections({ addToast }: UseConnectionsProps) {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const [connectingHandleId, setConnectingHandleId] = useState<string | null>(null);
    const [connectionMousePos, setConnectionMousePos] = useState<{ x: number; y: number } | null>(null);

    const handleConnectStart = useCallback((e: React.MouseEvent, nodeId: string, handleId: string) => {
        e.stopPropagation();
        e.preventDefault();
        setConnectingNodeId(nodeId);
        setConnectingHandleId(handleId);
        setConnectionMousePos({ x: e.clientX, y: e.clientY });
    }, []);

    const handleConnectEnd = useCallback((e: React.MouseEvent, targetNodeId: string) => {
        e.stopPropagation();
        e.preventDefault();

        if (connectingNodeId && connectingNodeId !== targetNodeId) {
            // Check if connection already exists
            const exists = connections.some(c =>
                c.source === connectingNodeId &&
                c.target === targetNodeId &&
                c.sourceHandle === connectingHandleId
            );

            if (!exists) {
                setConnections(prev => [...prev, {
                    id: generateId(),
                    source: connectingNodeId,
                    target: targetNodeId,
                    sourceHandle: connectingHandleId!,
                    targetHandle: 'input' // Default to 'input' for now
                }]);
                addToast('Connected!', 'success');
            }
        }
        setConnectingNodeId(null);
        setConnectingHandleId(null);
        setConnectionMousePos(null);
    }, [connectingNodeId, connectingHandleId, connections, addToast]);

    const updateConnectionMousePos = useCallback((x: number, y: number) => {
        if (connectingNodeId) {
            setConnectionMousePos({ x, y });
        }
    }, [connectingNodeId]);

    const cancelConnection = useCallback(() => {
        setConnectingNodeId(null);
        setConnectingHandleId(null);
        setConnectionMousePos(null);
    }, []);

    const addConnection = useCallback((source: string, target: string, sourceHandle: string = 'main', targetHandle: string = 'input') => {
        setConnections(prev => [...prev, {
            id: generateId(),
            source,
            target,
            sourceHandle,
            targetHandle
        }]);
    }, []);

    return {
        connections,
        setConnections,
        connectingNodeId,
        setConnectingNodeId,
        connectingHandleId,
        setConnectingHandleId,
        connectionMousePos,
        updateConnectionMousePos,
        cancelConnection,
        handleConnectStart,
        handleConnectEnd,
        addConnection
    };
}
