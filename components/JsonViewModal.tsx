import React from 'react';
import { Share2, X, Bot, HelpCircle, Check, Copy } from 'lucide-react';
import { LanguageCode } from '../types';

interface JsonViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: (key: string) => string;
    lang: LanguageCode;
    onShowGuide: () => void;
    exportData: any; // The calculated export data object
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const JsonViewModal: React.FC<JsonViewModalProps> = ({ isOpen, onClose, t, lang, onShowGuide, exportData, addToast }) => {
    if (!isOpen) return null;

    const jsonString = JSON.stringify(exportData, null, 2);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(jsonString);
        addToast(t('copyJson') + ' to clipboard', 'success');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s]">
            <div className="bg-[#151921] w-full h-full md:h-auto md:max-h-[85vh] md:max-w-3xl md:rounded-2xl border-none md:border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.3s_md:zoomIn]">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#1A1A1A] shrink-0">
                    <div>
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <span className="p-1 bg-[#EA4B71] rounded text-white"><Share2 size={16} /></span>
                            {t('exportFlow')}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Ready for n8n Executive Engine</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full"><X size={20} /></button>
                </div>

                {/* Architect Context Banner */}
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-b border-indigo-500/20 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50 text-indigo-300">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-300 text-sm">Autoflow Architect Loop</h4>
                            <p className="text-xs text-indigo-200/70 max-w-sm leading-relaxed">{t('exportDesc')}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 px-6 pt-4">
                    <button
                        onClick={onShowGuide}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded text-indigo-300 text-xs font-bold transition-colors"
                    >
                        <HelpCircle size={12} /> {t('connectGuide') || (lang === 'es-la' ? 'Guía de Conexión' : 'Connect Guide')}
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EA4B71]/10 border border-[#EA4B71]/30 rounded text-[#EA4B71] text-xs font-bold whitespace-nowrap">
                        <Check size={12} /> n8n Compatible
                    </div>
                </div>

                <div className="bg-black/80 p-6 font-mono text-[11px] text-emerald-400 flex-1 overflow-auto custom-scrollbar relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={copyToClipboard}
                            className="p-2 bg-emerald-900/50 hover:bg-emerald-600 text-emerald-200 rounded border border-emerald-500/50 transition-colors"
                            title="Copy Raw"
                        >
                            <Copy size={14} />
                        </button>
                    </div>
                    <pre>{jsonString}</pre>
                </div>

                <div className="p-5 bg-[#1A1A1A] flex justify-between items-center border-t border-white/10 shrink-0">
                    <span className="text-xs text-slate-500">Paste this JSON directly into n8n (Ctrl+V)</span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">{t('close')}</button>
                        <button onClick={copyToClipboard} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                            <Copy size={16} /> {t('copyJson')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
