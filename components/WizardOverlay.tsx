import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, Zap, MessageSquare, Clock, Globe, Database, Mail } from 'lucide-react';
import { NodeType } from '../types';

interface WizardOverlayProps {
    onComplete: (nodes: { type: NodeType; label: string }[]) => void;
    onClose: () => void;
    t: (key: string) => string;
}

export const WizardOverlay: React.FC<WizardOverlayProps> = ({ onComplete, onClose, t }) => {
    const [step, setStep] = useState(1);
    const [selections, setSelections] = useState<{ type: NodeType; label: string }[]>([]);

    const handleSelect = (type: NodeType, label: string) => {
        const newSelections = [...selections, { type, label }];
        setSelections(newSelections);

        if (step < 3) {
            setStep(step + 1);
        } else {
            onComplete(newSelections);
        }
    };

    const steps = [
        {
            id: 1,
            question: "What starts your flow?",
            options: [
                { type: 'webhook' as NodeType, label: ' Webhook', icon: Globe, desc: 'Receive data from an app' },
                { type: 'cron' as NodeType, label: 'Schedule', icon: Clock, desc: 'Run at a specific time' },
                { type: 'manual' as NodeType, label: 'Manual', icon: Zap, desc: 'Click to start' },
            ]
        },
        {
            id: 2,
            question: "What is the main action?",
            options: [
                { type: 'http' as NodeType, label: 'HTTP Request', icon: Globe, desc: 'Call an API' },
                { type: 'gemini' as NodeType, label: 'AI Process', icon: Sparkles, desc: 'Ask Gemini AI' },
                { type: 'gmail_send' as NodeType, label: 'Send Email', icon: Mail, desc: 'Send via Gmail' },
            ]
        },
        {
            id: 3,
            question: "Any final step?",
            options: [
                { type: 'postgres' as NodeType, label: 'Save Data', icon: Database, desc: 'Save to DB' },
                { type: 'telegram' as NodeType, label: 'Notify Me', icon: MessageSquare, desc: 'Send Alert' },
                { type: 'none' as any, label: 'Finish', icon: Check, desc: 'Just end here' },
            ]
        }
    ];

    const currentStep = steps.find(s => s.id === step);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-[fadeIn_0.3s]">
            <div className="w-full max-w-2xl bg-[#151921] rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col relative animate-[slideUp_0.4s]">

                {/* Progress Bar */}
                <div className="h-1 bg-slate-800 w-full">
                    <div className="h-full bg-indigo-500 transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>

                <div className="p-8 md:p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 mb-6 border border-indigo-500/20">
                        <span className="font-bold text-lg">{step}</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentStep?.question}</h2>
                    <p className="text-slate-400 mb-10">Select the best match for your automation.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {currentStep?.options.map((opt) => (
                            <button
                                key={opt.label}
                                onClick={() => handleSelect(opt.type, opt.label)}
                                className="flex flex-col items-center p-6 bg-[#1A1E26] border border-white/5 hover:border-indigo-500 hover:bg-[#1E232E] rounded-xl transition-all group active:scale-95"
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center mb-4 transition-colors">
                                    <opt.icon size={24} />
                                </div>
                                <span className="font-bold text-slate-200 mb-1">{opt.label}</span>
                                <span className="text-[10px] text-slate-500">{opt.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-[#12151B] flex justify-between items-center">
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-sm font-medium transition-colors">Skip Wizard</button>
                    <div className="flex gap-2">
                        <span className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-700'}`}></span>
                        <span className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`}></span>
                        <span className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-700'}`}></span>
                    </div>
                </div>
            </div>
        </div>
    );
};
