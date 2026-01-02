import { supabase } from '../lib/supabase';
import type { Execution } from '../lib/supabase';
import type { NodeInstance, Connection, NodeType } from '../types';

interface ExecutionLog {
    timestamp: number;
    nodeId: string;
    nodeName: string;
    type: 'info' | 'success' | 'error';
    message: string;
    data?: any;
}

class ExecutionEngine {
    private logs: ExecutionLog[] = [];
    private currentExecutionId: string | null = null;

    /**
     * Execute a workflow
     */
    async executeWorkflow(
        workflowId: string,
        nodes: NodeInstance[],
        connections: Connection[]
    ): Promise<{ executionId: string | null; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { executionId: null, error: 'Not authenticated' };

            // Create execution record
            const { data: execution, error: execError } = await supabase
                .from('executions')
                .insert({
                    workflow_id: workflowId,
                    user_id: user.id,
                    status: 'running'
                })
                .select()
                .single();

            if (execError || !execution) {
                return { executionId: null, error: execError?.message || 'Failed to create execution' };
            }

            this.currentExecutionId = execution.id;
            this.logs = [];

            // Execute nodes in order
            try {
                await this.executeNodes(nodes, connections);

                // Update execution as success
                await supabase
                    .from('executions')
                    .update({
                        status: 'success',
                        finished_at: new Date().toISOString(),
                        logs: this.logs
                    })
                    .eq('id', execution.id);

                return { executionId: execution.id, error: null };
            } catch (err) {
                // Update execution as error
                await supabase
                    .from('executions')
                    .update({
                        status: 'error',
                        finished_at: new Date().toISOString(),
                        error_message: (err as Error).message,
                        logs: this.logs
                    })
                    .eq('id', execution.id);

                return { executionId: execution.id, error: (err as Error).message };
            }
        } catch (err) {
            return { executionId: null, error: (err as Error).message };
        }
    }

    /**
     * Execute nodes in topological order
     */
    private async executeNodes(nodes: NodeInstance[], connections: Connection[]): Promise<void> {
        // Find trigger nodes (nodes with no incoming connections)
        const triggerNodes = nodes.filter(node =>
            !connections.some(conn => conn.target === node.id)
        );

        if (triggerNodes.length === 0) {
            throw new Error('No trigger node found');
        }

        // Execute from each trigger node
        for (const triggerNode of triggerNodes) {
            await this.executeNode(triggerNode, nodes, connections, {});
        }
    }

    /**
     * Execute a single node and its downstream nodes
     */
    private async executeNode(
        node: NodeInstance,
        allNodes: NodeInstance[],
        connections: Connection[],
        context: Record<string, any>
    ): Promise<any> {
        this.addLog(node.id, node.name, 'info', `Executing ${node.type} node`);

        try {
            // Execute node based on type
            const result = await this.executeNodeByType(node, context);

            this.addLog(node.id, node.name, 'success', `Completed successfully`, result);

            // Find and execute downstream nodes
            const downstreamConnections = connections.filter(conn => conn.source === node.id);

            for (const conn of downstreamConnections) {
                const nextNode = allNodes.find(n => n.id === conn.target);
                if (nextNode) {
                    await this.executeNode(nextNode, allNodes, connections, { ...context, ...result });
                }
            }

            return result;
        } catch (err) {
            this.addLog(node.id, node.name, 'error', (err as Error).message);
            throw err;
        }
    }

    /**
     * Execute node based on its type
     */
    private async executeNodeByType(node: NodeInstance, context: Record<string, any>): Promise<any> {
        switch (node.type) {
            case 'http':
                return await this.executeHttpNode(node);

            case 'gemini':
            case 'openai':
                return await this.executeAINode(node, context);

            case 'if':
                return await this.executeIfNode(node, context);

            case 'set':
                return this.executeSetNode(node);

            case 'webhook':
            case 'cron':
            case 'mail_trigger':
            case 'form_trigger':
                // Trigger nodes just pass through
                return { triggered: true, timestamp: Date.now() };

            default:
                // For unimplemented nodes, just log and continue
                return { executed: true, nodeType: node.type };
        }
    }

    /**
     * Execute HTTP request node
     */
    private async executeHttpNode(node: NodeInstance): Promise<any> {
        const { url, method = 'GET' } = node.config;

        if (!url) throw new Error('HTTP node missing URL');

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { statusCode: response.status, data };
    }

    /**
     * Execute AI node (Gemini/OpenAI)
     */
    private async executeAINode(node: NodeInstance, context: Record<string, any>): Promise<any> {
        const { prompt } = node.config;

        if (!prompt) throw new Error('AI node missing prompt');

        // Replace variables in prompt
        const processedPrompt = this.replaceVariables(prompt, context);

        // Use the existing AI service
        const { generateWorkflowFromPrompt } = await import('./aiService');

        // For now, just return a mock response
        // In production, you'd call the actual AI API
        return {
            prompt: processedPrompt,
            response: 'AI response placeholder',
            model: node.type
        };
    }

    /**
     * Execute IF condition node
     */
    private async executeIfNode(node: NodeInstance, context: Record<string, any>): Promise<any> {
        const { conditions } = node.config;

        if (!conditions) throw new Error('IF node missing conditions');

        // Simple condition evaluation (you'd want a proper expression parser in production)
        const result = eval(this.replaceVariables(conditions, context));

        return { conditionMet: !!result };
    }

    /**
     * Execute SET node
     */
    private executeSetNode(node: NodeInstance): any {
        const { values } = node.config;

        if (!values) throw new Error('SET node missing values');

        try {
            return typeof values === 'string' ? JSON.parse(values) : values;
        } catch (err) {
            throw new Error('Invalid JSON in SET node');
        }
    }

    /**
     * Replace variables in string with context values
     */
    private replaceVariables(str: string, context: Record<string, any>): string {
        return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const value = context[key.trim()];
            return value !== undefined ? String(value) : match;
        });
    }

    /**
     * Add log entry
     */
    private addLog(nodeId: string, nodeName: string, type: ExecutionLog['type'], message: string, data?: any) {
        this.logs.push({
            timestamp: Date.now(),
            nodeId,
            nodeName,
            type,
            message,
            data
        });

        // Update execution logs in real-time
        if (this.currentExecutionId) {
            supabase
                .from('executions')
                .update({ logs: this.logs })
                .eq('id', this.currentExecutionId)
                .then();
        }
    }

    /**
     * Get execution history
     */
    async getExecutions(workflowId?: string): Promise<{ executions: Execution[]; error: string | null }> {
        try {
            let query = supabase
                .from('executions')
                .select('*')
                .order('started_at', { ascending: false });

            if (workflowId) {
                query = query.eq('workflow_id', workflowId);
            }

            const { data, error } = await query;

            if (error) return { executions: [], error: error.message };
            return { executions: data || [], error: null };
        } catch (err) {
            return { executions: [], error: (err as Error).message };
        }
    }

    /**
     * Get execution details
     */
    async getExecution(id: string): Promise<{ execution: Execution | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('executions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) return { execution: null, error: error.message };
            return { execution: data, error: null };
        } catch (err) {
            return { execution: null, error: (err as Error).message };
        }
    }
}

export const executionEngine = new ExecutionEngine();
