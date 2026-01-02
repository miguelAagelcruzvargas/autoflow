import React, { useState } from 'react';
import {
  Zap, Search, Sparkles, Loader2, X, Plus, ChevronRight, ChevronDown
} from 'lucide-react';
import { NODE_CATALOG, CATEGORIES } from '../constants';
import { NodeType, LanguageCode, Category } from '../types';
import { CATEGORY_TRANSLATIONS } from '../i18n';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  mainPrompt: string;
  setMainPrompt: (prompt: string) => void;
  handleGenWorkflow: (e: React.FormEvent) => void;
  isProcessing: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addNode: (type: NodeType) => void;
  lang: LanguageCode;
  t: (key: string) => string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  mainPrompt,
  setMainPrompt,
  handleGenWorkflow,
  isProcessing,
  searchQuery,
  setSearchQuery,
  addNode,
  lang,
  t
}) => {
  const categoryOrder: Category[] = ['trigger', 'core', 'ai', 'google', 'msg', 'data', 'app', 'cloud', 'dev'];

  // State for collapsible categories (Default: Trigger and Core open)
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    'trigger': true,
    'core': true
  });

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <aside className={`fixed inset-y-0 left-0 w-80 bg-[#0F1116] border-r border-slate-800 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl h-full max-h-[100dvh]`}>

      {/* AI Prompt - Fixed */}
      <div className="p-4 bg-gradient-to-b from-indigo-950/20 to-transparent border-b border-indigo-900/30 shrink-0">
        <div className="text-[11px] font-bold text-indigo-400 mb-2.5 flex items-center gap-2 uppercase tracking-wider">
          <Sparkles size={12} /> {t('magicBuild')}
        </div>
        <form onSubmit={handleGenWorkflow}>
          <div className="relative">
            <textarea
              value={mainPrompt}
              onChange={e => setMainPrompt(e.target.value)}
              className="w-full bg-[#090A0D] border border-indigo-500/20 rounded-lg p-3 text-xs text-white resize-none outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 placeholder:text-slate-600 transition-all shadow-inner"
              rows={2} // Reduced height slightly
              placeholder={t('promptPlaceholder')}
            />
            <button
              type="submit"
              disabled={isProcessing || !mainPrompt}
              className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-md disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/20"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            </button>
          </div>
        </form>
      </div>

      {/* Search - Sticky/Fixed */}
      <div className="p-3 bg-[#0F1116] border-b border-slate-800/50 shrink-0">
        <div className="flex items-center bg-[#090A0D] border border-slate-800 rounded-lg px-3 py-2 focus-within:border-slate-600 transition-colors">
          <Search size={14} className="text-slate-500 mr-2" />
          <input
            className="bg-transparent border-none text-xs text-white w-full outline-none placeholder:text-slate-600"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Node Library - Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0">
        <div className="space-y-1 pb-20"> {/* Extra padding bottom for mobile ease */}
          {categoryOrder.map(catKey => {
            const nodesInCat = NODE_CATALOG.filter(n =>
              n.category === catKey && n.name.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (nodesInCat.length === 0) return null;

            const catName = CATEGORY_TRANSLATIONS[lang]?.[catKey] || CATEGORIES[catKey];
            const isExpanded = expandedCats[catKey] || searchQuery.length > 0; // Always expand if searching

            return (
              <div key={catKey} className="mb-1">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCat(catKey)}
                  className="w-full flex items-center gap-2 px-2 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors"
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span className={`w-1.5 h-1.5 rounded-full ${isExpanded ? 'bg-indigo-500' : 'bg-slate-600'}`}></span>
                  {catName}
                </button>

                {/* Node List (Collapsible) */}
                {isExpanded && (
                  <div className="grid grid-cols-1 gap-1 pl-2 mt-1 animate-[fadeIn_0.2s]">
                    {nodesInCat.map(item => (
                      <button
                        key={item.type}
                        onClick={() => addNode(item.type)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1A1E26] text-left group transition-all duration-200 border border-transparent hover:border-slate-800/50"
                      >
                        <div className={`p-1.5 rounded-md ${item.bg} ${item.color} group-hover:scale-110 transition-transform shadow-sm`}><item.icon size={16} /></div>
                        <div className="overflow-hidden min-w-0">
                          <div className="text-sm font-medium text-slate-300 group-hover:text-white truncate">{item.name}</div>
                          {/* Optional: Show short desc if needed, but keeping it clean is better */}
                        </div>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={14} className="text-slate-500" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};