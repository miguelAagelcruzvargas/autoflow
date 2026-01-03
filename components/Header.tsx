import React, { useRef } from 'react';
import { Layout, Save, Wand2, LifeBuoy, Globe, Code, FileText, Play, StopCircle, LogIn, LogOut, User as UserIcon, GraduationCap } from 'lucide-react';
import { LanguageCode } from '../types';
import { LANGUAGES } from '../i18n';
import type { AuthUser } from '../services/authService';
import { LanguageModal } from './LanguageModal';

interface HeaderProps {
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
}

export const Header = React.memo<HeaderProps>(({
    t, lang, setLang, showTemplates, setShowTemplates,
    isGuidedMode, setIsGuidedMode, isAutoSaving = true,
    nodesCount, setShowJson, isSimulating, onSimulate,
    user, onShowAuth, onLogout, onRestartTutorial, showLanguageModal, setShowLanguageModal
}) => {
    const langButtonRef = useRef<HTMLButtonElement>(null);
    return (
        <header className="h-14 border-b border-slate-800 bg-[#0F1116] flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
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
                <div className="h-5 w-px bg-slate-800 mx-2" />
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
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-3">
                {/* Active Nodes Counter */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-xs font-mono text-slate-300">{nodesCount}</span>
                </div>

                <button
                    onClick={() => setIsGuidedMode(!isGuidedMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isGuidedMode
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-800 hover:text-slate-300'
                        }`}
                >
                    <LifeBuoy size={16} className={isGuidedMode ? 'animate-pulse' : ''} />
                    <span className="hidden sm:inline text-xs font-bold">{t('guidedMode')}</span>
                </button>

                {onRestartTutorial && (
                    <button
                        onClick={onRestartTutorial}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20"
                        title="Reiniciar tutorial interactivo"
                    >
                        <GraduationCap size={16} />
                        <span className="hidden sm:inline">Tutorial</span>
                    </button>
                )}

                {/* Language Selector */}
                <div className="relative">
                    <button
                        ref={langButtonRef}
                        onClick={() => setShowLanguageModal(!showLanguageModal)}
                        className="px-3 py-1.5 rounded-md bg-[#181B21] border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:border-indigo-500 transition-all flex items-center gap-2"
                    >
                        <Globe size={14} /> {LANGUAGES.find(l => l.code === lang)?.flag} {LANGUAGES.find(l => l.code === lang)?.code.toUpperCase()}
                    </button>
                    <LanguageModal
                        isOpen={showLanguageModal}
                        onClose={() => setShowLanguageModal(false)}
                        currentLang={lang}
                        onSelectLang={setLang}
                        buttonRef={langButtonRef}
                    />
                </div>


                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 mr-2 border-l border-slate-700 pl-3">
                    <Save size={12} /><span>{t('autoSaving')}</span>
                </div>
                <button onClick={() => setShowJson(true)} disabled={nodesCount === 0} className="text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors p-2 hover:bg-white/5 rounded-full">
                    <Code size={20} />
                </button>
                <div className="h-6 w-px bg-slate-700 mx-2" />

                {/* Auth Button */}
                {user ? (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <UserIcon size={14} className="text-indigo-400" />
                            <span className="text-xs text-slate-300">{user.email}</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-full"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onShowAuth}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                        <LogIn size={14} />
                        <span>Login</span>
                    </button>
                )}

                <div className="h-6 w-px bg-slate-700 mx-2" />
                <a href="https://docs.n8n.io" target="_blank" rel="noreferrer" className="bg-[#EA4B71] hover:bg-[#D43D60] text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-lg hover:shadow-[#EA4B71]/30 flex items-center gap-1.5">
                    <FileText size={12} /> <span>Docs</span>
                </a>
            </div>
        </header>
    )
});
