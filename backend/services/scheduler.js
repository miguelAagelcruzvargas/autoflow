const cron = require('node-cron');
const ExecutionEngine = require('./executor');

class Scheduler {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.executor = new ExecutionEngine(supabaseClient);
        this.activeJobs = new Map(); // workflowId -> cron job
        this.testModeTimers = new Map(); // workflowId -> { timer, execCount, maxExec }
    }

    async initialize() {
        console.log('[Scheduler] Initializing...');

        // Load all active workflows from database
        const { data: workflows, error } = await this.supabase
            .from('workflows')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.error('[Scheduler] Failed to load active workflows:', error);
            return;
        }

        console.log(`[Scheduler] Found ${workflows?.length || 0} active workflows`);

        // Schedule each active workflow
        for (const workflow of workflows || []) {
            await this.activateWorkflow(workflow);
        }
    }

    async activateWorkflow(workflow) {
        try {
            console.log(`[Scheduler] Activating workflow: ${workflow.name} (${workflow.id})`);

            // Parse workflow data
            const workflowData = typeof workflow.data === 'string'
                ? JSON.parse(workflow.data)
                : workflow.data;

            const { nodes } = workflowData;

            // Find cron node
            const cronNode = nodes.find(n => n.type === 'cron');

            if (!cronNode) {
                console.warn(`[Scheduler] No cron node found in workflow ${workflow.id}`);
                return false;
            }

            const { schedule } = cronNode.config;

            if (!schedule) {
                console.warn(`[Scheduler] No schedule configured in cron node for workflow ${workflow.id}`);
                return false;
            }

            // Validate cron expression
            if (!cron.validate(schedule)) {
                console.error(`[Scheduler] Invalid cron expression: ${schedule}`);
                return false;
            }

            // Stop existing job if any
            this.deactivateWorkflow(workflow.id);

            // Create new cron job
            const job = cron.schedule(schedule, async () => {
                console.log(`[Scheduler] Triggering workflow: ${workflow.name}`);
                await this.executor.executeWorkflow(workflowData);
            });

            this.activeJobs.set(workflow.id, job);

            console.log(`[Scheduler] Workflow activated with schedule: ${schedule}`);
            return true;

        } catch (error) {
            console.error(`[Scheduler] Failed to activate workflow ${workflow.id}:`, error);
            return false;
        }
    }

    deactivateWorkflow(workflowId) {
        const job = this.activeJobs.get(workflowId);

        if (job) {
            job.stop();
            this.activeJobs.delete(workflowId);
            console.log(`[Scheduler] Deactivated workflow: ${workflowId}`);
        }

        // Also stop test mode if active
        this.stopTestMode(workflowId);
    }

    async startTestMode(workflow, config) {
        const { interval, duration, maxExecutions } = config;

        console.log(`[Scheduler] Starting test mode for ${workflow.name}: ${interval} for ${duration}`);

        // Parse workflow data
        const workflowData = typeof workflow.data === 'string'
            ? JSON.parse(workflow.data)
            : workflow.data;

        // Convert interval to cron expression
        const cronExpression = this.intervalToCron(interval);

        if (!cronExpression) {
            throw new Error(`Invalid interval: ${interval}`);
        }

        // Stop any existing test mode
        this.stopTestMode(workflow.id);

        let execCount = 0;

        // Create cron job for test mode
        const job = cron.schedule(cronExpression, async () => {
            execCount++;
            console.log(`[Test Mode] Execution ${execCount}/${maxExecutions || '∞'} for ${workflow.name}`);

            await this.executor.executeWorkflow(workflowData);

            // Check if max executions reached
            if (maxExecutions && execCount >= maxExecutions) {
                console.log(`[Test Mode] Max executions reached for ${workflow.name}`);
                this.stopTestMode(workflow.id);
            }
        });

        // Set timer to auto-stop after duration
        const durationMs = this.parseDuration(duration);
        const timer = setTimeout(() => {
            console.log(`[Test Mode] Duration ended for ${workflow.name}`);
            this.stopTestMode(workflow.id);
        }, durationMs);

        this.testModeTimers.set(workflow.id, {
            job,
            timer,
            execCount: 0,
            maxExecutions,
            startedAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + durationMs).toISOString()
        });

        console.log(`[Test Mode] Started for ${workflow.name} - will run until ${new Date(Date.now() + durationMs).toLocaleTimeString()}`);

        return {
            interval,
            duration,
            maxExecutions,
            startedAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + durationMs).toISOString()
        };
    }

    stopTestMode(workflowId) {
        const testMode = this.testModeTimers.get(workflowId);

        if (testMode) {
            testMode.job.stop();
            clearTimeout(testMode.timer);
            this.testModeTimers.delete(workflowId);
            console.log(`[Test Mode] Stopped for workflow: ${workflowId}`);
        }
    }

    intervalToCron(interval) {
        const intervals = {
            '1min': '* * * * *',           // Every minute
            '5min': '*/5 * * * *',         // Every 5 minutes
            '10min': '*/10 * * * *',       // Every 10 minutes
            '15min': '*/15 * * * *',       // Every 15 minutes
            '30min': '*/30 * * * *',       // Every 30 minutes
            '1hr': '0 * * * *',            // Every hour
            '2hr': '0 */2 * * *',          // Every 2 hours
            '6hr': '0 */6 * * *',          // Every 6 hours
            '12hr': '0 */12 * * *',        // Every 12 hours
            '1day': '0 0 * * *'            // Every day at midnight
        };

        return intervals[interval];
    }

    parseDuration(duration) {
        const durations = {
            '15min': 15 * 60 * 1000,
            '30min': 30 * 60 * 1000,
            '1hr': 60 * 60 * 1000,
            '2hr': 2 * 60 * 60 * 1000,
            '6hr': 6 * 60 * 60 * 1000,
            '12hr': 12 * 60 * 60 * 1000,
            '1day': 24 * 60 * 60 * 1000
        };

        return durations[duration] || 30 * 60 * 1000; // Default 30 minutes
    }

    getActiveWorkflows() {
        return Array.from(this.activeJobs.keys());
    }

    getTestModeWorkflows() {
        return Array.from(this.testModeTimers.entries()).map(([id, data]) => ({
            workflowId: id,
            ...data
        }));
    }
}

module.exports = Scheduler;
