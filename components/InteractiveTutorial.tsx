import React, { useState, useEffect } from 'react';
import { Zap, ArrowDown, ArrowRight, CheckCircle, X, Hand } from 'lucide-react';

interface TutorialStep {
    id: string;
    title: string;
    description: string;
    action: string;
    highlight?: 'canvas' | 'sidebar' | 'node' | null;
    pointer?: { x: string; y: string } | null;
    celebration?: boolean;
    demo?: boolean;
}

interface InteractiveTutorialProps {
    currentStep: number;
    onStepComplete: () => void;
    onSkip: () => void;
    onComplete: () => void;
    nodes: any[];
    selectedNodeIds: Set<string>;
    isBoxSelecting: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        title: '¡Bienvenido a AutoFlow Pro! 👋',
        description: 'Vamos a aprender los controles básicos del canvas en 5 pasos simples',
        action: 'click_start',
        highlight: null,
        pointer: null
    },
    {
        id: 'add_first_node',
        title: 'Paso 1: Agregar un Nodo',
        description: 'Haz clic en cualquier nodo del panel izquierdo para agregarlo al canvas',
        action: 'add_node',
        highlight: 'sidebar',
        pointer: { x: '15%', y: '40%' }
    },
    {
        id: 'multi_select',
        title: 'Paso 2: Selección Múltiple',
        description: 'Mantén Ctrl y haz clic en otro nodo para seleccionar múltiples',
        action: 'multi_select',
        highlight: 'canvas',
        pointer: null
    },
    {
        id: 'box_select',
        title: 'Paso 3: Selección por Área',
        description: 'Mantén Alt y arrastra en el canvas para seleccionar múltiples nodos',
        action: 'box_select',
        highlight: 'canvas',
        pointer: { x: '50%', y: '50%' },
        demo: true
    },
    {
        id: 'group_move',
        title: 'Paso 4: Mover Grupos',
        description: 'Con nodos seleccionados, arrastra uno y todos se moverán juntos',
        action: 'group_move',
        highlight: 'canvas',
        pointer: null
    },
    {
        id: 'complete',
        title: '¡Felicidades! 🎉',
        description: 'Has completado el tutorial básico. ¡Ahora puedes crear workflows increíbles!',
        action: 'finish',
        highlight: null,
        celebration: true
    }
];

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
    currentStep,
    onStepComplete,
    onSkip,
    onComplete,
    nodes,
    selectedNodeIds,
    isBoxSelecting
}) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [isCompletingStep, setIsCompletingStep] = useState(false);

    const step = TUTORIAL_STEPS[currentStep];
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
    const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

    // Detectar acciones del usuario
    useEffect(() => {
        if (!step || isCompletingStep) return;

        const completeStep = () => {
            setIsCompletingStep(true);
            setTimeout(() => {
                setIsCompletingStep(false);
                onStepComplete();
            }, 800); // Tiempo para ver la animación de éxito
        };

        switch (step.action) {
            case 'add_node':
                if (nodes.length > 0) completeStep();
                break;

            case 'multi_select':
                if (selectedNodeIds.size > 1) completeStep();
                break;

            case 'box_select':
                if (isBoxSelecting) {
                    // Esperar un poco para asegurar que el usuario vea que está seleccionando
                    setTimeout(() => {
                        if (isBoxSelecting) completeStep();
                    }, 500);
                }
                break;

            case 'group_move':
                if (selectedNodeIds.size > 1) {
                    // Simular que completó al mover (simplificado para detección)
                    const timer = setTimeout(completeStep, 3000);
                    return () => clearTimeout(timer);
                }
                break;
        }
    }, [step, nodes, selectedNodeIds, isBoxSelecting, onStepComplete, isCompletingStep]);

    // Mostrar confetti en el último paso
    useEffect(() => {
        if (step?.celebration) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000); // 5s confetti
            return () => clearTimeout(timer);
        }
    }, [step]);

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            onStepComplete();
        }
    };

    return (
        <>
            {/* Overlay oscuro con transición */}
            <div className="fixed inset-0 bg-black/60 z-40 pointer-events-none transition-opacity duration-500" />

            {/* Spotlight effect - Optimized with transitions */}
            {step.highlight && (
                <div className="fixed inset-0 z-40 pointer-events-none transition-all duration-500 ease-in-out">
                    <svg className="w-full h-full">
                        <defs>
                            <mask id="spotlight">
                                <rect width="100%" height="100%" fill="white" />
                                {/* Animated rect for spotlight */}
                                <rect
                                    className="transition-all duration-500 ease-in-out"
                                    x={step.highlight === 'sidebar' ? "0" : "320"}
                                    y={step.highlight === 'canvas' ? "64" : "0"}
                                    width={step.highlight === 'sidebar' ? "320" : "calc(100% - 320px)"}
                                    height={step.highlight === 'canvas' ? "calc(100% - 64px)" : "100%"}
                                    rx="0"
                                    fill="black"
                                />
                            </mask>
                        </defs>
                        <rect width="100%" height="100%" mask="url(#spotlight)" fill="black" opacity="0.7" />
                    </svg>
                </div>
            )}

            {/* Animated pointer with Pulse */}
            {step.pointer && !isCompletingStep && (
                <div
                    className="fixed z-50 pointer-events-none transition-all duration-500 ease-in-out"
                    style={{
                        left: step.pointer.x,
                        top: step.pointer.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="relative">
                        <ArrowDown className="text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-bounce" size={56} strokeWidth={2.5} />
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-16 h-16 bg-indigo-500 rounded-full opacity-20 animate-ping" />
                    </div>
                </div>
            )}

            {/* Demo animation */}
            {step.demo && !isCompletingStep && (
                <div className="fixed inset-0 z-45 pointer-events-none">
                    <div className="absolute animate-[demo-hand_4s_infinite]" style={{ left: '50%', top: '50%' }}>
                        <Hand className="text-white drop-shadow-xl" size={40} fill="#6366f1" />
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl shadow-xl whitespace-nowrap font-bold border border-indigo-400/30">
                            Mantén Alt + Arrastra
                        </div>
                    </div>
                </div>
            )}

            {/* Unified Instruction Card */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-auto">
                <div className={`
                    bg-[#1A1E26] border border-slate-700/50 rounded-2xl p-0 shadow-2xl overflow-hidden
                    transition-all duration-500 transform
                    ${isCompletingStep ? 'scale-105 ring-4 ring-emerald-500/50 border-emerald-500' : 'scale-100 ring-1 ring-white/10'}
                `}>
                    {/* Progress Bar (Integrated) */}
                    <div className="h-1.5 bg-slate-800 w-full">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="p-6">
                        <div className="flex items-start gap-5">
                            {/* Icon / Status */}
                            <div className={`
                                p-3.5 rounded-xl shrink-0 transition-all duration-500
                                ${isCompletingStep
                                    ? 'bg-emerald-500/20 text-emerald-400 rotate-12 scale-110'
                                    : 'bg-indigo-600/20 text-indigo-400'
                                }
                            `}>
                                {isCompletingStep || step.celebration ? (
                                    <CheckCircle size={28} strokeWidth={2.5} />
                                ) : (
                                    <Zap size={28} strokeWidth={2.5} />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-white font-bold text-lg tracking-tight">
                                        {isCompletingStep ? '¡Excelente! Completado' : step.title}
                                    </h3>
                                    <span className="text-xs font-semibold text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                                        {currentStep + 1} / {TUTORIAL_STEPS.length}
                                    </span>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed transition-opacity duration-300">
                                    {isCompletingStep ? 'Avanzando al siguiente paso...' : step.description}
                                </p>
                            </div>
                        </div>

                        {/* Footer / Controls */}
                        {!isCompletingStep && !step.celebration && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/50">
                                <button
                                    onClick={onSkip}
                                    className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors hover:underline"
                                >
                                    Saltar tutorial
                                </button>

                                {step.action === 'click_start' && (
                                    <button
                                        onClick={handleNext}
                                        className="group flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        Comenzar
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Celebration Button */}
                        {step.celebration && (
                            <div className="mt-6">
                                <button
                                    onClick={onComplete}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-500/30 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    <span>¡Empezar a Crear!</span>
                                    <span className="text-xl">🚀</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confetti celebration */}
            {showConfetti && (
                <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2.5 h-2.5 rounded-full animate-[confetti_3s_ease-out_forwards]"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10%',
                                backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
                                animationDelay: `${Math.random() * 1}s`,
                                transform: `rotate(${Math.random() * 360}deg)`
                            }}
                        />
                    ))}
                </div>
            )}

            <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes demo-hand {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(60px, 40px) scale(0.9); opacity: 0.8; }
        }
      `}</style>
        </>
    );
};
