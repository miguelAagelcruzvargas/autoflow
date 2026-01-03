import React, { useState, useEffect } from 'react';
import { Bot, Lightbulb, MapPin, Code } from 'lucide-react';
import { NodeInstance, LanguageCode, GuideTip } from '../types'; // Corrected import path
import { CONTENT_TRANSLATIONS } from '../i18n';

interface GuideBotProps {
    node?: NodeInstance | null;
    focusedField: string | null;
    t: (key: string) => string;
    lang: LanguageCode;
    variant: 'panel' | 'global';
}

export const GuideBot: React.FC<GuideBotProps> = ({ node, focusedField, t, lang, variant }) => {
    const [tip, setTip] = useState<GuideTip | null>(null);
    const [defaultMessage, setDefaultMessage] = useState('');

    // Get translations for tips
    const tips = CONTENT_TRANSLATIONS[lang]?.tips || CONTENT_TRANSLATIONS['en'].tips;

    useEffect(() => {
        if (variant === 'global') {
            setDefaultMessage(t('guideBotNoSelection'));
            setTip(null);
            return;
        }

        if (node) {
            if (focusedField) {
                const field = node.fields?.find(f => f.name === focusedField);
                if (field) {
                    // Check if we have a rich tip for this field identifier or generic field name
                    const helpKey = field.help || field.name;
                    const richTip = tips[helpKey];

                    if (richTip) {
                        setTip(richTip);
                        setDefaultMessage('');
                    } else {
                        setTip(null);
                        setDefaultMessage(t('guideBotFieldTip') + " '" + field.label + "'." + (field.placeholder ? " (" + field.placeholder + ")" : "") + " ");
                    }
                }
            } else {
                setTip(null);
                setDefaultMessage(t('guideBotDefault'));
            }
        }
    }, [focusedField, node, t, variant, tips]);

    // Responsive Styles:
    // Mobile (default): Fixed at the bottom of the panel area (above footer), taking full width with padding.
    // Desktop (md): Absolute positioned to the left of the sidebar with arrow.
    const panelStyles = "absolute bottom-[80px] left-4 right-4 z-[120] md:top-20 md:left-[-270px] md:right-auto md:bottom-auto md:w-64";
    const globalStyles = "fixed bottom-24 left-[340px] w-64 md:bottom-24 md:left-[340px] z-40"; // Positioned after sidebar (320px) + margin

    return (
        <div className={`${variant === 'panel' ? panelStyles : globalStyles} pointer-events-none transition-all duration-300`}>
            <div className={`bg-indigo-600 text-white rounded-xl shadow-2xl border border-indigo-400 relative overflow-hidden
          ${variant === 'panel' ? 'md:rounded-tr-none' : 'rounded-br-none'}
animate-[slideUp_0.3s] md:animate-[slideInLeft_0.3s]`}>

                <div className="absolute top-0 right-0 p-2 opacity-10"><Bot size={48} /></div>

                <div className="p-4 relative z-10">
                    {tip ? (
                        <div className="flex flex-col gap-3">
                            {/* Header: Title */}
                            <div className="flex items-start gap-2 border-b border-indigo-400/50 pb-2">
                                <Lightbulb size={16} className="text-yellow-300 shrink-0 mt-0.5" />
                                <h4 className="text-sm font-bold leading-tight">{tip.title}</h4>
                            </div>

                            {/* Body: Explanation */}
                            <p className="text-xs text-indigo-50 leading-relaxed font-medium">
                                {tip.explanation}
                            </p>

                            {/* Footer: Context & Example */}
                            <div className="flex flex-col gap-2 mt-1">
                                {tip.context && (
                                    <div className="flex items-start gap-1.5 text-[10px] text-indigo-200">
                                        <MapPin size={12} className="shrink-0 mt-0.5" />
                                        <span>{tip.context}</span>
                                    </div>
                                )}

                                {tip.example && (
                                    <div className="bg-indigo-950/40 rounded p-2 text-[10px] font-mono border border-indigo-500/30 flex items-start gap-2 mt-1">
                                        <Code size={12} className="shrink-0 mt-0.5 text-indigo-300" />
                                        <span className="text-indigo-100 break-all">{tip.example}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Fallback / Default State
                        <div className="flex items-start gap-3">
                            <Bot size={20} className="text-indigo-200 mt-0.5 shrink-0 animate-pulse" />
                            <p className="text-xs font-medium leading-relaxed">{defaultMessage}</p>
                        </div>
                    )}
                </div>

                {/* Arrow - Only visible on Desktop for Panel variant */}
                {variant === 'panel' ? (
                    <div className="hidden md:block absolute top-6 -right-2 w-4 h-4 bg-indigo-600 transform rotate-45 border-t border-r border-indigo-400"></div>
                ) : (
                    <div className="absolute bottom-[-6px] left-6 w-4 h-4 bg-indigo-600 transform rotate-45 border-b border-l border-indigo-400"></div>
                )}
            </div>

            {/* Decorative Glow - Only visible on Desktop */}
            {variant === 'panel' && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 bg-indigo-500/50 rounded-full blur-xl animate-pulse"></div>
            )}

            <style>{`
@keyframes slideInLeft { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`}</style>
        </div>
    );
};
