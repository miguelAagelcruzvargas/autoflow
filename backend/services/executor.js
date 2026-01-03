const { decrypt } = require('../utils/crypto');

class ExecutionEngine {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    // Helper to recursively decrypt node config
    decryptWorkflowNodes(nodes) {
        if (!Array.isArray(nodes)) return nodes;
        return nodes.map(node => {
            if (node.config) {
                const newConfig = { ...node.config };
                Object.keys(newConfig).forEach(key => {
                    const value = newConfig[key];
                    if (typeof value === 'string' && value.startsWith('enc_')) {
                        newConfig[key] = decrypt(value);
                    }
                });
                return { ...node, config: newConfig };
            }
            return node;
        });
    }

    async executeWorkflow(originalWorkflow, initialContext = {}) {
        const startTime = Date.now();
        const executionId = this.generateId();

        try {
            console.log(`[Executor] Starting workflow: ${originalWorkflow.name} (${originalWorkflow.id})`);

            // DECRYPT CREDENTIALS
            // We clone the workflow to avoid mutating the original reference in memory if it's cached
            const workflow = {
                ...originalWorkflow,
                nodes: this.decryptWorkflowNodes(originalWorkflow.nodes)
            };

            // Create execution log
            await this.createExecutionLog(executionId, workflow.id, 'running');

            const { nodes, connections } = workflow;
            const logs = [];

            // Find start node (usually Cron or Webhook)
            // If we have initial context indicating a webhook, try to find that specific webhook
            let startNode;

            // @ts-ignore
            if (initialContext && initialContext.headers) {
                startNode = nodes.find(n => n.type === 'webhook'); // Start at webhook if present
            }

            if (!startNode) {
                startNode = nodes.find(n => n.type === 'cron' || n.type === 'webhook' || n.type === 'manual');
            }

            if (!startNode) {
                throw new Error('No start node found in workflow');
            }

            // Execute workflow
            const context = { ...initialContext };
            await this.executeNode(startNode, nodes, connections, context, logs);

            const duration = Date.now() - startTime;

            // Update execution log
            await this.updateExecutionLog(executionId, {
                status: 'success',
                completed_at: new Date().toISOString(),
                duration_ms: duration,
                logs: logs
            });

            console.log(`[Executor] Workflow completed successfully in ${duration}ms`);

            return { success: true, executionId, duration, logs };

        } catch (error) {
            const duration = Date.now() - startTime;

            console.error(`[Executor] Workflow failed:`, error);

            // Update execution log with error
            await this.updateExecutionLog(executionId, {
                status: 'error',
                completed_at: new Date().toISOString(),
                duration_ms: duration,
                error: error.message
            });

            return { success: false, executionId, duration, error: error.message };
        }
    }

    async executeNode(node, allNodes, connections, context, logs) {
        console.log(`[Executor] Executing node: ${node.name} (${node.type})`);

        const nodeLog = {
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            timestamp: new Date().toISOString(),
            status: 'running'
        };

        try {
            let result = {};

            // Execute based on node type
            switch (node.type) {
                case 'cron':
                    result = await this.executeCronNode(node, context);
                    break;
                case 'http':
                    result = await this.executeHttpNode(node, context);
                    break;
                case 'if':
                    result = await this.executeIfNode(node, context, allNodes, connections, logs);
                    return; // IF node handles its own downstream execution
                case 'telegram':
                    result = await this.executeTelegramNode(node, context);
                    break;
                case 'gmail':
                    result = await this.executeGmailNode(node, context);
                    break;
                default:
                    console.warn(`[Executor] Unknown node type: ${node.type}`);
                    result = { message: `Node type ${node.type} not implemented` };
            }

            nodeLog.status = 'success';
            nodeLog.data = result;
            logs.push(nodeLog);

            // Find and execute downstream nodes
            const downstreamConnections = connections.filter(c => c.source === node.id);

            for (const conn of downstreamConnections) {
                const nextNode = allNodes.find(n => n.id === conn.target);
                if (nextNode) {
                    await this.executeNode(nextNode, allNodes, connections, { ...context, ...result }, logs);
                }
            }

        } catch (error) {
            nodeLog.status = 'error';
            nodeLog.error = error.message;
            logs.push(nodeLog);
            throw error;
        }
    }

