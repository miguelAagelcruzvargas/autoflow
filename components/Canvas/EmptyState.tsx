import React from 'react';
import { MousePointer2, Layout, Sparkles, Bot } from 'lucide-react';

interface EmptyStateProps {
    t: (key: string) => string;
    onShowTemplates: () => void;
    onFocusPrompt: () => void;
    onShowWizard: () => void;
}

export function EmptyState({ t, onShowTemplates, onFocusPrompt, onShowWizard }: EmptyStateProps) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-[fadeIn_0.5s] pointer-events-none p-6">
            <div className="flex flex-col items-center text-center max-w-lg w-full pointer-events-auto">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1A1E26] to-[#0F1116] rounded-2xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl ring-1 ring-white/5 group">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <MousePointer2 size={28} className="text-slate-400 group-hover:text-indigo-400 transition-colors relative z-10" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">{t('startBuilding')}</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs md:max-w-sm mx-auto">
                    Right-click anywhere to add a node, or use the menu on the left.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
                    <button onClick={onShowTemplates} className="flex items-center gap-3 p-3 bg-[#151921]/80 hover:bg-[#1A1E26] border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all group text-left shadow-lg hover:shadow-indigo-500/10">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors"><Layout size={18} /></div>
                        <div><div className="font-bold text-slate-200 text-xs mb-0.5">{t('templates')}</div><div className="text-[10px] text-slate-500">Pre-built flows</div></div>
                    </button>
                    <button onClick={onFocusPrompt} className="flex items-center gap-3 p-3 bg-[#151921]/80 hover:bg-[#1A1E26] border border-white/5 hover:border-purple-500/30 rounded-xl transition-all group text-left shadow-lg hover:shadow-purple-500/10">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors"><Sparkles size={18} /></div>
                        <div><div className="font-bold text-slate-200 text-xs mb-0.5">{t('magicBuild')}</div><div className="text-[10px] text-slate-500">AI Generator</div></div>
                    </button>
                    <button onClick={onShowWizard} className="flex items-center gap-3 p-3 bg-[#151921]/80 hover:bg-[#1A1E26] border border-white/5 hover:border-emerald-500/30 rounded-xl transition-all group text-left shadow-lg hover:shadow-emerald-500/10">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><Bot size={18} /></div>
                        <div><div className="font-bold text-slate-200 text-xs mb-0.5">Wizard Mode</div><div className="text-[10px] text-slate-500">Step-by-Step</div></div>
                    </button>
                </div>
            </div>
        </div>
    );
}
