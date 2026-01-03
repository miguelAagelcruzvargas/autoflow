import React, { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { LanguageCode } from '../types';
import { LANGUAGES } from '../i18n';

interface LanguageModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLang: LanguageCode;
    onSelectLang: (lang: LanguageCode) => void;
    buttonRef?: React.RefObject<HTMLButtonElement>;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose, currentLang, onSelectLang, buttonRef }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef?.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, buttonRef]);

    if (!isOpen) return null;

    const handleSelect = (lang: LanguageCode) => {
        onSelectLang(lang);
        onClose();
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute top-full right-0 mt-2 w-44 bg-[#181B21] border border-slate-700 rounded-lg shadow-xl overflow-hidden z-[200] animate-[slideDown_0.2s]"
        >
            {/* Language List - Shows ~6 items, rest with scroll */}
            <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                {LANGUAGES.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => handleSelect(lang.code)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 transition-colors border-b border-slate-800/50 last:border-b-0 ${currentLang === lang.code
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                    >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1 py-0.5 rounded uppercase min-w-[22px] text-center">
                                {lang.code === 'es-la' ? 'MX' : lang.code}
                            </span>
                            <span className="font-medium text-xs truncate">{lang.name}</span>
                        </div>
                        {currentLang === lang.code && (
                            <Check size={14} className="text-white" />
                        )}
                    </button>
                ))}
            </div>

            <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1e26;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6366f1;
        }
      `}</style>
        </div>
    );
};
