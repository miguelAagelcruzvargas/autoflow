import { useState, useCallback } from 'react';
import { NodeInstance, Connection } from '../types';
import { workflowService } from '../services/workflowService';

interface UseWorkflowOperationsProps {
    nodes: NodeInstance[];
    connections: Connection[];
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useWorkflowOperations({ nodes, connections, addToast }: UseWorkflowOperationsProps) {
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

    const handleSaveWorkflow = useCallback(async () => {
        try {
            if (currentWorkflowId) {
                // Update existing
                const { error } = await workflowService.updateWorkflow(currentWorkflowId, {
                    nodes,
                    connections
                });
                if (error) {
                    addToast(`Save failed: ${error}`, "error");
                } else {
                    addToast("Workflow saved", "success");
                }
            } else {
                // Create new
                const { workflow, error } = await workflowService.createWorkflow(
                    `Workflow ${new Date().toLocaleString()}`,
                    nodes,
                    connections
                );
                if (error || !workflow) {
                    addToast(`Save failed: ${error}`, "error");
                } else {
                    setCurrentWorkflowId(workflow.id);
                    addToast("Workflow saved", "success");
                }
            }
        } catch (err) {
            addToast("Save error", "error");
        }
    }, [currentWorkflowId, nodes, connections, addToast]);

    const handleLoadWorkflow = useCallback(async (id: string) => {
        try {
            const { workflow, error } = await workflowService.getWorkflow(id);
            if (error || !workflow) {
                addToast(`Load failed: ${error}`, "error");
                return null;
            }
            setCurrentWorkflowId(workflow.id);
            addToast("Workflow loaded", "success");
            return { nodes: workflow.nodes as NodeInstance[], connections: workflow.connections as Connection[] };
        } catch (err) {
            addToast("Load error", "error");
            return null;
        }
    }, [addToast]);

    return {
        currentWorkflowId,
        setCurrentWorkflowId,
        handleSaveWorkflow,
        handleLoadWorkflow
    };
}
