import { useEffect, Dispatch, SetStateAction } from 'react';
import type { NodeInstance } from '../types';

interface UseKeyboardShortcutsProps {
    nodes: NodeInstance[];
    selectedNodeIds: Set<string>;
    setSelectedNodeIds: (ids: Set<string>) => void;
    setSelectedNodeId: (id: string | null) => void;
    setNodes: Dispatch<SetStateAction<NodeInstance[]>>;
    setConnections: Dispatch<SetStateAction<any[]>>;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useKeyboardShortcuts({
    nodes,
    selectedNodeIds,
    setSelectedNodeIds,
    setSelectedNodeId,
    setNodes,
    setConnections,
    addToast
}: UseKeyboardShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+A: Select all nodes
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                setSelectedNodeIds(new Set(nodes.map(n => n.id)));
                addToast(`Selected ${nodes.length} nodes`, 'info');
            }

            // Escape: Deselect all
            if (e.key === 'Escape') {
                setSelectedNodeIds(new Set());
                setSelectedNodeId(null);
            }

            // Delete: Remove selected nodes
            if (e.key === 'Delete' && selectedNodeIds.size > 0) {
                selectedNodeIds.forEach(id => {
                    setNodes(prev => prev.filter(n => n.id !== id));
                    setConnections(prev => prev.filter(c => c.source !== id && c.target !== id));
                });
                addToast(`Deleted ${selectedNodeIds.size} nodes`, 'info');
                setSelectedNodeIds(new Set());
                setSelectedNodeId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nodes, selectedNodeIds, setSelectedNodeIds, setSelectedNodeId, setNodes, setConnections, addToast]);
}