    async executeCronNode(node, context) {
        // Cron node just triggers the workflow
        return { triggered: true, timestamp: new Date().toISOString() };
    }

    async executeHttpNode(node, context) {
        const { url, method = 'GET', headers = {}, body } = node.config;

        const processedUrl = this.replaceVariables(url, context);
        const processedHeaders = this.replaceVariables(JSON.stringify(headers), context);
        const processedBody = body ? this.replaceVariables(body, context) : undefined;

        console.log(`[HTTP] ${method} ${processedUrl}`);

        const response = await fetch(processedUrl, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...JSON.parse(processedHeaders)
            },
            body: processedBody ? JSON.stringify(JSON.parse(processedBody)) : undefined
        });

        const data = await response.json().catch(() => ({}));

        return {
            status: response.status,
            statusCode: response.status,
            data
        };
    }

    async executeIfNode(node, context, allNodes, connections, logs) {
        const { conditions } = node.config;

        if (!conditions) {
            throw new Error('IF node missing conditions');
        }

        const processedCondition = this.replaceVariables(conditions, context);
        console.log(`[IF] Evaluating: ${processedCondition}`);

        const parser = new Parser();
        const expr = parser.parse(processedCondition);
        const result = expr.evaluate(context);

        console.log(`[IF] Result: ${result}`);

        logs.push({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            timestamp: new Date().toISOString(),
            status: 'success',
            data: { condition: processedCondition, result }
        });

        // Find true/false branches
        const trueConnections = connections.filter(c => c.source === node.id && c.sourceHandle === 'true');
        const falseConnections = connections.filter(c => c.source === node.id && c.sourceHandle === 'false');

        const targetConnections = result ? trueConnections : falseConnections;

        for (const conn of targetConnections) {
            const nextNode = allNodes.find(n => n.id === conn.target);
            if (nextNode) {
                await this.executeNode(nextNode, allNodes, connections, context, logs);
            }
        }
    }

    async executeTelegramNode(node, context) {
        const { botToken, chatId, text } = node.config;

        if (!botToken || !chatId || !text) {
            throw new Error('Telegram node missing required config');
        }

        const processedChatId = this.replaceVariables(chatId, context);
        const processedText = this.replaceVariables(text, context);

        console.log(`[Telegram] Sending to chat ${processedChatId}`);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: processedChatId,
                text: processedText,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
        }

        return { sent: true, messageId: data.result?.message_id };
    }

    async executeGmailNode(node, context) {
        // Gmail implementation would go here
        console.log('[Gmail] Node not fully implemented yet');
        return { sent: false, message: 'Gmail node not implemented' };
    }

    replaceVariables(str, context) {
        if (!str) return str;

        return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            const value = context[trimmedKey];

            if (value === undefined) {
                console.warn(`Variable "${trimmedKey}" not found in context. Available: ${Object.keys(context).join(', ')}`);
                return 'undefined';
            }

            return String(value);
        });
    }

    async createExecutionLog(executionId, workflowId, status) {
        try {
            await this.supabase
                .from('workflow_executions')
                .insert({
                    id: executionId,
                    workflow_id: workflowId,
                    status,
                    started_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('[Executor] Failed to create execution log:', error);
        }
    }

    async updateExecutionLog(executionId, updates) {
        try {
            await this.supabase
                .from('workflow_executions')
                .update(updates)
                .eq('id', executionId);
        } catch (error) {
            console.error('[Executor] Failed to update execution log:', error);
        }
    }

    generateId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

module.exports = ExecutionEngine;
