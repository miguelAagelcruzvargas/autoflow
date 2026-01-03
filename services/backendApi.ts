// Backend API client for workflow activation and execution

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3002';

export const backendApi = {
    // Health check
    async health() {
        const response = await fetch(`${BACKEND_URL}/health`);
        return response.json();
    },

    // Activate workflow
    async activateWorkflow(workflowId: string) {
        const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to activate workflow');
        }

        return response.json();
    },

    // Deactivate workflow
    async deactivateWorkflow(workflowId: string) {
        const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/deactivate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to deactivate workflow');
        }

        return response.json();
    },

    // Start test mode
    async startTestMode(workflowId: string, config: {
        interval: string;
        duration: string;
        maxExecutions?: number;
    }) {
        const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start test mode');
        }

        return response.json();
    },

    // Stop test mode
    async stopTestMode(workflowId: string) {
        const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/test/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to stop test mode');
        }

        return response.json();
    },

    // Execute workflow manually
    async executeWorkflow(workflowId: string) {
        const response = await fetch(`${BACKEND_URL}/api/workflows/${workflowId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to execute workflow');
        }

        return response.json();
    },

    // Get execution history
    async getExecutions(workflowId: string, limit = 20, offset = 0) {
        const response = await fetch(
            `${BACKEND_URL}/api/workflows/${workflowId}/executions?limit=${limit}&offset=${offset}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get executions');
        }

        return response.json();
    },

    // Get active workflows status
    async getStatus() {
        const response = await fetch(`${BACKEND_URL}/api/workflows/status`);
        return response.json();
    },
    // Generic POST
    async post(endpoint: string, body: any) {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text();
            try {
                const error = JSON.parse(text);
                throw new Error(error.error || `Request failed: ${response.statusText}`);
            } catch (e) {
                if (e instanceof Error && e.message !== 'Unexpected token') throw e; // Re-throw if it's the error we just created
                throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
            }
        }
        return response.json();
    },

    // Generic PUT
    async put(endpoint: string, body: any) {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text();
            try {
                const error = JSON.parse(text);
                throw new Error(error.error || `Request failed: ${response.statusText}`);
            } catch (e) {
                if (e instanceof Error && e.message !== 'Unexpected token') throw e;
                throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
            }
        }
        return response.json();
    },

    // Generic DELETE
    async delete(endpoint: string) {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const text = await response.text();
            try {
                const error = JSON.parse(text);
                throw new Error(error.error || `Request failed: ${response.statusText}`);
            } catch (e) {
                if (e instanceof Error && e.message !== 'Unexpected token') throw e;
                throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
            }
        }
        return response.json();
    }
};
