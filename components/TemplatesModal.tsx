import React from 'react';
import { Layout, X, FileText } from 'lucide-react';
import { WORKFLOW_TEMPLATES } from '../constants';

interface TemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    t: (key: string) => string;
    content: any; // We can be more specific but keeping it general for now
    onLoadTemplate: (templateId: string) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, t, content, onLoadTemplate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s]" onClick={onClose}>
            <div className="bg-[#151921] w-full h-full md:h-auto md:max-h-[85vh] md:max-w-4xl md:rounded-2xl border-none md:border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-[slideUp_0.3s_md:zoomIn]" onClick={e => e.stopPropagation()}>
                <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-[#1A1A1A] shrink-0">
                    <div><h3 className="font-bold text-white text-lg flex items-center gap-2"><Layout size={20} className="text-indigo-400" /> {t('templates')}</h3><p className="text-xs text-slate-400 mt-1 hidden md:block">{t('templateDesc')}</p></div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full"><X size={24} /></button>
                </div>
                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar bg-[#0B0E14] flex-1">
                    {WORKFLOW_TEMPLATES.map(tpl => {
                        const name = content.templates[tpl.id] || 'Unknown';
                        const desc = content.templatesDesc[tpl.id] || '';
                        return (
                            <div key={tpl.id} className="bg-[#151921] border border-white/5 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer group transition-all hover:bg-[#1A1E26] active:scale-98" onClick={() => onLoadTemplate(tpl.id)}>
                                <div className="flex items-start justify-between mb-3"><div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-500/20 transition-colors"><FileText size={20} /></div><span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">{tpl.nodes.length} Nodes</span></div>
                                <h4 className="font-bold text-slate-200 mb-2 group-hover:text-white">{name}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8">{desc}</p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
