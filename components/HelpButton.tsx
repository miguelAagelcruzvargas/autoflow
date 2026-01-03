import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Keyboard, Mouse, Zap } from 'lucide-react';

interface HelpButtonProps {
    t: (key: string) => string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ t }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // Show expanded on first visit
        const hasSeenHelp = localStorage.getItem('help_button_seen');
        if (!hasSeenHelp) {
            setIsExpanded(true);
            localStorage.setItem('help_button_seen', 'true');
            // Auto-collapse after 10 seconds
            setTimeout(() => setIsExpanded(false), 10000);
        }
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {/* Expanded Panel */}
            {isExpanded && (
                <div className="bg-[#1A1E26] border border-slate-700 rounded-xl shadow-2xl p-4 w-80 animate-[slideUp_0.3s_ease-out] mb-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="text-indigo-400" size={20} />
                            <h3 className="font-bold text-white">Controles del Canvas</h3>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-3 text-sm">
                        {/* Mouse Controls */}
                        <div>
                            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                                <Mouse size={16} />
                                <span>Ratón</span>
                            </div>
                            <div className="space-y-1.5 text-slate-300 ml-6">
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-500">•</span>
                                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Ctrl+Click</kbd> Selección múltiple</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-500">•</span>
                                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Alt+Drag</kbd> Selección por área</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-500">•</span>
                                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Arrastrar</kbd> Mover grupo seleccionado</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-500">•</span>
                                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Clic derecho</kbd> Menú rápido</span>
                                </div>
                            </div>
                        </div>

                        {/* Keyboard Shortcuts */}
                        <div>
                            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                                <Keyboard size={16} />
                                <span>Teclado</span>
                            </div>
                            <div className="space-y-1.5 text-slate-300 ml-6">
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-500">•</span>
                                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Ctrl+A</kbd> Seleccionar todo</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-500">•</span>
                                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Delete</kbd> Eliminar selección</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-slate-500">•</span>
                                    <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Escape</kbd> Deseleccionar</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tip */}
                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-2.5 mt-3">
                            <div className="flex items-start gap-2">
                                <Zap className="text-indigo-400 shrink-0 mt-0.5" size={14} />
                                <p className="text-xs text-indigo-200">
                                    <strong>Tip:</strong> Usa <kbd className="px-1 py-0.5 bg-indigo-900/50 rounded text-[10px]">Alt+Drag</kbd> para seleccionar múltiples nodos rápidamente
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Always Visible Floating Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group relative"
                title="Ayuda y atajos de teclado"
            >
                <HelpCircle size={24} />

                {/* Pulse animation on first visit */}
                {!localStorage.getItem('help_button_seen') && (
                    <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-75"></span>
                )}
            </button>
        </div>
    );
};
