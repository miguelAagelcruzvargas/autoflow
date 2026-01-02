import { supabase } from '../lib/supabase';
import type { Workflow } from '../lib/supabase';
import type { NodeInstance, Connection } from '../types';

class WorkflowService {
    /**
     * Get all workflows for current user
     */
    async getWorkflows(): Promise<{ workflows: Workflow[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('workflows')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) return { workflows: [], error: error.message };
            return { workflows: data || [], error: null };
        } catch (err) {
            return { workflows: [], error: (err as Error).message };
        }
    }

    /**
     * Get a single workflow by ID
     */
    async getWorkflow(id: string): Promise<{ workflow: Workflow | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('workflows')
                .select('*')
                .eq('id', id)
                .single();

            if (error) return { workflow: null, error: error.message };
            return { workflow: data, error: null };
        } catch (err) {
            return { workflow: null, error: (err as Error).message };
        }
    }

    /**
     * Create a new workflow
     */
    async createWorkflow(
        name: string,
        nodes: NodeInstance[],
        connections: Connection[],
        description?: string
    ): Promise<{ workflow: Workflow | null; error: string | null }> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { workflow: null, error: 'Not authenticated' };

            const { data, error } = await supabase
                .from('workflows')
                .insert({
                    user_id: user.id,
                    name,
                    description,
                    nodes,
                    connections,
                    is_public: false
                })
                .select()
                .single();

            if (error) return { workflow: null, error: error.message };
            return { workflow: data, error: null };
        } catch (err) {
            return { workflow: null, error: (err as Error).message };
        }
    }

    /**
     * Update an existing workflow
     */
    async updateWorkflow(
        id: string,
        updates: {
            name?: string;
            description?: string;
            nodes?: NodeInstance[];
            connections?: Connection[];
            is_public?: boolean;
        }
    ): Promise<{ workflow: Workflow | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('workflows')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) return { workflow: null, error: error.message };
            return { workflow: data, error: null };
        } catch (err) {
            return { workflow: null, error: (err as Error).message };
        }
    }

    /**
     * Delete a workflow
     */
    async deleteWorkflow(id: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from('workflows')
                .delete()
                .eq('id', id);

            return { error: error ? error.message : null };
        } catch (err) {
            return { error: (err as Error).message };
        }
    }

    /**
     * Get public workflows (templates)
     */
    async getPublicWorkflows(): Promise<{ workflows: Workflow[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('workflows')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            if (error) return { workflows: [], error: error.message };
            return { workflows: data || [], error: null };
        } catch (err) {
            return { workflows: [], error: (err as Error).message };
        }
    }
}

export const workflowService = new WorkflowService();
