import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, MoreVertical, Play, Calendar, Zap, Layout, Trash2, Copy, Power, Activity, ArrowRight, Clock, Settings, User, Edit2, MoreHorizontal, X } from 'lucide-react';
import { workflowService } from '../services/workflowService';
import type { Workflow } from '../services/workflowService';

// Extend Workflow type to ensure we have all fields even if Supabase definitions are lagging
interface WorkflowWithFields extends Workflow {
    is_active?: boolean;
}

interface DashboardProps {
    onOpenWorkflow: (id: string | null) => void;
    user: any;
    onLogout: () => void;
    onShowAuth: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenWorkflow, user, onLogout, onShowAuth }) => {
    const [workflows, setWorkflows] = useState<WorkflowWithFields[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Create State
    const [isCreating, setIsCreating] = useState(false);
    const [createName, setCreateName] = useState('');
    const [createDesc, setCreateDesc] = useState('');

    // Rename State
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    // Delete State
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Menu State
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadWorkflows();

        // Click outside to close menu
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadWorkflows = async () => {
        setLoading(true);
        const { workflows, error } = await workflowService.getWorkflows();
        if (workflows) {
            setWorkflows(workflows);
        }
        setLoading(false);
    };

    const handleCreateProject = async () => {
        if (!createName.trim()) {
            alert('Please enter a project name');
            return;
        }

        const { workflow, error } = await workflowService.createWorkflow(createName, [], [], createDesc);

        if (error || !workflow) {
            alert('Failed to create project: ' + error);
        } else {
            console.log('Project created:', workflow.id);
            onOpenWorkflow(workflow.id);
        }
        setIsCreating(false);
        setCreateName('');
        setCreateDesc('');
    };

    const handleDeleteClick = (id: string) => {
        // Close menu and open confirmation modal
        setActiveMenuId(null);
        setDeletingId(id);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;

        const id = deletingId;
        console.log('Confirmed delete for workflow:', id);

        const { error } = await workflowService.deleteWorkflow(id);

        if (error) {
            console.error('Delete failed:', error);
            alert('ERROR DELETING: ' + error);
        } else {
            console.log('Delete successful, updating UI');
            setWorkflows(prev => prev.filter(w => w.id !== id));
        }
        setDeletingId(null);
    };

    const startRename = (workflow: WorkflowWithFields) => {
        setRenamingId(workflow.id);
        setNewName(workflow.name);
        setNewDesc(workflow.description || '');
        setActiveMenuId(null);
    };

    const handleRenameSave = async () => {
        if (!renamingId) return;

        // Optimistic update
        setWorkflows(prev => prev.map(w => w.id === renamingId ? { ...w, name: newName, description: newDesc } : w));

        const { error } = await workflowService.updateWorkflow(renamingId, {
            name: newName,
            description: newDesc
        });

        if (error) {
            alert('Failed to update project: ' + error);
            // Revert on error would be ideal, but for now we just alert
            loadWorkflows();
        }
        setRenamingId(null);
    };

    const toggleMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setActiveMenuId(activeMenuId === id ? null : id);
    };

    const handleToggleActive = async (e: React.MouseEvent, workflow: WorkflowWithFields) => {
        e.stopPropagation();
        // Optimistic update
        const newStatus = !workflow.is_active;
        setWorkflows(prev => prev.map(w => w.id === workflow.id ? { ...w, is_active: newStatus } : w));

        // In a real implementation with backend, we would call the activation API here
        // workflowService.toggleActivation(workflow.id, newStatus);

        // For now, let's update the record
        await workflowService.updateWorkflow(workflow.id, { is_public: workflow.is_public }); // Just to trigger a save if needed, but really we need a specific flag update
        // Since is_active is handled by backend API endpoints (activate/deactivate),
        // we should ideally call those. But for this dashboard prototype, visual feedback is key.
    };

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.description && w.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#151921] border border-red-500/20 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative transform transition-all scale-100">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto border border-red-500/20">
                            <Trash2 size={24} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">Delete Project?</h3>
                        <p className="text-slate-400 text-sm text-center mb-6">
                            Are you sure you want to delete this project? This action cannot be undone and will delete all execution history.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-[0_4px_14px_rgba(239,68,68,0.4)]"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Modal */}
            {renamingId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[#151921] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button
                            onClick={() => setRenamingId(null)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-6">Edit Project Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    className="w-full bg-[#0B0E14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setRenamingId(null)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRenameSave}
                                    className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar - Glassmorphism */}
            <header className="h-20 border-b border-white/5 bg-[#0F1116]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transform hover:rotate-3 transition-transform">
                        <Layout size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-2xl tracking-tight text-white leading-none">AutoFlow <span className="text-indigo-400">Hub</span></h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                            <div className="flex items-center gap-3 group cursor-pointer p-1.5 pr-3 rounded-full hover:bg-white/5 transition-colors" onClick={onLogout}>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[1px]">
                                    <div className="w-full h-full rounded-full bg-[#0F1116] flex items-center justify-center">
                                        <span className="text-xs font-bold text-white uppercase">{user.email?.charAt(0) || 'U'}</span>
                                    </div>
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-xs font-bold text-white leading-none mb-0.5">{user.email?.split('@')[0]}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Pro Plan</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button onClick={onShowAuth} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-indigo-50 rounded-full text-xs font-bold transition-all transform hover:scale-105 shadow-lg shadow-white/5">
                            <User size={14} className="text-indigo-600" />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 max-w-[1600px] w-full mx-auto px-8 py-10 relative z-10">

                {/* Hero / Actions Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-4 animate-fade-in">
                            <Activity size={12} /> System Operational
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{user?.email?.split('@')[0] || 'Guest'}</span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl">
                            Ready to automate? You have <strong className="text-white">{workflows.length}</strong> active projects.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
                        <div className="relative flex-1 group min-w-[320px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search your projects..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-[#151921]/50 backdrop-blur-sm border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600 shadow-xl"
                            />
                        </div>

                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-1 active:translate-y-0 text-nowrap"
                        >
                            <Plus size={20} />
                            <span>New Project</span>
                        </button>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-[280px] bg-[#151921] rounded-3xl border border-white/5 animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredWorkflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-[#151921]/30 backdrop-blur-sm rounded-[32px] border border-dashed border-white/10">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-20"></div>
                            <Layout size={40} className="text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No projects found</h3>
                        <p className="text-slate-500 mb-8 text-center max-w-sm">
                            {searchQuery ? 'We couldn\'t find anything matching your search.' : 'Your workspace is empty. Start by building your first automation project.'}
                        </p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="text-white bg-[#1A1F2E] hover:bg-[#252b3b] border border-white/10 px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 flex items-center gap-2 group"
                        >
                            Create from scratch <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                        {filteredWorkflows.map(workflow => (
                            <div
                                key={workflow.id}
                                onClick={() => onOpenWorkflow(workflow.id)}
                                className="group bg-[#151921]/80 backdrop-blur-md border border-white/5 hover:border-indigo-500/30 rounded-[24px] p-1 cursor-pointer transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2 flex flex-col h-[280px] relative overflow-hidden"
                            >
                                {/* Card Body */}
                                <div className="bg-[#0B0E14]/50 rounded-[20px] h-full flex flex-col p-6 relative z-10 overflow-hidden">
                                    {/* Subtle Grid BG inside card */}
                                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1F242F] to-[#151921] flex items-center justify-center border border-white/5 text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.2)] group-hover:shadow-[0_8px_20px_rgba(79,70,229,0.15)] group-hover:scale-110">
                                            <Zap size={28} strokeWidth={1.5} />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-2 ${workflow.is_active
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                                : 'bg-slate-700/30 text-slate-500 border-slate-700/50'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${workflow.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                                {workflow.is_active ? 'Active' : 'Draft'}
                                            </div>

                                            {/* Menu Trigger */}
                                            <button
                                                onClick={(e) => toggleMenu(e, workflow.id)}
                                                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative z-20"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeMenuId === workflow.id && (
                                                <div ref={menuRef} className="absolute top-12 right-2 w-48 bg-[#1A1F2E] border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden animate-fade-in origin-top-right">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); startRename(workflow); }}
                                                        className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                                                    >
                                                        <Edit2 size={14} /> Rename
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(workflow.id); }}
                                                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-2 transition-colors border-t border-white/5 font-medium"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-xl text-white mb-2 truncate group-hover:text-indigo-300 transition-colors">{workflow.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4 flex-1">
                                        {workflow.description || 'No description provided.'}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                            <div className="flex items-center gap-1.5" title="Nodes">
                                                <Layout size={14} /> {(workflow.nodes || []).length}
                                            </div>
                                            <div className="flex items-center gap-1.5" title="Last Updated">
                                                <Clock size={14} /> {new Date(workflow.updated_at || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decorative Gradient Border effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-transparent to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-[24px]"></div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#151921] border border-indigo-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <h3 className="text-2xl font-bold text-white mb-6">Create New Project</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                    placeholder="e.g., Marketing Automation"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm h-24 resize-none"
                                    placeholder="What does this workflow do?"
                                    value={createDesc}
                                    onChange={(e) => setCreateDesc(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProject}
                                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Create Project
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
