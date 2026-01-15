import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { FilterRule, FilterOperator, MovieRecord } from '../types';
import { generateId } from '../utils';

interface FilterPanelProps {
    rules: FilterRule[];
    onChange: (rules: FilterRule[]) => void;
    onClose: () => void;
    onSaveView: () => void;
}

const FIELDS: { label: string; value: keyof MovieRecord; type: 'string' | 'number' | 'date' | 'array' }[] = [
    { label: '标题', value: 'title', type: 'string' },
    { label: '年份', value: 'year', type: 'number' },
    { label: '评分', value: 'rating', type: 'number' },
    { label: '时长', value: 'duration', type: 'number' },
    { label: '观看日期', value: 'watchDate', type: 'date' },
    { label: '类型', value: 'type', type: 'string' },
    { label: '标签', value: 'tags', type: 'array' },
    { label: '导演', value: 'director', type: 'string' },
    { label: '演员', value: 'actors', type: 'array' },
];

const OPERATORS: { label: string; value: FilterOperator }[] = [
    { label: '包含', value: 'contains' },
    { label: '等于', value: 'equals' },
    { label: '大于', value: 'gt' },
    { label: '小于', value: 'lt' },
];

export default function FilterPanel({ rules, onChange, onClose, onSaveView }: FilterPanelProps) {

    const addRule = () => {
        onChange([...rules, { id: generateId(), field: 'title', operator: 'contains', value: '' }]);
    };

    const removeRule = (id: string) => {
        onChange(rules.filter(r => r.id !== id));
    };

    const updateRule = (id: string, updates: Partial<FilterRule>) => {
        onChange(rules.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-xl mb-6 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700 dark:text-slate-300">高级筛选构建器</h3>
                <div className="flex gap-2">
                    <button onClick={onSaveView} className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200 transition">保存为视图</button>
                    <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
            </div>

            <div className="space-y-3">
                {rules.map(rule => (
                    <div key={rule.id} className="flex gap-2 items-center">
                        <select
                            value={rule.field}
                            onChange={e => updateRule(rule.id, { field: e.target.value as any })}
                            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-1.5 text-sm outline-none w-28"
                        >
                            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>

                        <select
                            value={rule.operator}
                            onChange={e => updateRule(rule.id, { operator: e.target.value as any })}
                            className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-1.5 text-sm outline-none w-24"
                        >
                            {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>

                        <input
                            type={rule.field === 'year' || rule.field === 'rating' || rule.field === 'duration' ? 'number' : 'text'}
                            value={rule.value}
                            onChange={e => updateRule(rule.id, { value: e.target.value })}
                            placeholder="Value..."
                            className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-1.5 text-sm outline-none min-w-0"
                        />

                        <button onClick={() => removeRule(rule.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                {rules.length === 0 && <div className="text-sm text-slate-400 text-center py-2">暂无筛选规则，点击下方按钮添加</div>}

                <button onClick={addRule} className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 font-medium">
                    <Plus size={16} /> 添加条件
                </button>
            </div>
        </div>
    );
}
