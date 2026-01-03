import { useEffect } from 'react';
import type { NodeInstance, Connection } from '../types';
import { NODE_CATALOG } from '../constants';

interface UseWorkflowPersistenceProps {
    nodes: NodeInstance[];
    connections: Connection[];
    setNodes: (nodes: NodeInstance[]) => void;
    setConnections: (connections: Connection[]) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useWorkflowPersistence({
    nodes,
    connections,
    setNodes,
    setConnections,
    addToast
}: UseWorkflowPersistenceProps) {
    // 1. Load from LocalStorage on Mount
    useEffect(() => {
        // Skip auto-restore if we are loading a specific workflow from URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('workflowId')) return;

        const savedDraft = localStorage.getItem('autoflow_draft');
        if (savedDraft) {
            try {
                const { nodes: savedNodes, connections: savedConnections, timestamp } = JSON.parse(savedDraft);

                if (Array.isArray(savedNodes) && Array.isArray(savedConnections)) {
                    // HYDRATION STEP: Restore functions/components lost in JSON
                    const hydratedNodes = savedNodes.map((n: any) => {
                        const template = NODE_CATALOG.find(t => t.type === n.type);
                        return {
                            ...n,
                            // Restore UI assets from catalog (Icons are functions, lost in JSON)
                            icon: template?.icon || n.icon,
                            bg: template?.bg || n.bg,
                            color: template?.color || n.color,
                            component: undefined // Ensure no stale component refs
                        };
                    });

                    setNodes(hydratedNodes);
                    setConnections(savedConnections);

                    if (savedNodes.length > 0) {
                        setTimeout(() => addToast('Workflow restored from autosave', 'success'), 500);
                    }
                }
            } catch (e) {
                console.error('Failed to load draft', e);
            }
        }
    }, []); // Run ONCE on mount - eslint-disable-line react-hooks/exhaustive-deps

    // 2. Auto-Save to LocalStorage on Change
    useEffect(() => {
        // Debounce slightly to avoid thrashing storage on drag
        const timeoutId = setTimeout(() => {
            const draft = {
                nodes,
                connections,
                timestamp: Date.now()
            };
            localStorage.setItem('autoflow_draft', JSON.stringify(draft));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [nodes, connections]);
}
