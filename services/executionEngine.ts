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
    ): Promise<{ executionId: string | null; logs: ExecutionLog[]; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { executionId: null, logs: [], error: 'Not authenticated' };

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
                return { executionId: null, logs: [], error: execError?.message || 'Failed to create execution' };
            }

            this.currentExecutionId = execution.id;
            this.logs = [];

            // Execute nodes in order
            try {
                // Execute node based on type
                // Pass all nodes and connections to allow complex flow control (like loops)
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

                return { executionId: execution.id, logs: this.logs, error: null };
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

                return { executionId: execution.id, logs: this.logs, error: (err as Error).message };
            }
        } catch (err) {
            return { executionId: null, logs: [], error: (err as Error).message };
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
            // Pass all nodes and connections to allow complex flow control (like loops)
            const result = await this.executeNodeByType(node, context, allNodes, connections);

            this.addLog(node.id, node.name, 'success', `Completed successfully`, result);

            // If the node handled downstream execution manually (e.g., Loop), skip default behavior
            if (result && result.manualDownstreamExecution) {
                return result;
            }

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
    private async executeNodeByType(
        node: NodeInstance,
        context: Record<string, any>,
        allNodes: NodeInstance[] = [],
        connections: Connection[] = []
    ): Promise<any> {
        switch (node.type) {
            case 'http':
                return await this.executeHttpNode(node);

            case 'telegram':
                return await this.executeTelegramNode(node, context);

            case 'code':
                return await this.executeCodeNode(node, context);

            case 'splitInBatches':
                return await this.executeSplitInBatchesNode(node, context, allNodes, connections);

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
     * Execute Telegram Bot message
     */
    private async executeTelegramNode(node: NodeInstance, context: Record<string, any>): Promise<any> {
        const { botToken, chatId, text } = node.config;

        if (!botToken) throw new Error('Telegram node missing Bot Token');
        if (!chatId) throw new Error('Telegram node missing Chat ID');
        if (!text) throw new Error('Telegram node missing Text');

        // Replace variables
        const messageText = this.replaceVariables(text, context);
        const processedChatId = this.replaceVariables(chatId, context);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: processedChatId,
                text: messageText,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Telegram API Error: ${data.description || response.statusText}`);
        }

        return data;
    }

    /**
     * Execute HTTP request node
     */
    private async executeHttpNode(node: NodeInstance): Promise<any> {
        const { url, method = 'GET', useProxy = true } = node.config;

        if (!url) throw new Error('HTTP node missing URL');

        try {
            let fetchUrl = url;

            // Use proxy by default to avoid CORS issues
            if (useProxy) {
                fetchUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
            }

            const response = await fetch(fetchUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return {
                status: response.status,      // Alias for easier use in conditions
                statusCode: response.status,  // Standard n8n format
                data
            };
        } catch (error) {
            const msg = (error as Error).message;

            // Provide helpful error messages
            if (msg.includes('Failed to fetch') || msg.includes('CORS')) {
                throw new Error(
                    `❌ CORS Error: Cannot access ${url}\n\n` +
                    `💡 Solution: The proxy is enabled by default. If you're still seeing this error:\n` +
                    `   1. Make sure your dev server is running (npm run dev)\n` +
                    `   2. Try a CORS-friendly API like: https://jsonplaceholder.typicode.com/posts\n` +
                    `   3. Some sites (like google.com) may block automated requests`
                );
            }

            throw error;
        }
    }

    /**
     * Execute Custom JavaScript Code Node
     */
    private async executeCodeNode(node: NodeInstance, context: Record<string, any>): Promise<any> {
        const { jsCode } = node.config;

        if (!jsCode) return { executed: true, message: 'No code provided' };

        try {
            // Prepare the "Sandbox" environment
            // In n8n, input data is usually available as 'items' or '$input.all()'
            // We'll mimic a simple version where previous node results are in 'items'
            const items = Object.values(context).length > 0 ? [context] : [];

            // Create a function from the string
            // We wrap it in an async function to allow 'await' usage if needed (though new Function is sync unless AsyncFunction is used)
            // For safety/simplicity, we'll stick to sync for now or standard Function
            const sandbox = new Function('items', 'context', 'console', `
                try {
                    ${jsCode}
                } catch(e) {
                    throw new Error(e.message);
                }
            `);

            // Execute the code
            // We capture console.log to show in our logs
            const logs: string[] = [];
            const mockConsole = {
                log: (...args: any[]) => logs.push(args.map(a => JSON.stringify(a)).join(' ')),
                error: (...args: any[]) => logs.push('ERROR: ' + args.map(a => JSON.stringify(a)).join(' '))
            };

            const result = sandbox(items, context, mockConsole);

            // If user logged something, add it to engine logs
            if (logs.length > 0) {
                this.addLog(node.id, node.name, 'info', `Console Output:\n${logs.join('\n')}`);
            }

            return result || { executed: true };

        } catch (err) {
            throw new Error(`Code Execution Error: ${(err as Error).message}`);
        }
    }

    /**
     * Execute SplitInBatches (Loop) Node
     */
    private async executeSplitInBatchesNode(
        node: NodeInstance,
        context: Record<string, any>,
        allNodes: NodeInstance[],
        connections: Connection[]
    ): Promise<any> {
        const batchSize = Number(node.config.batchSize) || 1;

        // Get items from context (logic similar to n8n)
        // If 'items' array exists, use it. Otherwise, assume context itself is one item.
        let items: any[] = [];
        if (Array.isArray(context.items)) {
            items = context.items;
        } else if (Object.keys(context).length > 0) {
            items = [context];
        }

        if (items.length === 0) {
            return { executed: true, message: 'No items to process' };
        }

        this.addLog(node.id, node.name, 'info', `Starting Loop: Processing ${items.length} items in batches of ${batchSize}`);

        // Find downstream nodes (The Loop Body)
        const downstreamConnections = connections.filter(conn => conn.source === node.id);

        // Iterate batches
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchIndex = Math.floor(i / batchSize) + 1;
            const contextForBatch = {
                ...context,
                items: batch, // Current batch becomes the input for next nodes
                loop: {
                    index: batchIndex,
                    total: Math.ceil(items.length / batchSize),
                    batchSize: batchSize
                }
            };

            this.addLog(node.id, node.name, 'info', `Processing Batch ${batchIndex}/${Math.ceil(items.length / batchSize)}`);

            // Execute downstream nodes for this batch
            for (const conn of downstreamConnections) {
                const nextNode = allNodes.find(n => n.id === conn.target);
                if (nextNode) {
                    await this.executeNode(nextNode, allNodes, connections, contextForBatch);
                }
            }
        }

        this.addLog(node.id, node.name, 'success', `Loop Completed`);

        // Return special flag to tell engine NOT to continue downstream (since we handled it)
        return { manualDownstreamExecution: true };
    }

    /**
     * Custom sandbox console execution
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
     * Uses expr-eval for safe expression evaluation (no arbitrary code execution)
     */
    private async executeIfNode(node: NodeInstance, context: Record<string, any>): Promise<any> {
        const { conditions } = node.config;

        if (!conditions) throw new Error('IF node missing conditions');

        try {
            // Import Parser dynamically to avoid issues
            const { Parser } = await import('expr-eval');
            const parser = new Parser();

            // Replace variables in condition string
            const processedCondition = this.replaceVariables(conditions, context);

            // Parse and evaluate safely
            const expr = parser.parse(processedCondition);
            const result = expr.evaluate(context);

            return { conditionMet: !!result };
        } catch (error) {
            throw new Error(`Invalid IF condition: ${(error as Error).message}. Condition: "${conditions}"`);
        }
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
            const trimmedKey = key.trim();
            const value = context[trimmedKey];

            // If variable not found, replace with 'undefined' to avoid parser errors
            if (value === undefined) {
                console.warn(`Variable "${trimmedKey}" not found in context. Available: ${Object.keys(context).join(', ')}`);
                return 'undefined';
            }

            return String(value);
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
