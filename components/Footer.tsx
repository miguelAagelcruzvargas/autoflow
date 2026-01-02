import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface FooterProps {
    nodesCount: number;
    t: (key: string) => string;
    isAnalyzing: boolean;
    onAnalyze: () => void;
}

export const Footer: React.FC<FooterProps> = ({ nodesCount, t, isAnalyzing, onAnalyze }) => {
    return (
        <div className="flex justify-between items-center px-4 py-3 md:px-6 md:py-4 border-t border-slate-800 bg-[#0F1116] shrink-0 z-30">
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                    {nodesCount} {t('activeNodes')}
                </span>
            </div>
            <button
                onClick={onAnalyze}
                disabled={nodesCount === 0 || isAnalyzing}
                className="group bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 md:px-5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border border-slate-700 hover:border-slate-600 disabled:opacity-50 shadow-lg hover:shadow-emerald-900/20"
            >
                {isAnalyzing ? <Loader2 size={16} className="animate-spin text-emerald-400" /> : <Sparkles size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />}
                <span className="hidden xs:inline">{isAnalyzing ? t('auditing') : t('auditOptimize')}</span>
            </button>
        </div>
    );
};
