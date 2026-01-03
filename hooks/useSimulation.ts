import { useState, useCallback } from 'react';
import { NodeInstance, Connection } from '../types';
import { executionEngine } from '../services/executionEngine';
import { workflowService } from '../services/workflowService';
import { backendApi } from '../services/backendApi';

interface UseSimulationProps {
    nodes: NodeInstance[];
    connections: Connection[];
    currentWorkflowId: string | null;
    setCurrentWorkflowId: (id: string | null) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useSimulation({
    nodes,
    connections,
    currentWorkflowId,
    setCurrentWorkflowId,
    addToast
}: UseSimulationProps) {
    const [isSimulating, setIsSimulating] = useState(false);
    const [activeSimulationNode, setActiveSimulationNode] = useState<string | null>(null);
    const [simulationLogs, setSimulationLogs] = useState<any[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    const handleSimulate = useCallback(async () => {
        if (!isSimulating) {
            // Start real execution
            setIsSimulating(true);
            setActiveSimulationNode(null);
            setSimulationLogs([]);
            addToast("Starting execution...", "info");

            try {
                // If workflow not saved, save it first
                let workflowId = currentWorkflowId;
                if (!workflowId) {
                    const { workflow, error } = await workflowService.createWorkflow(
                        `Workflow ${new Date().toLocaleString()}`,
                        nodes,
                        connections
                    );
                    if (error || !workflow) {
                        addToast(`Failed to save workflow: ${error || 'Unknown error'}`, "error");
                        setIsSimulating(false);
                        return;
                    }
                    workflowId = workflow.id;
                    setCurrentWorkflowId(workflowId);
                }

                // Execute workflow
                const { executionId, logs, error } = await executionEngine.executeWorkflow(
                    workflowId,
                    nodes,
                    connections
                );

                if (error) {
                    setSimulationLogs(logs || []);
                    addToast(`Execution failed: ${error}`, "error");
                } else {
                    setSimulationLogs(logs || []);
                    addToast("Execution completed successfully", "success");
                }
            } catch (err) {
                addToast("Execution error", "error");
            } finally {
                setIsSimulating(false);
            }
        } else {
            // Stop simulation
            setIsSimulating(false);
            addToast("Execution stopped", "info");
        }
    }, [isSimulating, currentWorkflowId, nodes, connections, setCurrentWorkflowId, addToast]);

    const handleToggleActivation = useCallback(async () => {
        if (isActivating) return;

        setIsActivating(true);
        try {
            // Save workflow first if not saved
            let workflowId = currentWorkflowId;
            if (!workflowId) {
                const { workflow, error } = await workflowService.createWorkflow(
                    `Workflow ${new Date().toLocaleString()}`,
                    nodes,
                    connections
                );
                if (error || !workflow) {
                    addToast(`Failed to save workflow: ${error || 'Unknown error'}`, "error");
                    setIsActivating(false);
                    return;
                }
                workflowId = workflow.id;
                setCurrentWorkflowId(workflowId);
            } else {
                // Update existing workflow
                await workflowService.updateWorkflow(workflowId, { nodes, connections });
            }

            // Toggle activation
            if (isActive) {
                await backendApi.deactivateWorkflow(workflowId);
                setIsActive(false);
                addToast("Workflow deactivated", "success");
            } else {
                await backendApi.activateWorkflow(workflowId);
                setIsActive(true);
                addToast("Workflow activated! Running in background", "success");
            }
        } catch (error) {
            addToast(`Activation failed: ${(error as Error).message}`, "error");
        } finally {
            setIsActivating(false);
        }
    }, [isActivating, currentWorkflowId, nodes, connections, isActive, setCurrentWorkflowId, addToast]);

    const handleStartTestMode = useCallback(async (config: { interval: string; duration: string; maxExecutions?: number }) => {
        try {
            // Save workflow first if not saved
            let workflowId = currentWorkflowId;
            if (!workflowId) {
                const { workflow, error } = await workflowService.createWorkflow(
                    `Workflow ${new Date().toLocaleString()}`,
                    nodes,
                    connections
                );
                if (error || !workflow) {
                    addToast(`Failed to save workflow: ${error || 'Unknown error'}`, "error");
                    return;
                }
                workflowId = workflow.id;
                setCurrentWorkflowId(workflowId);
            } else {
                // Update existing workflow
                await workflowService.updateWorkflow(workflowId, { nodes, connections });
            }

            // Start test mode
            await backendApi.startTestMode(workflowId, config);
            addToast(`Test mode started: ${config.interval} for ${config.duration}`, "success");
        } catch (error) {
            addToast(`Test mode failed: ${(error as Error).message}`, "error");
            throw error;
        }
    }, [currentWorkflowId, nodes, connections, setCurrentWorkflowId, addToast]);

    return {
        isSimulating,
        activeSimulationNode,
        simulationLogs,
        isActive,
        isActivating,
        handleSimulate,
        handleToggleActivation,
        handleStartTestMode
    };
}
