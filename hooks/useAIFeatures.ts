import React, { useState, useCallback } from 'react';
import { NodeInstance, Connection, LanguageCode, NodeType } from '../types';
import { analyzeWorkflow, generateSmartConfig, generateWorkflowFromPrompt } from '../services/aiService';
import { NODE_CATALOG } from '../constants';
import { generateId } from '../utils/helpers';

interface UseAIFeaturesProps {
    nodes: NodeInstance[];
    connections: Connection[];
    lang: LanguageCode;
    nodeNames: Record<string, string>;
    setNodes: React.Dispatch<React.SetStateAction<NodeInstance[]>>;
    setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
    t: (key: string) => string;
}

export function useAIFeatures({
    nodes,
    connections,
    lang,
    nodeNames,
    setNodes,
    setConnections,
    addToast,
    t
}: UseAIFeaturesProps) {
    const [analysis, setAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [configPrompt, setConfigPrompt] = useState('');
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [mainPrompt, setMainPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAnalyze = useCallback(async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeWorkflow(nodes, connections);
            setAnalysis(result);
            addToast(t('auditComplete'), 'success');
        } catch (error) {
            setAnalysis("Could not complete analysis. Check API key.");
            addToast('Analysis failed', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    }, [nodes, connections, addToast, t]);

    const handleSmartConfig = useCallback(async (node: NodeInstance) => {
        if (!configPrompt) return;
        setIsConfiguring(true);
        try {
            const config = await generateSmartConfig(node, configPrompt);
            setNodes(prev => prev.map(n => n.id === node.id ? { ...n, config: { ...n.config, ...config } } : n));
            setConfigPrompt('');
            addToast(t('configApplied'), 'success');
        } catch (error) {
            addToast('Smart config failed', 'error');
        } finally {
            setIsConfiguring(false);
        }
    }, [configPrompt, setNodes, addToast, t]);

    const handleGenWorkflow = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mainPrompt) return;
        setIsProcessing(true);
        try {
            const flow = await generateWorkflowFromPrompt(mainPrompt, lang);
            if (flow && flow.nodes) {
                // Map generated nodes to our internal structure with IDs and positions
                const idMap: Record<number, string> = {};
                const newNodes: NodeInstance[] = flow.nodes.map((n: any, i: number) => {
                    const newId = generateId();
                    idMap[i] = newId;

                    const template = NODE_CATALOG.find(cat => cat.type === n.type);

                    if (!template) {
                        console.warn(`Node type "${n.type}" not found in catalog`);
                        return null;
                    }

                    return {
                        id: newId,
                        type: n.type,
                        name: nodeNames[n.type] || template.name,
                        n8nType: template.n8nType,
                        n8nVersion: template.n8nVersion,
                        position: { x: 100 + (i * 280), y: 150 + (i % 2 * 120) },
                        icon: template.icon,
                        bg: template.bg,
                        color: template.color,
                        category: template.category,
                        border: template.border,
                        fields: template.fields,
                        desc: template.desc,
                        config: n.config || {},
                        customParams: {}
                    } as NodeInstance;
                }).filter(Boolean) as NodeInstance[];

                // Create connections if provided by AI
                const newConnections: Connection[] = [];
                if (flow.connections && Array.isArray(flow.connections)) {
                    flow.connections.forEach((conn: any) => {
                        const sourceId = idMap[conn.source];
                        const targetId = idMap[conn.target];

                        if (sourceId && targetId) {
                            newConnections.push({
                                id: generateId(),
                                source: sourceId,
                                target: targetId,
                                sourceHandle: conn.sourceHandle || 'main',
                                targetHandle: conn.targetHandle || 'input'
                            });
                        }
                    });
                }

                setNodes(curr => [...curr, ...newNodes]);
                setConnections(curr => [...curr, ...newConnections]);

                addToast(t('generatedNodes'), 'success');
                setMainPrompt('');
            }
        } catch (err) {
            console.error('Workflow generation error:', err);
            addToast('Generation failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [mainPrompt, lang, nodeNames, setNodes, setConnections, addToast, t]);

    return {
        analysis,
        setAnalysis,
        isAnalyzing,
        configPrompt,
        setConfigPrompt,
        isConfiguring,
        mainPrompt,
        setMainPrompt,
        isProcessing,
        handleAnalyze,
        handleSmartConfig,
        handleGenWorkflow
    };
}
