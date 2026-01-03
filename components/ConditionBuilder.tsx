import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, AlertCircle } from 'lucide-react';

interface ConditionBuilderProps {
    value: string; // Current condition string (e.g., "{{statusCode}} != 200")
    onChange: (newCondition: string) => void;
    availableVariables: Array<{ name: string; value: string }>; // Variables from previous nodes
}

const OPERATORS = [
    { value: '==', label: 'equals (==)', example: 'status == 200' },
    { value: '!=', label: 'not equals (!=)', example: 'status != 200' },
    { value: '>', label: 'greater than (>)', example: 'count > 10' },
    { value: '<', label: 'less than (<)', example: 'count < 10' },
    { value: '>=', label: 'greater or equal (>=)', example: 'count >= 10' },
    { value: '<=', label: 'less or equal (<=)', example: 'count <= 10' },
    { value: 'contains', label: 'contains', example: 'text contains "error"' },
];

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({ value, onChange, availableVariables }) => {
    const [mode, setMode] = useState<'visual' | 'code'>('visual');
    const [variable, setVariable] = useState('');
    const [operator, setOperator] = useState('==');
    const [compareValue, setCompareValue] = useState('');

    // Parse existing condition on mount
    useEffect(() => {
        if (value) {
            // Try to parse: {{variable}} operator value
            const match = value.match(/\{\{([^}]+)\}\}\s*([!=<>]+|contains)\s*(.+)/);
            if (match) {
                setVariable(match[1].trim());
                setOperator(match[2].trim());
                setCompareValue(match[3].trim().replace(/['"]/g, ''));
            } else {
                // If can't parse, switch to code mode
                setMode('code');
            }
        }
    }, []);

    // Build condition string from visual inputs
    useEffect(() => {
        if (mode === 'visual' && variable && operator && compareValue) {
            let condition = `{{${variable}}} ${operator} `;

            // Add quotes for string values if using contains
            if (operator === 'contains') {
                condition += `"${compareValue}"`;
            } else if (isNaN(Number(compareValue))) {
                condition += `"${compareValue}"`;
            } else {
                condition += compareValue;
            }

            onChange(condition);
        }
    }, [variable, operator, compareValue, mode]);

    const getPreview = () => {
        if (!variable || !operator || !compareValue) return 'Configure all fields to see preview';

        const varName = variable.replace(/[{}]/g, '');
        const readableOp = OPERATORS.find(op => op.value === operator)?.label.split(' ')[0] || operator;

        return `Will be TRUE when: ${varName} ${readableOp} ${compareValue}`;
    };

    return (
        <div className="space-y-3">
            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-[#0B0E14] rounded-lg border border-slate-700">
                <button
                    onClick={() => setMode('visual')}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${mode === 'visual'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Visual Builder
                </button>
                <button
                    onClick={() => setMode('code')}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors ${mode === 'code'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Code Mode
                </button>
            </div>

            {mode === 'visual' ? (
                <>
                    {/* Variable Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Variable to Check
                        </label>
                        <div className="relative">
                            <select
                                value={variable}
                                onChange={(e) => setVariable(e.target.value)}
                                className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg p-2.5 text-xs text-white appearance-none focus:border-indigo-500 outline-none transition-colors cursor-pointer pr-8"
                            >
                                <option value="">Select a variable...</option>
                                <option value="statusCode">statusCode (HTTP status)</option>
                                <option value="status">status (HTTP status alias)</option>
                                <option value="data">data (Response data)</option>
                                {availableVariables.map(v => (
                                    <option key={v.value} value={v.value}>{v.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Operator Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Comparison
                        </label>
                        <div className="relative">
                            <select
                                value={operator}
                                onChange={(e) => setOperator(e.target.value)}
                                className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg p-2.5 text-xs text-white appearance-none focus:border-indigo-500 outline-none transition-colors cursor-pointer pr-8"
                            >
                                {OPERATORS.map(op => (
                                    <option key={op.value} value={op.value}>{op.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    {/* Value Input */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Compare To
                        </label>
                        <input
                            type="text"
                            value={compareValue}
                            onChange={(e) => setCompareValue(e.target.value)}
                            placeholder="e.g., 200, error, true"
                            className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-indigo-500 outline-none transition-colors"
                        />
                    </div>

                    {/* Preview */}
                    <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                            <div>
                                <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                                    Condition Preview
                                </div>
                                <div className="text-xs text-slate-300 leading-relaxed">
                                    {getPreview()}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1.5 bg-[#0B0E14] p-2 rounded border border-slate-700">
                                    {value || 'No condition set'}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Code Mode */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Condition Expression
                        </label>
                        <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="{{statusCode}} != 200"
                            className="w-full bg-[#0B0E14] border border-slate-700 rounded-lg p-3 text-xs text-white font-mono focus:border-indigo-500 outline-none resize-none h-20 leading-relaxed"
                        />
                        <div className="text-[10px] text-slate-500 mt-1.5">
                            Use <code className="bg-slate-800 px-1 py-0.5 rounded">{'{{variableName}}'}</code> for variables
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
