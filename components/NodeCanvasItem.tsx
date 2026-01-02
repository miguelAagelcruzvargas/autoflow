import React from 'react';
import { Plus, Trash2, CheckCircle, Settings, Box } from 'lucide-react';
import { NodeInstance, NodeType } from '../types';

interface NodeCanvasItemProps {
    node: NodeInstance;
    isSelected: boolean;
    onSelect: (e: React.MouseEvent) => void;
    onDelete: () => void;
    onMouseDown: (e: React.MouseEvent, id: string) => void;
    onConnectStart: (e: React.MouseEvent, nodeId: string, handleId: string) => void;
    onConnectEnd: (e: React.MouseEvent, nodeId: string) => void;
    onQuickAdd: (nodeId: string) => void;
    onSmartConfig: (node: NodeInstance) => void;
    isGuidedMode: boolean;
    isDimmed: boolean;
    description: string;
    displayName: string;
    simulationStatus?: 'idle' | 'running' | 'success' | 'error';
}

const getHandles = (type: NodeType) => {
    if (type === 'if') {
        return [
            { id: 'true', label: 'True', color: 'bg-emerald-500', top: '30%' },
            { id: 'false', label: 'False', color: 'bg-red-500', top: '70%' }
        ];
    }
    if (type === 'switch') {
        return [
            { id: '0', label: '0', color: 'bg-slate-400', top: '25%' },
            { id: '1', label: '1', color: 'bg-slate-400', top: '50%' },
            { id: '2', label: '2', color: 'bg-slate-400', top: '75%' }
        ];
    }
    return [{ id: 'main', label: null, color: 'bg-slate-400', top: '50%' }];
};

export const NodeCanvasItem: React.FC<NodeCanvasItemProps> = ({ node, isSelected, onSelect, onDelete, onMouseDown, onConnectStart, onConnectEnd, onQuickAdd, onSmartConfig, isGuidedMode, isDimmed, description, displayName, simulationStatus = 'idle' }) => {
    // Fallback to Box icon if node.icon is undefined
    const Icon = node.icon || Box;
    const handles = getHandles(node.type);

    // Use fixed pixel width w-[240px] instead of relative w-60 to avoid font-size scaling issues
    return (
        <div
            className={`absolute w-[240px] h-[72px] group transition-all duration-300 border rounded-xl p-3 shadow-lg backdrop-blur-md select-none z-20 overflow-visible
        ${isDimmed ? 'opacity-30 blur-[1px] scale-95 grayscale' : 'opacity-100 scale-100'}
        ${simulationStatus === 'running' ? '!border-yellow-400 !ring-4 !ring-yellow-500/50 z-50 shadow-[0_0_50px_rgba(234,179,8,0.4)]' : ''}
        ${simulationStatus === 'success' ? '!border-emerald-500 !bg-emerald-900/20' : ''}
        ${simulationStatus === 'error' ? '!border-red-500 !bg-red-900/20' : ''}
        ${isSelected && simulationStatus === 'idle'
                    ? (isGuidedMode ? 'bg-[#1A1A1A] border-indigo-400 ring-4 ring-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.4)] z-50' : 'bg-[#1A1A1A] border-indigo-500 ring-2 ring-indigo-500/50 shadow-indigo-500/20')
                    : (simulationStatus === 'idle' ? 'bg-[#151921]/90 border-white/5 hover:border-white/20 hover:bg-[#1A1E26]' : '')
                }`}
            style={{ left: node.position.x, top: node.position.y }}
            onMouseDown={(e) => onMouseDown(e, node.id)}
            onClick={onSelect}
            onDoubleClick={(e) => { e.stopPropagation(); onSmartConfig(node); }}
        >
            {/* Visual Cue for Guided Mode when Selected */}
            {isGuidedMode && isSelected && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce shadow-lg flex items-center gap-1 whitespace-nowrap z-50 pointer-events-none">
                    <Settings size={10} />
                    <span>Configure Me</span>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45"></div>
                </div>
            )}

            {/* Input Handle - Left Center */}
            <div
                className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center cursor-crosshair z-40 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseUp={(e) => { e.stopPropagation(); onConnectEnd(e, node.id); }}
            >
                <div className="w-2 h-2 bg-slate-400 rounded-full border border-slate-600 hover:bg-indigo-400 hover:scale-150 transition-all"></div>
            </div>

            <div className="flex items-center gap-3 pointer-events-none h-full">
                <div className={`p-2 rounded-lg shadow-inner ${node.bg} ${node.color} border border-white/5 relative shrink-0`}>
                    <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold truncate transition-colors ${isSelected ? 'text-indigo-200' : 'text-slate-100'}`}>{displayName}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 truncate">{description}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDelete();
                    }}
                    className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Quick Add Button */}
            {!isDimmed && (
                <div
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 z-40 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer pointer-events-auto"
                    onClick={(e) => { e.stopPropagation(); onQuickAdd(node.id); }}
                >
                    <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg border border-indigo-400 text-white">
                        <Plus size={12} strokeWidth={3} />
                    </div>
                </div>
            )}

            {/* Config Indicator */}
            {Object.keys(node.config).length > 0 && (
                <div className="absolute -top-2 -right-2 bg-emerald-600 text-white rounded-full p-0.5 border-2 border-[#151921] z-30">
                    <CheckCircle size={10} />
                </div>
            )}

            {/* Output Handles */}
            {handles.map(handle => (
                <div
                    key={handle.id}
                    className="absolute -right-2 w-4 h-4 flex items-center justify-center cursor-crosshair z-40 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ top: handle.top, transform: 'translateY(-50%)' }}
                    onMouseDown={(e) => { e.stopPropagation(); onConnectStart(e, node.id, handle.id); }}
                >
                    <div className={`w-2 h-2 ${handle.color} rounded-full border border-slate-600 hover:scale-150 transition-all`}>
                        {handle.label && (
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100">
                                {handle.label}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
