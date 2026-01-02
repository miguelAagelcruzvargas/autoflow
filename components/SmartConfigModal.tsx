import React from 'react';
import { Sparkles, X, Bot, Loader2, Zap } from 'lucide-react';
import { NodeInstance } from '../types';

interface SmartConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedNode: NodeInstance | null;
    t: (key: string) => string;
    configPrompt: string;
    setConfigPrompt: (val: string) => void;
    isConfiguring: boolean;
    onSmartConfig: (node: NodeInstance) => Promise<void>;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SmartConfigModal: React.FC<SmartConfigModalProps> = ({
    isOpen, onClose, selectedNode, t, configPrompt, setConfigPrompt, isConfiguring, onSmartConfig, addToast
}) => {
    if (!isOpen || !selectedNode) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s]">
            <div className="bg-[#151921] w-full max-w-lg mx-4 rounded-2xl border border-indigo-500/30 shadow-2xl flex flex-col overflow-hidden animate-[zoomIn_0.2s]">
                <div className="p-5 border-b border-indigo-500/10 flex justify-between items-center bg-indigo-900/10">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <Sparkles size={20} className="text-indigo-400" /> {t('smartConfigureTitle')}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-300 mb-4">{t('smartConfigureDesc')}</p>
                    <div className="relative">
                        <textarea
                            className="w-full bg-[#0B0E14] border border-indigo-500/30 rounded-xl p-4 text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none resize-none h-32 font-medium leading-relaxed shadow-inner"
                            placeholder={t('smartConfigPlaceholder')}
                            value={configPrompt}
                            onChange={(e) => setConfigPrompt(e.target.value)}
                            autoFocus
                        />
                        <div className="absolute bottom-3 right-3">
                            <Bot size={16} className="text-indigo-500/50" />
                        </div>
                    </div>
                </div>
                <div className="p-5 border-t border-white/5 bg-[#1A1E26] flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">{t('close')}</button>
                    <button
                        onClick={async () => {
                            if (!configPrompt) return;
                            await onSmartConfig(selectedNode);
                            onClose();
                            addToast(t('configApplied'), 'success');
                        }}
                        disabled={isConfiguring || !configPrompt}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConfiguring ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                        {t('smartConfigureBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};
