import { useState, useCallback } from 'react';
import { NodeInstance, NodeType, Connection } from '../types';
import { NODE_CATALOG } from '../constants';
import { generateId } from '../utils/helpers';

interface UseNodeOperationsProps {
    nodeNames: Record<string, string>;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useNodeOperations({ nodeNames, addToast }: UseNodeOperationsProps) {
    const [nodes, setNodes] = useState<NodeInstance[]>([]);
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [draggedNodeIds, setDraggedNodeIds] = useState<Set<string>>(new Set());

    const addNode = useCallback((type: NodeType, position: { x: number; y: number }) => {
        const template = NODE_CATALOG.find(n => n.type === type);
        if (!template) return;

        const newNode: NodeInstance = {
            id: generateId(),
            type,
            name: nodeNames[type] || template.name,
            n8nType: template.n8nType,
            n8nVersion: template.n8nVersion,
            position,
            icon: template.icon,
            bg: template.bg,
            color: template.color,
            category: template.category,
            border: template.border,
            fields: template.fields,
            desc: template.desc,
            config: {},
            customParams: {}
        };

        setNodes(prev => [...prev, newNode]);
        addToast(`${newNode.name} added`, 'success');
    }, [nodeNames, addToast]);

    const removeNode = useCallback((id: string) => {
        setNodes(prev => prev.filter(n => n.id !== id));
        // Note: connections cleanup should be handled by the parent component
        addToast('Node removed', 'info');
    }, [addToast]);

    const updateNode = useCallback((id: string, updates: Partial<NodeInstance>) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    }, []);

    return {
        nodes,
        setNodes,
        draggedNodeId,
        setDraggedNodeId,
        draggedNodeIds,
        setDraggedNodeIds,
        addNode,
        removeNode,
        updateNode
    };
}
