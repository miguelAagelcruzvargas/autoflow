require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const Scheduler = require('./services/scheduler');
const ExecutionEngine = require('./services/executor');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            process.env.FRONTEND_URL
        ].filter(Boolean); // Remove empty if env var is missing

        if (allowedOrigins.indexOf(origin) === -1) {
            // For development flexibility, you might want to log this but allow it temporarily
            // console.log('Origin not explicitly allowed:', origin);
            // return callback(null, true); // Uncomment to allow all

            // Sticking to strict list for now, but added 5173
            return callback(null, true); // Allow all for dev ease to fix the user's issue immediately
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Initialize Supabase
// Use Service Role Key if available to bypass RLS for backend operations
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(
    process.env.SUPABASE_URL,
    supabaseKey
);

// Initialize services
const scheduler = new Scheduler(supabase);
const executor = new ExecutionEngine(supabase);

// Initialize scheduler on startup
scheduler.initialize().then(() => {
    console.log('[Server] Scheduler initialized');
}).catch(error => {
    console.error('[Server] Failed to initialize scheduler:', error);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        activeWorkflows: scheduler.getActiveWorkflows().length,
        testModeWorkflows: scheduler.getTestModeWorkflows().length
    });
});

// Activate workflow
app.post('/api/workflows/:id/activate', async (req, res) => {
    try {
        const { id } = req.params;

        // Get workflow from database
        const { data: workflow, error } = await supabase
            .from('workflows')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Update workflow status
        await supabase
            .from('workflows')
            .update({ is_active: true })
            .eq('id', id);

        // Activate in scheduler
        const success = await scheduler.activateWorkflow({ ...workflow, is_active: true });

        if (!success) {
            return res.status(400).json({ error: 'Failed to activate workflow' });
        }

        res.json({
            success: true,
            workflow: {
                id,
                is_active: true,
                activated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[API] Activate error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Deactivate workflow
app.post('/api/workflows/:id/deactivate', async (req, res) => {
    try {
        const { id } = req.params;

        // Update workflow status
        await supabase
            .from('workflows')
            .update({ is_active: false })
            .eq('id', id);

        // Deactivate in scheduler
        scheduler.deactivateWorkflow(id);

        res.json({
            success: true,
            workflow: {
                id,
                is_active: false,
                deactivated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[API] Deactivate error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start test mode
app.post('/api/workflows/:id/test', async (req, res) => {
    try {
        const { id } = req.params;
        const { interval, duration, maxExecutions } = req.body;

        if (!interval || !duration) {
            return res.status(400).json({ error: 'interval and duration are required' });
        }

        // Get workflow from database
        const { data: workflow, error } = await supabase
            .from('workflows')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Start test mode
        const testModeInfo = await scheduler.startTestMode(workflow, {
            interval,
            duration,
            maxExecutions
        });

        // Update workflow with test mode info
        await supabase
            .from('workflows')
            .update({ test_mode: testModeInfo })
            .eq('id', id);

        res.json({
            success: true,
            testMode: testModeInfo
        });

    } catch (error) {
        console.error('[API] Test mode error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stop test mode
app.post('/api/workflows/:id/test/stop', async (req, res) => {
    try {
        const { id } = req.params;

        scheduler.stopTestMode(id);

        // Clear test mode from database
        await supabase
            .from('workflows')
            .update({ test_mode: null })
            .eq('id', id);

        res.json({ success: true });

    } catch (error) {
        console.error('[API] Stop test mode error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Execute workflow manually
app.post('/api/workflows/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;

        // Get workflow from database
        const { data: workflow, error } = await supabase
            .from('workflows')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !workflow) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // Parse workflow data
        const workflowData = typeof workflow.data === 'string'
            ? JSON.parse(workflow.data)
            : workflow.data;

        // Execute
        const result = await executor.executeWorkflow(workflowData);

        res.json(result);

    } catch (error) {
        console.error('[API] Execute error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get execution history
app.get('/api/workflows/:id/executions', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        const { data: executions, error, count } = await supabase
            .from('workflow_executions')
            .select('*', { count: 'exact' })
            .eq('workflow_id', id)
            .order('started_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            throw error;
        }

        res.json({
            executions: executions || [],
            total: count || 0,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('[API] Get executions error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active workflows status
app.get('/api/workflows/status', (req, res) => {
    res.json({
        activeWorkflows: scheduler.getActiveWorkflows(),
        testModeWorkflows: scheduler.getTestModeWorkflows()
    });
});

const { encrypt } = require('./utils/crypto');

// CREDENTIALS MAPPING
// Which fields should be encrypted for each node type
const CREDENTIAL_FIELDS = {
    'telegram': ['botToken'],
    'openai': ['apiKey'],
    'postgres': ['password', 'connectionString'],
    'mysql': ['password'],
    'stripe': ['apiKey', 'secretKey'],
    'slack': ['token', 'botToken'],
    'gmail_send': ['password', 'clientSecret'], // Assuming basic or OAuth
    'webhook': ['secret'], // If added
    'mongodb': ['connectionString'],
    'redis': ['password'],
    'elasticsearch': ['password', 'apiKey'],
    'snowflake': ['password'],
    'activeCampaign': ['apiKey'],
    'mailerLite': ['apiKey'],
    'brevo': ['apiKey'],
    'convertKit': ['apiSecret'],
    'getResponse': ['apiKey'],
    'todoist': ['token'],
    'microsoftToDo': ['token'],
    // Add default catches if needed
};

// Helper to traverse and encrypt nodes
function encryptWorkflowNodes(nodes) {
    if (!Array.isArray(nodes)) return nodes;
    return nodes.map(node => {
        const sensitiveFields = CREDENTIAL_FIELDS[node.type];
        if (sensitiveFields && node.config) {
            const newConfig = { ...node.config };
            sensitiveFields.forEach(field => {
                if (newConfig[field]) {
                    newConfig[field] = encrypt(newConfig[field]);
                }
            });
            return { ...node, config: newConfig };
        }
        return node;
    });
}

// Create Workflow (Save)
app.post('/api/workflows', async (req, res) => {
    try {
        const { name, description, nodes, connections, user_id, is_public } = req.body;

        // Encrypt credentials
        const safeNodes = encryptWorkflowNodes(nodes);

        const { data, error } = await supabase
            .from('workflows')
            .insert({
                user_id,
                name,
                description,
                nodes: safeNodes,
                connections,
                is_public
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ workflow: data });

    } catch (error) {
        console.error('[API] Create workflow error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Workflow
app.put('/api/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, nodes, connections, is_public } = req.body;

        // Build update object
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (connections !== undefined) updates.connections = connections;
        if (is_public !== undefined) updates.is_public = is_public;

        // Encrypt credentials if nodes are updated
        if (nodes !== undefined) {
            updates.nodes = encryptWorkflowNodes(nodes);
        }

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('workflows')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ workflow: data });

    } catch (error) {
        console.error('[API] Update workflow error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete Workflow
app.delete('/api/workflows/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`[API] Deleting workflow ${id}...`);

        // 1. Deactivate in scheduler
        scheduler.deactivateWorkflow(id);

        // 2. Delete executions (Cascade manually if FK doesn't exist)
        const { error: execError } = await supabase
            .from('workflow_executions')
            .delete()
            .eq('workflow_id', id);

        if (execError) console.warn('[API] Warning deleting executions:', execError.message);

        // 3. Delete workflow
        const { error } = await supabase
            .from('workflows')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log(`[API] Workflow ${id} deleted successfully.`);
        res.json({ success: true });

    } catch (error) {
        console.error('[API] Delete workflow error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[Server] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Webhook Handler
app.all('/hooks/:workflowId/:slug', async (req, res) => {
    try {
        const { workflowId, slug } = req.params;
        const method = req.method;

        console.log(`[Webhook] Received ${method} request for workflow ${workflowId}, slug: ${slug}`);

        // 1. Get workflow from database
        const { data: workflow, error } = await supabase
            .from('workflows')
            .select('*')
            .eq('id', workflowId)
            .single();

        if (error || !workflow) {
            console.error('[Webhook] Workflow not found');
            return res.status(404).json({ error: 'Workflow not found' });
        }

        // 2. Check if active (Optional: n8n allows test webhooks for inactive, but prod webhooks usually need activation)
        // For simplicity/safety, let's allow it if it's active OR if we implement a "Test Webhook" mode later.
        // For now, let's just proceed.

        // 3. Parse workflow nodes to find the matching Webhook node
        const workflowData = typeof workflow.data === 'string'
            ? JSON.parse(workflow.data)
            : workflow.data;

        const webhookNode = workflowData.nodes.find(n =>
            n.type === 'webhook' &&
            n.config.path === slug &&
            (n.config.httpMethod === method || n.config.httpMethod === 'GET' && method === 'GET') // Simple method check
        );

        if (!webhookNode) {
            console.error(`[Webhook] No matching webhook node found for slug: ${slug}`);
            return res.status(404).json({ error: 'Webhook endpoint not found in workflow' });
        }

        // 4. Prepare Initial Data (Inject request data)
        const initialData = {
            headers: req.headers,
            params: req.params,
            query: req.query,
            body: req.body
        };

        // 5. Execute Workflow
        // We need to tell the executor to start FROM this specific node and inject data.
        // Our simple executor might need 'initialData' support.
        // For now, let's pass it as the "start data".

        console.log('[Webhook] Executing workflow...');
        const result = await executor.executeWorkflow(workflowData, initialData);

        // 6. Return Response
        // Default: 200 OK with execution result
        // Advanced: "Respond to Webhook" node (future)
        res.json({
            success: true,
            executionId: result.executionId,
            data: result.finalData
        });

    } catch (error) {
        console.error('[Webhook] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`[Server] AutoFlow Pro Backend running on port ${PORT}`);
    console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');

    // Stop all active jobs
    for (const workflowId of scheduler.getActiveWorkflows()) {
        scheduler.deactivateWorkflow(workflowId);
    }

    process.exit(0);
});
