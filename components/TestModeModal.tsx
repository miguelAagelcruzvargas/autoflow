import React, { useState } from 'react';
import { X, Play, Clock, Zap } from 'lucide-react';

interface TestModeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (config: { interval: string; duration: string; maxExecutions?: number }) => Promise<void>;
    workflowName: string;
}

export const TestModeModal: React.FC<TestModeModalProps> = ({
    isOpen,
    onClose,
    onStart,
    workflowName
}) => {
    const [interval, setInterval] = useState('5min');
    const [duration, setDuration] = useState('30min');
    const [maxExecutions, setMaxExecutions] = useState<number | undefined>(undefined);
    const [isStarting, setIsStarting] = useState(false);

    const intervals = [
        { value: '1min', label: 'Every 1 minute' },
        { value: '5min', label: 'Every 5 minutes' },
        { value: '10min', label: 'Every 10 minutes' },
        { value: '15min', label: 'Every 15 minutes' },
        { value: '30min', label: 'Every 30 minutes' },
        { value: '1hr', label: 'Every hour' }
    ];

    const durations = [
        { value: '15min', label: '15 minutes' },
        { value: '30min', label: '30 minutes' },
        { value: '1hr', label: '1 hour' },
        { value: '2hr', label: '2 hours' },
        { value: '6hr', label: '6 hours' }
    ];

    const handleStart = async () => {
        setIsStarting(true);
        try {
            await onStart({
                interval,
                duration,
                maxExecutions: maxExecutions || undefined
            });
            onClose();
        } catch (error) {
            console.error('Failed to start test mode:', error);
            alert('Failed to start test mode: ' + (error as Error).message);
        } finally {
            setIsStarting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s]">
            <div className="bg-[#13161C] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/30 to-purple-950/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-indigo-600/20 rounded-lg">
                                <Zap className="text-indigo-400" size={18} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">Test Mode</h2>
                                <p className="text-[10px] text-slate-400">{workflowName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Info */}
                    <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-lg p-3">
                        <p className="text-[11px] text-indigo-300 leading-relaxed">
                            Test mode will run your workflow temporarily at the specified interval.
                            It will automatically stop after the duration ends.
                        </p>
                    </div>

                    {/* Interval */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                            <Clock size={12} />
                            Run Interval
                        </label>
                        <select
                            value={interval}
                            onChange={(e) => setInterval(e.target.value)}
                            className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white appearance-none focus:border-indigo-500 outline-none transition-colors cursor-pointer"
                        >
                            {intervals.map(int => (
                                <option key={int.value} value={int.value}>{int.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                            <Clock size={12} />
                            Test Duration
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white appearance-none focus:border-indigo-500 outline-none transition-colors cursor-pointer"
                        >
                            {durations.map(dur => (
                                <option key={dur.value} value={dur.value}>{dur.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Max Executions (Optional) */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 block">
                            Max Executions (Optional)
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={maxExecutions || ''}
                            onChange={(e) => setMaxExecutions(e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Unlimited"
                            className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none transition-colors"
                        />
                    </div>

                    {/* Preview */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Preview
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed">
                            Will run <span className="text-indigo-400 font-semibold">{intervals.find(i => i.value === interval)?.label.toLowerCase()}</span>
                            {' '}for <span className="text-indigo-400 font-semibold">{durations.find(d => d.value === duration)?.label}</span>
                            {maxExecutions && <span>, max <span className="text-indigo-400 font-semibold">{maxExecutions}</span> times</span>}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-800 bg-[#0B0E14] flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStart}
                        disabled={isStarting}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isStarting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Play size={14} />
                                Start Test
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
