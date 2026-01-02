import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface Workflow {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    nodes: any[];
    connections: any[];
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface Execution {
    id: string;
    workflow_id: string;
    user_id: string;
    status: 'pending' | 'running' | 'success' | 'error';
    started_at: string;
    finished_at?: string;
    logs: any[];
    error_message?: string;
}

export interface UserCredential {
    id: string;
    user_id: string;
    name: string;
    type: 'api_key' | 'oauth' | 'basic';
    encrypted_data: string;
    created_at: string;
}
