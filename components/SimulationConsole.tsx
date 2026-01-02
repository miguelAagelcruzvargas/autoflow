import React, { useEffect, useRef } from 'react';
import { X, Terminal, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface LogEntry {
    id: string;
    timestamp: string;
    type: 'info' | 'success' | 'error';
    message: string;
    nodeName?: string;
    details?: any;
}

interface SimulationConsoleProps {
    isOpen: boolean;
    onClose: () => void;
    logs: LogEntry[];
    status: 'idle' | 'running' | 'complete' | 'error';
}

export const SimulationConsole: React.FC<SimulationConsoleProps> = ({ isOpen, onClose, logs, status }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-64 bg-slate-900 border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[150] flex flex-col transition-transform duration-300 font-mono text-sm">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-indigo-400" />
                    <span className="font-semibold text-slate-200">Simulation Console</span>
                    {status === 'running' && (
                        <span className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-xs">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                            Running...
                        </span>
                    )}
                    {status === 'complete' && (
                        <span className="flex items-center gap-1.5 bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full text-xs">
                            <CheckCircle size={10} />
                            Complete
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X size={16} className="text-slate-400" />
                </button>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {logs.length === 0 && (
                    <div className="text-slate-500 italic text-center mt-10">
                        Ready to simulate. Click "Run" to test your flow logic.
                    </div>
                )}

                {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-slate-500 shrink-0 text-xs py-0.5">{log.timestamp}</span>
                        <div className="flex-1 break-words">
                            <div className="flex items-center gap-2">
                                {log.type === 'success' && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                                {log.type === 'error' && <AlertCircle size={14} className="text-red-400 shrink-0" />}
                                {log.type === 'info' && <Clock size={14} className="text-blue-400 shrink-0" />}

                                <span className={`
                        ${log.type === 'success' ? 'text-emerald-300' : ''}
                        ${log.type === 'error' ? 'text-red-300' : ''}
                        ${log.type === 'info' ? 'text-slate-300' : ''}
                    `}>
                                    {log.nodeName && <span className="font-bold">[{log.nodeName}]: </span>}
                                    {log.message}
                                </span>
                            </div>
                            {log.details && (
                                <div className="mt-1 ml-6 bg-black/30 p-2 rounded border border-white/5 text-xs text-slate-400 overflow-x-auto">
                                    <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};
