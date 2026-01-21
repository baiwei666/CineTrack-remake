import React, { useState, useEffect } from 'react';
import { X, Check, Folder, Wand2, AlertCircle, Sparkles, User, Clapperboard, HelpCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { MovieRecord } from '../types';
import { BatchProgress, analyzeForCollectionsBatched } from '../services/aiService';

interface Group {
    id: string;
    name: string;
    description: string;
    movieIds: string[];
    movies: MovieRecord[];
    type: 'series' | 'director' | 'custom';
    confidence: number; // 0-100
    reason: string;
}

interface SmartCollectionModalProps {
    mode: 'AI' | 'Local';
    onClose: () => void;
    onConfirm: (groups: { name: string; ids: string[]; description?: string }[]) => void;
}

// Levenshtein Distance Algorithm
const levenshtein = (s: string, t: string): number => {
    if (s === t) return 0;
    if (s.length === 0) return t.length;
    if (t.length === 0) return s.length;

    const arr = [];
    for (let i = 0; i <= t.length; i++) arr[i] = [i];
    for (let j = 0; j <= s.length; j++) arr[0][j] = j;

    for (let i = 1; i <= t.length; i++) {
        for (let j = 1; j <= s.length; j++) {
            arr[i][j] = Math.min(
                arr[i - 1][j] + 1,
                arr[i][j - 1] + 1,
                arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
            );
        }
    }
    return arr[t.length][s.length];
};

const cleanTitle = (t: string) => {
    return t.toLowerCase()
        .replace(/^(the|a|an)\s+/, '')
        // Replace Roman numerals with Arabic for better matching (II -> 2, III -> 3)
        .replace(/\bii\b/g, '2').replace(/\biii\b/g, '3').replace(/\biv\b/g, '4').replace(/\bv\b/g, '5')
        // Chinese numbers
        .replace(/第一[部季章]/g, '1').replace(/第二[部季章]/g, '2').replace(/第三[部季章]/g, '3')
        .replace(/[^\w\u4e00-\u9fa5\d\s]/g, '') // Remove punctuation
        .trim();
};

export default function SmartCollectionModal({ mode, onClose, onConfirm }: SmartCollectionModalProps) {
    const { movies, collections, appSettings } = useData();
    const [suggestions, setSuggestions] = useState<Group[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [isScanning, setIsScanning] = useState(true);
    const [progress, setProgress] = useState<BatchProgress | null>(null);

    useEffect(() => {
        const scanLocally = () => {
            const groups: Group[] = [];
            const processedIds = new Set<string>();

            // ==========================================
            // Pass 1: TMDB Collection ID (Highest Confidence)
            // ==========================================
            const collectionMap = new Map<number, MovieRecord[]>();
            const collectionNames = new Map<number, string>();

            movies.forEach(m => {
                if (m.collectionId) {
                    if (!collectionMap.has(m.collectionId)) {
                        collectionMap.set(m.collectionId, []);
                        if (m.collectionName) collectionNames.set(m.collectionId, m.collectionName);
                    }
                    collectionMap.get(m.collectionId)?.push(m);
                }
            });

            collectionMap.forEach((list, id) => {
                if (list.length >= 2) {
                    const name = collectionNames.get(id) || list[0].title + ' Collection';
                    list.forEach(m => processedIds.add(m.id));
                    groups.push({
                        id: `tmdb-${id}`,
                        name: name,
                        description: `基于 TMDB 系列信息自动整理 (${list.length} 部)`,
                        movies: list,
                        movieIds: list.map(m => m.id),
                        type: 'series',
                        confidence: 100,
                        reason: '官方系列信息'
                    });
                }
            });

            // ==========================================
            // Pass 2: Title Similarity (Medium-High Confidence)
            // ==========================================
            const remaining = movies.filter(m => !processedIds.has(m.id)).sort((a, b) => a.title.localeCompare(b.title));

            for (let i = 0; i < remaining.length; i++) {
                if (processedIds.has(remaining[i].id)) continue;

                const base = remaining[i];
                const cluster = [base];
                const baseClean = cleanTitle(base.title);

                for (let j = i + 1; j < remaining.length; j++) {
                    if (processedIds.has(remaining[j].id)) continue;

                    const next = remaining[j];
                    const nextClean = cleanTitle(next.title);

                    const dist = levenshtein(baseClean, nextClean);
                    const maxLength = Math.max(baseClean.length, nextClean.length);
                    const similarity = 1 - (dist / maxLength);

                    const isSimilar = similarity > 0.7;
                    const startsWithSame = baseClean.slice(0, 4) === nextClean.slice(0, 4);

                    if (startsWithSame && isSimilar) {
                        cluster.push(next);
                    }
                }

                if (cluster.length >= 2) {
                    const name = cluster.reduce((a, b) => a.title.length < b.title.length ? a : b).title
                        .replace(/\s*\d+$/, '')
                        .replace(/[:：].*$/, '');

                    cluster.forEach(m => processedIds.add(m.id));
                    groups.push({
                        id: `title-${base.id}`,
                        name: name + ' 系列',
                        description: `根据标题相似度识别 (${cluster.length} 部)`,
                        movies: cluster,
                        movieIds: cluster.map(m => m.id),
                        type: 'series',
                        confidence: 80,
                        reason: '标题相似'
                    });
                }
            }

            // ==========================================
            // Pass 3: Director Collections (Medium Confidence)
            // ==========================================
            const directorMap = new Map<string, MovieRecord[]>();
            movies.filter(m => !processedIds.has(m.id) && m.director).forEach(m => {
                if (!m.director) return;
                const d = m.director.trim();
                if (!directorMap.has(d)) directorMap.set(d, []);
                directorMap.get(d)?.push(m);
            });

            directorMap.forEach((list, director) => {
                if (list.length >= 3) {
                    list.sort((a, b) => a.year - b.year);
                    groups.push({
                        id: `director-${director}`,
                        name: `${director} 作品集`,
                        description: `导演: ${director} (${list.length} 部)`,
                        movies: list,
                        movieIds: list.map(m => m.id),
                        type: 'director',
                        confidence: 60,
                        reason: '相同导演'
                    });
                }
            });

            setSuggestions(groups);
            setSelectedGroupIds(new Set(groups.filter(g => g.confidence >= 70).map(g => g.id)));
            setIsScanning(false);
        };

        const performScan = async () => {
            setIsScanning(true);
            setProgress(null);

            if (mode === 'AI') {
                console.log('[SmartOrganize] Starting AI scan...');

                if (appSettings?.aiProvider && appSettings.aiProvider !== 'Mock' && appSettings.aiApiKey) {
                    try {
                        const aiSuggestions = await analyzeForCollectionsBatched(movies, appSettings, (p) => {
                            setProgress(p);
                        });

                        const groups: Group[] = aiSuggestions.map(s => ({
                            id: s.id,
                            name: s.name,
                            description: s.description,
                            movieIds: s.movieIds,
                            movies: s.movies,
                            type: 'custom' as const,
                            confidence: s.confidence,
                            reason: s.reason
                        }));

                        setSuggestions(groups);
                        setSelectedGroupIds(new Set(groups.map(g => g.id)));
                        setIsScanning(false);
                        return;
                    } catch (err: any) {
                        console.warn('[SmartOrganize] AI Scan failed:', err?.message || err);
                        // Fallback logic could be added here, but for now we stay in AI mode state to show error or just stop
                        setIsScanning(false);
                    }
                } else {
                    // Not configured, fallback to local immediately or show error? 
                    // Let's fallback to local for now but maybe we should alert user.
                    console.log('[SmartOrganize] AI not configured, using local scan');
                    scanLocally();
                }
            } else {
                // Local mode
                console.log('[SmartOrganize] Starting local scan...');
                setTimeout(scanLocally, 500);
            }
        };

        performScan();
    }, [movies, appSettings, mode]);

    const handleConfirm = () => {
        const toCreate = suggestions.filter(g => selectedGroupIds.has(g.id))
            .map(g => ({ name: g.name, ids: g.movieIds, description: g.description }));
        onConfirm(toCreate);
    };

    const toggleGroup = (id: string) => {
        const next = new Set(selectedGroupIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedGroupIds(next);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col max-h-[85vh] overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                            <Sparkles className="text-purple-600 animate-pulse" /> {mode === 'AI' ? 'AI 智能整理合集' : '本地快速整理合集'}
                            {mode === 'AI' && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded border border-purple-200">AI Powered</span>}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {mode === 'AI'
                                ? '基于 AI 深度分析为您整理的合集建议。'
                                : '基于 TMDB 系列信息、标题相似度和导演作品自动为您整理。'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[400px] bg-gray-50/30 dark:bg-slate-950/30">
                    {isScanning ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-6">
                            <div className="relative">
                                <Wand2 className="animate-spin text-purple-600" size={48} />
                                <div className="absolute inset-0 animate-ping opacity-20 bg-purple-500 rounded-full"></div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
                                    {mode === 'AI' ? '正在进行 AI 深度分析...' : '正在进行本地快速分析...'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {mode === 'AI'
                                        ? '智能识别系列 • 分析剧情关联 • 深度归类'
                                        : '比对系列信息 • 计算标题相似度 • 归类导演作品'}
                                </p>
                                {mode === 'AI' && progress && (
                                    <div className="mt-4 flex flex-col items-center gap-2 animate-in fade-in w-full max-w-sm">
                                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                            {progress.status}
                                        </div>
                                        <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-500 transition-all duration-300 ease-out"
                                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {Math.round((progress.current / progress.total) * 100)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : suggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                            <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                                <AlertCircle size={32} />
                            </div>
                            <p className="font-medium">未发现明显的系列影片。</p>
                            <p className="text-xs">您可以尝试手动创建合集。</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur py-3 px-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm z-10">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                        发现 {suggestions.length} 个潜在合集
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-medium">
                                        已选 {selectedGroupIds.size} 个
                                    </span>
                                </div>
                                <div className="flex gap-3 text-xs">
                                    <button onClick={() => setSelectedGroupIds(new Set(suggestions.map(g => g.id)))} className="text-blue-600 hover:text-blue-700 font-medium hover:underline">全选</button>
                                    <span className="text-slate-300">|</span>
                                    <button onClick={() => setSelectedGroupIds(new Set())} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium hover:underline">清空</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {suggestions.map((group) => {
                                    const isSelected = selectedGroupIds.has(group.id);
                                    return (
                                        <div
                                            key={group.id}
                                            className={`
                                                relative border rounded-2xl p-4 transition-all duration-200 cursor-pointer
                                                ${isSelected
                                                    ? 'border-purple-500 bg-white dark:bg-slate-900 ring-1 ring-purple-500 shadow-lg shadow-purple-500/10'
                                                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700 opacity-60 hover:opacity-100'}
                                            `}
                                            onClick={() => toggleGroup(group.id)}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Checkbox */}
                                                <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500 text-white' : 'border-gray-300 dark:border-slate-600'}`}>
                                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {group.type === 'series' && <Clapperboard size={16} className="text-blue-500" />}
                                                        {group.type === 'director' && <User size={16} className="text-amber-500" />}
                                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate">
                                                            {group.name}
                                                        </h3>
                                                        {group.confidence === 100 && (
                                                            <span className="text-[10px] uppercase font-black tracking-wider bg-green-500 text-white px-1.5 py-0.5 rounded">Official</span>
                                                        )}
                                                    </div>

                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${group.type === 'series' ? 'bg-blue-400' : 'bg-amber-400'}`}></span>
                                                        {group.reason} • {group.movies.length} 部影片
                                                    </p>

                                                    {/* Movie Strip */}
                                                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                                                        {group.movies.map((m, idx) => (
                                                            <div key={m.id} className="relative shrink-0 w-20 aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 shadow-sm border border-black/5 dark:border-white/5 group/poster">
                                                                {m.coverUrl ? (
                                                                    <img src={m.coverUrl} className="w-full h-full object-cover transition duration-300 group-hover/poster:scale-110" loading="lazy" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Clapperboard size={20} /></div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-end p-2">
                                                                    <span className="text-[10px] text-white font-medium leading-tight line-clamp-2">{m.title}</span>
                                                                </div>
                                                                {/* Order Badge */}
                                                                <div className="absolute top-1 left-1 bg-black/60 backdrop-blur text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                                                    {m.year}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center rounded-b-2xl">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <HelpCircle size={14} />
                        <span>勾选您希望创建的合集</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                            取消
                        </button>
                        <button
                            disabled={selectedGroupIds.size === 0}
                            onClick={handleConfirm}
                            className="px-6 py-2.5 bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2 transition transform active:scale-95"
                        >
                            <Wand2 size={18} /> 创建 {selectedGroupIds.size} 个合集
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
