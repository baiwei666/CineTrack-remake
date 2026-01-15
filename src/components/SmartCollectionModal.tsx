import React, { useState, useMemo, useEffect } from 'react';
import { X, Check, Folder, Wand2, ChevronRight, AlertCircle, Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { MovieRecord } from '../types';

interface Group {
    name: string;
    ids: string[];
    movies: MovieRecord[];
}

interface SmartCollectionModalProps {
    onClose: () => void;
    onConfirm: (groups: { name: string; ids: string[] }[]) => void;
}

export default function SmartCollectionModal({ onClose, onConfirm }: SmartCollectionModalProps) {
    const { movies } = useData();
    const [suggestions, setSuggestions] = useState<Group[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
    const [isScanning, setIsScanning] = useState(true);

    // Similarity Algorithm
    useEffect(() => {
        // Run in timeout to avoid blocking UI immediately, though mostly fast enough
        const timer = setTimeout(() => {
            const groups: Group[] = [];
            const processed = new Set<string>();

            // Simple heuristic: movies starting with same 3+ chars (min 2 words) or containing "Season" / "Part"
            // Let's try a token-based approach.
            // 1. Sort by title
            const sorted = [...movies].sort((a, b) => a.title.localeCompare(b.title));

            // 2. Iterate and find clusters
            // If Sim(A, B) > threshold, they belong together.

            // Helper: Common Prefix Ratio
            const getCommonPrefix = (s1: string, s2: string) => {
                let i = 0;
                while (i < s1.length && i < s2.length && s1[i] === s2[i]) i++;
                return s1.slice(0, i);
            };

            // Helper: Clean Title (remove "The", "Season", etc for comparison)
            const clean = (t: string) => t.toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^\w\u4e00-\u9fa5\s]/g, '');

            let currentGroup: MovieRecord[] = [];
            let currentPrefix = "";

            for (let i = 0; i < sorted.length; i++) {
                if (processed.has(sorted[i].id)) continue;

                // Start a potential cluster
                const base = sorted[i];
                const cluster = [base];

                for (let j = i + 1; j < sorted.length; j++) {
                    if (processed.has(sorted[j].id)) continue;

                    const next = sorted[j];

                    // Logic 1: Exact prefix match of significant length >= 4 chars
                    const common = getCommonPrefix(base.title, next.title);
                    // Must match at least 1 word boundary or be very long
                    const isValidPrefix = common.length >= 4 && (common.endsWith(' ') || common.length > 8);

                    // Logic 2: "Harry Potter 1" vs "Harry Potter 2"
                    // Logic 3: Chinese titles - "黑客帝国1" vs "黑客帝国2" -> common "黑客帝国" (length 4)

                    if (isValidPrefix) {
                        cluster.push(next);
                        // processed.add(next.id); // Don't mark yet, allow overlapping scanning? No, greedy is fine.
                    } else {
                        // Because sorted, if next doesn't match, unlikely subsequent ones do (unless prefix varies slightly).
                        // But "Star Wars" and "Star Trek" might separate "Star Wars".
                        // Let's stick to simple adjacent clustering for now or O(N^2) for small library.
                        // For < 1000 movies, O(N^2) check is ~1M ops, which is < 50ms.
                        // Let's do greedy O(N^2) on remaining.
                    }
                }

                // If cluster found
                if (cluster.length >= 2) {
                    // Refine cluster: Find the common name
                    // Taking the shortest title or the common prefix as name
                    // e.g. "Iron Man", "Iron Man 2" -> "Iron Man"
                    const commonTitle = getCommonPrefix(cluster[0].title, cluster[cluster.length - 1].title).trim();
                    const name = commonTitle.length > 2 ? commonTitle : cluster[0].title.split(' ')[0]; // Fallback

                    // Mark as processed
                    cluster.forEach(m => processed.add(m.id));

                    groups.push({
                        name: name.replace(/[:：\-\s]+$/, ''), // Clean trailing punctuation
                        ids: cluster.map(m => m.id),
                        movies: cluster
                    });
                }
            }

            setSuggestions(groups);
            // Select all by default
            setSelectedGroups(new Set(groups.map(g => g.name)));
            setIsScanning(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [movies]);

    const handleConfirm = () => {
        const toCreate = suggestions.filter(g => selectedGroups.has(g.name));
        onConfirm(toCreate);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2"><Wand2 className="text-purple-600" /> 智能整理合集</h2>
                        <p className="text-sm text-slate-500 mt-1">根据标题相似度自动发现潜在的影片系列</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                    {isScanning ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <Wand2 className="animate-spin" size={32} />
                            <p>正在分析您的片库...</p>
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <AlertCircle size={32} />
                            <p>未发现明显的系列影片。</p>
                            <p className="text-xs">尝试添加更多影片或手动创建。</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">发现 {suggestions.length} 个潜在合集</span>
                                <button onClick={() => setSelectedGroups(new Set(suggestions.map(g => g.name)))} className="text-xs text-blue-500 hover:underline">全选</button>
                            </div>
                            {suggestions.map((group) => (
                                <div
                                    key={group.name}
                                    className={`border rounded-xl p-4 transition cursor-pointer ${selectedGroups.has(group.name) ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-slate-800 hover:border-purple-300'}`}
                                    onClick={() => {
                                        const next = new Set(selectedGroups);
                                        if (next.has(group.name)) next.delete(group.name);
                                        else next.add(group.name);
                                        setSelectedGroups(next);
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedGroups.has(group.name) ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300'}`}>
                                                {selectedGroups.has(group.name) && <Check size={12} />}
                                            </div>
                                            <div className="flex flex-col">
                                                <input
                                                    value={group.name}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                        group.name = e.target.value; // Mutable update for simpler implementation
                                                        setSuggestions([...suggestions]);
                                                    }}
                                                    className="font-bold text-slate-900 dark:text-white bg-transparent outline-none focus:border-b border-purple-500"
                                                />
                                                <span className="text-xs text-slate-500">{group.movies.length} 部影片</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        {group.movies.map(m => (
                                            <div key={m.id} className="relative shrink-0 w-16 aspect-[2/3] rounded-md overflow-hidden bg-gray-200">
                                                {m.coverUrl && <img src={m.coverUrl} className="w-full h-full object-cover" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">取消</button>
                    <button
                        disabled={selectedGroups.size === 0}
                        onClick={handleConfirm}
                        className="px-5 py-2 bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2"
                    >
                        <Wand2 size={18} /> 创建 {selectedGroups.size} 个合集
                    </button>
                </div>
            </div>
        </div>
    );
}
