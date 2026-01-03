import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Clock, Calendar, ChevronRight, ChevronDown, RefreshCw, Search, Terminal } from 'lucide-react';
import { backendApi } from '../services/backendApi';

interface Execution {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at: string;
    finished_at: string | null;
    trigger_mode: string;
    execution_data: any;
    error: any;
}

interface ExecutionLogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workflowId: string;
}

export const ExecutionLogsModal: React.FC<ExecutionLogsModalProps> = ({ isOpen, onClose, workflowId }) => {
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');

    const fetchExecutions = async () => {
        if (!workflowId) return;
        setLoading(true);
        try {
            const data = await backendApi.getExecutions(workflowId);
            // Sort by date desc
            setExecutions(data.sort((a: any, b: any) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()));
        } catch (err) {
            console.error("Failed to load executions", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchExecutions();
            // Auto-refresh every 5s while open
            const interval = setInterval(fetchExecutions, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, workflowId]);

    if (!isOpen) return null;

    const filteredExecutions = executions.filter(ex => {
        if (filter === 'success') return ex.status === 'completed';
        if (filter === 'error') return ex.status === 'failed';
        return true;
    });

    const getDuration = (start: string, end: string | null) => {
        if (!end) return 'Running...';
        const duration = new Date(end).getTime() - new Date(start).getTime();
        return `${(duration / 1000).toFixed(2)}s`;
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-[#181B21] border border-slate-700 w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-[#13151A]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Terminal size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">Execution History</h2>
                            <p className="text-xs text-slate-400">View past runs and debugging logs</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Filters & Actions */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-[#181B21]">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${filter === 'all' ? 'bg-slate-700 text-white border-slate-600' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('success')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${filter === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'}`}
                        >
                            Success
                        </button>
                        <button
                            onClick={() => setFilter('error')}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${filter === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'}`}
                        >
                            Failed
                        </button>
                    </div>
                    <button onClick={fetchExecutions} disabled={loading} className="p-2 hover:bg-slate-700 rounded-md text-slate-400 transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#0F1116]">
                    {filteredExecutions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                            <Search size={48} className="opacity-20" />
                            <p>No executions found</p>
                        </div>
                    ) : (
                        filteredExecutions.map(ex => (
                            <div key={ex.id} className="border border-slate-800 rounded-lg bg-[#181B21] overflow-hidden">
                                <div
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-1.5 rounded-full ${ex.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : ex.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                            {ex.status === 'completed' ? <CheckCircle size={16} /> : ex.status === 'failed' ? <XCircle size={16} /> : <Clock size={16} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${ex.status === 'completed' ? 'text-emerald-400' : ex.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                                                    {ex.status.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{ex.trigger_mode}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(ex.started_at).toLocaleString()}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> Duration: {getDuration(ex.started_at, ex.finished_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {expandedId === ex.id ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                                </div>

                                {/* Detailed View */}
                                {expandedId === ex.id && (
                                    <div className="p-4 bg-[#0F1116] border-t border-slate-800 text-sm font-mono text-slate-300 overflow-x-auto">
                                        {ex.error && (
                                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300">
                                                <strong>Error:</strong> {JSON.stringify(ex.error, null, 2)}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Input Data</h4>
                                                <pre className="text-xs bg-slate-900 p-2 rounded overflow-auto max-h-60">
                                                    {/* We don't necessarily have input data stored at row level, assuming it's in execution_data */}
                                                    {JSON.stringify(ex.execution_data?.steps?.[0]?.input || "No input recorded", null, 2)}
                                                </pre>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Execution Result</h4>
                                                <pre className="text-xs bg-slate-900 p-2 rounded overflow-auto max-h-60">
                                                    {JSON.stringify(ex.execution_data, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
