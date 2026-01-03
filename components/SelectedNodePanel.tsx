import React, { useRef } from 'react';
import { X, Sparkles, Loader2, HelpCircle, ChevronDown } from 'lucide-react';
import { NodeInstance, LanguageCode } from '../types';
import { GuideBot } from './GuideBot';
import { ConditionBuilder } from './ConditionBuilder';

interface SelectedNodePanelProps {
    selectedNode: NodeInstance | null;
    setSelectedNodeId: (id: string | null) => void;
    isGuidedMode: boolean;
    focusedField: string | null;
    setFocusedField: (field: string | null) => void;
    t: (key: string) => string;
    lang: LanguageCode;
    content: any;
    configPrompt: string;
    setConfigPrompt: (val: string) => void;
    handleSmartConfig: (node: NodeInstance) => Promise<void>;
    isConfiguring: boolean;
    setNodes: React.Dispatch<React.SetStateAction<NodeInstance[]>>;
    nodes: NodeInstance[];
    connections: any[];
    simulationLogs: any[];
}

export const SelectedNodePanel: React.FC<SelectedNodePanelProps> = ({
    selectedNode, setSelectedNodeId, isGuidedMode, focusedField, setFocusedField,
    t, lang, content, configPrompt, setConfigPrompt, handleSmartConfig, isConfiguring, setNodes,
    nodes, connections, simulationLogs
}) => {

    // Need to handle null selectedNode gracefully, though parent usually controls visibility
    if (!selectedNode) return null;

    // --- SMART VARIABLE LOGIC (The "Magic" Autocomplete) ---
    // 1. Find all nodes that connect TO this node (directly or indirectly? For simplicity, direct upstream or all previous)
    // "Easier" approach: Show ALL nodes that are not this node. 
    // "Pro" approach: Only upstream. Let's do a simple "Previous Nodes" filter based on connections.
    const getUpstreamNodes = (targetId: string) => {
        const upstreamIds = new Set<string>();
        // Simple 1-level lookup for now (expandable to recursive traversal if needed)
        connections.forEach(c => {
            if (c.target === targetId) upstreamIds.add(c.source);
        });
        return nodes.filter(n => upstreamIds.has(n.id));
    };

    const availableVars = getUpstreamNodes(selectedNode.id);

    // Helper to insert variable
    const insertVariable = (fieldName: string, varString: string) => {
        const currentVal = selectedNode.config[fieldName] || '';
        const newVal = currentVal + `{{ ${varString} }}`;
        setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [fieldName]: newVal } } : n));
        setFocusedField(null); // Close picker
    };

    return (
        <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-[#13161C] border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-[70] translate-x-0`}>
            <div className="h-full flex flex-col relative">
                {/* Guide Bot Overlay */}
                {isGuidedMode && <GuideBot node={selectedNode} focusedField={focusedField} t={t} lang={lang} variant="panel" />}

                <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-[#181B21] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedNode.bg} ${selectedNode.color} border border-white/5`}>
                            {selectedNode.icon && <selectedNode.icon size={18} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-sm">{content.nodeNames[selectedNode.type] || selectedNode.name}</h3>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tight">{selectedNode.n8nType}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedNodeId(null)} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-6 custom-scrollbar">

                    {/* DATA VISION: Execution Results */}
                    {simulationLogs && simulationLogs.some(l => l.nodeId === selectedNode.id) && (
                        <div className="mb-6 animate-[fadeIn_0.5s]">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    Last Execution Data
                                </label>
                                <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(simulationLogs.find(l => l.nodeId === selectedNode.id)?.timestamp || 0).toLocaleTimeString()}
                                </span>
                            </div>
                            <div className="bg-[#0B0E14] border border-emerald-500/30 rounded-xl overflow-hidden shadow-lg p-0 relative group/logs">
                                {/* Raw JSON Data */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover/logs:opacity-100 transition-opacity z-10">
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 font-mono">JSON OUTPUT</span>
                                </div>
                                <pre className="text-[10px] font-mono text-emerald-300 p-4 overflow-x-auto custom-scrollbar max-h-60 leading-relaxed">
                                    {JSON.stringify(simulationLogs.find(l => l.nodeId === selectedNode.id)?.data, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* AI Assistant Box */}
                    <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={48} /></div>
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 block">{t('aiAssistant')}</label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-[#0B0E14] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                                placeholder={t('smartConfigPlaceholder')}
                                value={configPrompt}
                                onChange={(e) => setConfigPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSmartConfig(selectedNode)}
                            />
                            <button
                                onClick={() => handleSmartConfig(selectedNode)}
                                disabled={isConfiguring || !configPrompt}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg disabled:opacity-50 transition-colors"
                            >
                                {isConfiguring ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5 pb-20 md:pb-0">
                        {selectedNode.fields && selectedNode.fields.length > 0 ? (
                            selectedNode.fields.map(field => {
                                const helpKey = field.help || field.name;
                                const helpTip = content.tips[helpKey];

                                return (
                                    <div key={field.name} className="animate-[fadeIn_0.3s]">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-semibold text-slate-300">{field.label}</label>
                                            {helpTip && (
                                                <div className="group relative cursor-help">
                                                    <HelpCircle size={12} className="text-slate-600 hover:text-indigo-400 transition-colors" />
                                                    <div className="hidden md:block absolute right-0 bottom-5 w-48 bg-slate-900 border border-slate-700 p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-[10px] text-slate-300">
                                                        {helpTip.title || "Configuration helper"}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {field.type === 'select' ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg p-3 text-sm md:text-xs text-white appearance-none focus:border-indigo-500 outline-none transition-colors cursor-pointer"
                                                    value={selectedNode.config[field.name] || ''}
                                                    onChange={(e) => setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.name]: e.target.value } } : n))}
                                                    onFocus={() => setFocusedField(field.name)}
                                                    onBlur={() => setFocusedField(null)}
                                                >
                                                    <option value="" disabled>Select option...</option>
                                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
                                            </div>
                                        ) : (field.type === 'textarea' || field.type === 'text' || field.type === 'json') ? (
                                            <div className="relative group/input">
                                                {/* Magic Variable Button - Appears on Focus or Hover */}
                                                {(focusedField === field.name || availableVars.length > 0) && (
                                                    <div className="absolute top-2 right-2 z-20 opacity-50 group-hover/input:opacity-100 transition-opacity">
                                                        <div className="relative group/picker">
                                                            <button className="p-1 hover:bg-indigo-500/20 text-indigo-400 rounded-md transition-colors" title="Insert Variable">
                                                                <code className="text-[10px] font-bold">{"{}"}</code>
                                                            </button>
                                                            {/* Dropdown Menu */}
                                                            <div className="absolute right-0 top-full mt-1 w-48 bg-[#181B21] border border-slate-700 rounded-lg shadow-xl overflow-hidden hidden group-hover/picker:block z-50 animate-[fadeIn_0.1s]">
                                                                <div className="text-[9px] font-bold text-slate-500 px-2 py-1 bg-slate-800/50 uppercase tracking-wider">Insert Data From:</div>
                                                                {availableVars.length === 0 ? (
                                                                    <div className="p-2 text-[10px] text-slate-500 italic">No previous nodes connected.</div>
                                                                ) : (
                                                                    availableVars.map(node => (
                                                                        <button
                                                                            key={node.id}
                                                                            onClick={() => insertVariable(field.name, `${node.name.replace(/\s+/g, '_').toLowerCase()}.output`)}
                                                                            className="w-full text-left px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-800/50 last:border-0 flex items-center gap-2"
                                                                        >
                                                                            <div className={`w-2 h-2 rounded-full ${node.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
                                                                            <span className="truncate">{node.name}</span>
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Special handling for IF node conditions - use visual builder */}
                                                {selectedNode.type === 'if' && field.name === 'conditions' ? (
                                                    <ConditionBuilder
                                                        value={selectedNode.config[field.name] || ''}
                                                        onChange={(newCondition) => setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.name]: newCondition } } : n))}
                                                        availableVariables={availableVars.map(node => ({
                                                            name: node.name,
                                                            value: node.name.replace(/\s+/g, '_').toLowerCase()
                                                        }))}
                                                    />
                                                ) : field.type === 'textarea' || field.type === 'json' ? (
                                                    <textarea
                                                        className={`w-full bg-[#0B0E14] border border-slate-700 rounded-lg p-3 text-sm md:text-xs text-white focus:border-indigo-500 outline-none resize-none ${field.type === 'json' ? 'h-32 text-emerald-400 font-mono' : 'h-24 font-mono'} leading-relaxed`}
                                                        placeholder={field.placeholder || (field.type === 'json' ? "{ ... }" : "Enter text...")}
                                                        value={selectedNode.config[field.name] || ''}
                                                        onChange={(e) => setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.name]: e.target.value } } : n))}
                                                        onFocus={() => setFocusedField(field.name)}
                                                        onBlur={() => setTimeout(() => setFocusedField(null), 200)} // Delay for button click
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg p-3 text-sm md:text-xs text-white focus:border-indigo-500 outline-none transition-colors pr-8"
                                                        placeholder={field.placeholder}
                                                        value={selectedNode.config[field.name] || ''}
                                                        onChange={(e) => setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.name]: e.target.value } } : n))}
                                                        onFocus={() => setFocusedField(field.name)}
                                                        onBlur={() => setTimeout(() => setFocusedField(null), 200)} // Delay for button click
                                                    />
                                                )}
                                            </div>
                                        ) : field.type === 'toggle' ? (
                                            <div className="flex items-center gap-3 bg-[#0B0E14] p-3 rounded-lg border border-slate-700">
                                                <div
                                                    className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${selectedNode.config[field.name] ? 'bg-indigo-600' : 'bg-slate-600'}`}
                                                    onClick={() => {
                                                        const current = selectedNode.config[field.name];
                                                        setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.name]: !current } } : n));
                                                    }}
                                                >
                                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${selectedNode.config[field.name] ? 'translate-x-4' : 'translate-x-0'}`} />
                                                </div>
                                                <span className="text-xs text-slate-400">{selectedNode.config[field.name] ? 'Enabled' : 'Disabled'}</span>
                                            </div>
                                        ) : (
                                            // Fallback for number and other simple types (rendered inside the grouped block logic above for text reuse but handled here for others or default safety)
                                            <input
                                                type={field.type}
                                                className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg p-3 text-sm md:text-xs text-white focus:border-indigo-500 outline-none transition-colors"
                                                placeholder={field.placeholder}
                                                value={selectedNode.config[field.name] || ''}
                                                onChange={(e) => setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.name]: e.target.value } } : n))}
                                                onFocus={() => setFocusedField(field.name)}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                                <p className="text-xs text-slate-500">No configuration required.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 md:p-5 border-t border-slate-800 bg-[#181B21] shrink-0">
                    <button onClick={() => setSelectedNodeId(null)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-95">
                        {t('saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};
