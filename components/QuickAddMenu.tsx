import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { NODE_CATALOG } from '../constants';
import { NodeType } from '../types';

interface QuickAddMenuProps {
    position: { x: number; y: number };
    onClose: () => void;
    onSelect: (type: NodeType) => void;
    searchRef: React.RefObject<HTMLInputElement>;
    nodeNames: Record<string, string>;
}

export const QuickAddMenu: React.FC<QuickAddMenuProps> = ({ position, onClose, onSelect, searchRef, nodeNames }) => {
    const [filter, setFilter] = useState('');
    const filteredNodes = NODE_CATALOG.filter(n => n.name.toLowerCase().includes(filter.toLowerCase()) || nodeNames[n.type]?.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div
            className="absolute z-50 w-64 bg-[#1A1E26] border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-[fadeIn_0.1s] origin-top-left"
            style={{ left: position.x, top: position.y }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div className="p-2 border-b border-slate-700 flex items-center gap-2">
                <Search size={14} className="text-slate-500 ml-1" />
                <input
                    ref={searchRef}
                    className="bg-transparent text-sm text-white w-full outline-none placeholder:text-slate-600"
                    placeholder="Add node..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                {filteredNodes.map(node => (
                    <button
                        key={node.type}
                        onClick={() => onSelect(node.type)}
                        className="w-full text-left flex items-center gap-3 p-2 hover:bg-[#252A36] rounded-lg group transition-colors"
                    >
                        <div className={`p-1.5 rounded-md ${node.bg} ${node.color} shrink-0`}>
                            <node.icon size={14} />
                        </div>
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">{nodeNames[node.type] || node.name}</span>
                    </button>
                ))}
                {filteredNodes.length === 0 && <div className="p-3 text-center text-xs text-slate-500">No nodes found</div>}
            </div>
        </div>
    );
};
