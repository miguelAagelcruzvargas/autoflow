import React, { useRef } from 'react';
import { Layout, Save, Wand2, LifeBuoy, Globe, Code, FileText, Play, StopCircle, LogIn, LogOut, User as UserIcon, GraduationCap, Power, Zap, History, ChevronLeft } from 'lucide-react';
import { LanguageCode } from '../types';
import { LANGUAGES } from '../i18n';
import type { AuthUser } from '../services/authService';
import { LanguageModal } from './LanguageModal';

interface HeaderProps {
    onBack?: () => void;
    t: (key: string) => string;
    lang: LanguageCode;
    setLang: (lang: LanguageCode) => void;
    showTemplates: boolean;
    setShowTemplates: (show: boolean) => void;
    isGuidedMode: boolean;
    setIsGuidedMode: (isGuidedMode: boolean) => void;
    isAutoSaving?: boolean;
    nodesCount: number;
    setShowJson: (show: boolean) => void;
    isSimulating: boolean;
    onSimulate: () => void;
    user: AuthUser | null;
    onShowAuth: () => void;
    onLogout: () => void;
    onRestartTutorial?: () => void;
    showLanguageModal: boolean;
    setShowLanguageModal: (show: boolean) => void;
    // Activation props
    isActive?: boolean;
    onToggleActivation?: () => void;
    onTestMode?: () => void;
    hasActiveWorkflow?: boolean;
    onShowHistory?: () => void;
}

export const Header = React.memo<HeaderProps>(({
    onBack,
    t, lang, setLang, showTemplates, setShowTemplates,
    isGuidedMode, setIsGuidedMode, isAutoSaving = true,
    nodesCount, setShowJson, isSimulating, onSimulate,
    user, onShowAuth, onLogout, onRestartTutorial, showLanguageModal, setShowLanguageModal,
    isActive, onToggleActivation, onTestMode, hasActiveWorkflow, onShowHistory
}) => {
    const langButtonRef = useRef<HTMLButtonElement>(null);
    return (
        <header className="h-14 border-b border-slate-800 bg-[#0F1116] flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
                {onBack && (
                    <button onClick={onBack} className="p-1.5 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Back to Dashboard">
                        <ChevronLeft size={20} />
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                        <Wand2 size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-100 text-sm tracking-tight">AutoFlow <span className="text-indigo-400">Pro</span></h1>
                    </div>
                </div>
                <div className="h-5 w-px bg-slate-800 mx-2" />
                <button
                    onClick={() => setShowTemplates(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-800 text-xs text-slate-300 transition-colors border border-transparent hover:border-slate-700"
                >
                    <Layout size={14} /> <span>{t('templates')}</span>
                </button>

                {/* Execution Controls Group */}
                <div className="flex items-center gap-1 ml-4 bg-slate-800/30 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={onSimulate}
                        disabled={nodesCount === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${isSimulating
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                        {isSimulating ? <StopCircle size={14} /> : <Play size={14} />}
                        <span>{isSimulating ? t('stop') : t('simulate')}</span>
                    </button>

                    {/* Activation Button */}
                    {/* Activation Switch - N8N Style */}
                    {hasActiveWorkflow && (
                        <>
                            <div className="w-px h-4 bg-slate-700 mx-1"></div>
                            <div className="flex items-center gap-2 mx-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-green-400' : 'text-slate-500'}`}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </span>
                                <button
                                    onClick={onToggleActivation}
                                    disabled={nodesCount === 0}
                                    className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${isActive ? 'bg-green-500' : 'bg-slate-600'
                                        } ${nodesCount === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={isActive ? 'Deactivate workflow' : 'Activate workflow'}
                                >
                                    <div
                                        className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-200 ${isActive ? 'translate-x-4' : 'translate-x-0.5'
                                            }`}
                                    />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Test Mode Button */}
                    {hasActiveWorkflow && (
                        <button
                            onClick={onTestMode}
                            disabled={nodesCount === 0}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all border bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed ml-1"
                            title="Run workflow in test mode"
                        >
                            <Zap size={14} />
                            <span className="hidden sm:inline">Test</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
                {/* Tools Group */}
                <div className="flex items-center bg-slate-800/30 rounded-lg p-1 gap-1 border border-slate-800">
                    {/* Active Nodes Counter */}
                    <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/50 rounded text-slate-400" title="Active Nodes">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-mono">{nodesCount}</span>
                    </div>

                    <div className="w-px h-4 bg-slate-700 mx-1"></div>

                    <button
                        onClick={() => setIsGuidedMode(!isGuidedMode)}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium transition-all ${isGuidedMode
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/50'
                            }`}
                        title={t('guidedMode')}
                    >
                        <LifeBuoy size={14} />
                    </button>

                    {onRestartTutorial && (
                        <button
                            onClick={onRestartTutorial}
                            className="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium transition-all text-purple-400 hover:bg-purple-500/10"
                            title="Interactive Tutorial"
                        >
                            <GraduationCap size={14} />
                        </button>
                    )}
                </div>

                {/* Language (Compact) */}
                <div className="relative">
                    <button
                        ref={langButtonRef}
                        onClick={() => setShowLanguageModal(!showLanguageModal)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-800 text-xs transition-colors"
                        title={LANGUAGES.find(l => l.code === lang)?.name}
                    >
                        {LANGUAGES.find(l => l.code === lang)?.flag}
                    </button>
                    <LanguageModal
                        isOpen={showLanguageModal}
                        onClose={() => setShowLanguageModal(false)}
                        currentLang={lang}
                        onSelectLang={setLang}
                        buttonRef={langButtonRef}
                    />
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-600 border-l border-slate-800 pl-3">
                    <Save size={10} /><span>{t('autoSaving')}</span>
                </div>

                <button onClick={() => setShowJson(true)} disabled={nodesCount === 0} className="text-slate-500 hover:text-indigo-400 disabled:opacity-30 transition-colors">
                    <Code size={16} />
                </button>

                <div className="h-5 w-px bg-slate-800 mx-1" />

                {/* History Button */}
                {user && onShowHistory && (
                    <button
                        onClick={onShowHistory}
                        className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                        title="Execution History"
                    >
                        <History size={18} />
                    </button>
                )}

                {/* Auth & Profile (Compact) */}
                {user ? (
                    <div className="flex items-center gap-2 ml-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400" title={user.email}>
                            <UserIcon size={14} />
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onShowAuth}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-bold transition-all ml-2"
                    >
                        <LogIn size={14} />
                        <span>Login</span>
                    </button>
                )}

                <a href="https://docs.n8n.io" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-slate-400 transition-colors ml-1" title="Documentation">
                    <FileText size={16} />
                </a>

            </div>
        </header>
    )
});
