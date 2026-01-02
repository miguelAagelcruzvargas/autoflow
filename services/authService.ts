import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
    id: string;
    email: string;
    fullName?: string;
}

class AuthService {
    /**
     * Register a new user
     */
    async register(email: string, password: string, fullName?: string): Promise<{ user: AuthUser | null; error: string | null }> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (error) return { user: null, error: error.message };
            if (!data.user) return { user: null, error: 'Registration failed' };

            // Create user profile
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    id: data.user.id,
                    email: data.user.email!,
                    full_name: fullName
                });

            if (profileError) console.error('Profile creation error:', profileError);

            return {
                user: {
                    id: data.user.id,
                    email: data.user.email!,
                    fullName
                },
                error: null
            };
        } catch (err) {
            return { user: null, error: (err as Error).message };
        }
    }

    /**
     * Login user
     */
    async login(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) return { user: null, error: error.message };
            if (!data.user) return { user: null, error: 'Login failed' };

            return {
                user: {
                    id: data.user.id,
                    email: data.user.email!,
                    fullName: data.user.user_metadata?.full_name
                },
                error: null
            };
        } catch (err) {
            return { user: null, error: (err as Error).message };
        }
    }

    /**
     * Logout user
     */
    async logout(): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.signOut();
            return { error: error ? error.message : null };
        } catch (err) {
            return { error: (err as Error).message };
        }
    }

    /**
     * Get current user
     */
    async getCurrentUser(): Promise<AuthUser | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            return {
                id: user.id,
                email: user.email!,
                fullName: user.user_metadata?.full_name
            };
        } catch (err) {
            console.error('Get current user error:', err);
            return null;
        }
    }

    /**
     * Get current session
     */
    async getSession(): Promise<Session | null> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            return session;
        } catch (err) {
            console.error('Get session error:', err);
            return null;
        }
    }

    /**
     * Listen to auth state changes
     */
    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        return supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                callback({
                    id: session.user.id,
                    email: session.user.email!,
                    fullName: session.user.user_metadata?.full_name
                });
            } else {
                callback(null);
            }
        });
    }
}

export const authService = new AuthService();
