import React, { useState, useMemo } from 'react';
import { X, Save, Trash2, Plus, GripVertical, Search, Check, Image as ImageIcon, Calendar } from 'lucide-react';
import { Collection, MovieRecord } from '../types';
import { useData } from '../context/DataContext';

interface EditCollectionModalProps {
    collection: Collection;
    onClose: () => void;
    onSave: (updated: Collection) => void;
    onDelete: () => void;
}

export default function EditCollectionModal({ collection, onClose, onSave, onDelete }: EditCollectionModalProps) {
    const { movies } = useData();

    const [name, setName] = useState(collection.name);
    const [description, setDescription] = useState(collection.description || '');
    const [selectedCover, setSelectedCover] = useState(collection.coverUrl);
    const [movieIds, setMovieIds] = useState<string[]>(collection.movieIds);

    // Search state for adding movies
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Derived states
    const collectionMovies = useMemo(() => {
        return movieIds.map(id => movies.find(m => m.id === id)).filter(Boolean) as MovieRecord[];
    }, [movieIds, movies]);

    const potentialCovers = useMemo(() => {
        return collectionMovies
            .map(m => m.coverUrl)
            .filter(url => url && url.length > 0)
            .slice(0, 12); // Limit to 12 covers
    }, [collectionMovies]);

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const lower = searchQuery.toLowerCase();
        return movies.filter(m =>
            !movieIds.includes(m.id) && // Exclude already added
            (m.title.toLowerCase().includes(lower) || m.originalTitle?.toLowerCase().includes(lower))
        ).slice(0, 5);
    }, [searchQuery, movies, movieIds]);

    const handleSave = () => {
        if (!name.trim()) return;

        onSave({
            ...collection,
            name,
            description,
            coverUrl: selectedCover,
            movieIds,
            updatedAt: new Date().toISOString()
        });
        onClose();
    };

    const handleRemoveMovie = (id: string) => {
        setMovieIds(prev => prev.filter(mid => mid !== id));
    };

    const handleAddMovie = (movie: MovieRecord) => {
        setMovieIds(prev => [...prev, movie.id]);
        setSearchQuery('');
        setIsSearching(false);
    };

    const moveMovie = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === movieIds.length - 1) return;

        const newIds = [...movieIds];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]];
        setMovieIds(newIds);
    };

    // Auto-select cover if none
    if (!selectedCover && potentialCovers.length > 0) {
        setSelectedCover(potentialCovers[0]);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col h-[85vh] overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">编辑合集</h2>
                        <p className="text-sm text-slate-500">管理合集详情与包含的影片</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onDelete}
                            className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-bold transition flex items-center gap-2"
                        >
                            <Trash2 size={18} /> 删除
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition text-slate-500"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar: Info & Cover */}
                    <div className="w-80 border-r border-gray-200 dark:border-slate-800 p-6 overflow-y-auto bg-gray-50/50 dark:bg-slate-950/20">
                        <div className="space-y-6">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">合集名称</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="输入合集名称..."
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">描述 (可选)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                                    placeholder="添加关于这个合集的描述..."
                                />
                            </div>

                            {/* Cover Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>选择封面</span>
                                    <span className="text-xs text-slate-400 font-normal">点击选择</span>
                                </label>

                                <div className="grid grid-cols-3 gap-2">
                                    {potentialCovers.map((url, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedCover(url)}
                                            className={`
                                                relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group border-2 transition
                                                ${selectedCover === url ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-transparent hover:border-blue-300'}
                                            `}
                                        >
                                            <img src={url} className="w-full h-full object-cover" />
                                            {selectedCover === url && (
                                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                    <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {potentialCovers.length === 0 && (
                                        <div className="col-span-3 aspect-video bg-gray-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                                            <ImageIcon size={24} className="mb-2 opacity-50" />
                                            暂无可用图片
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content: Movies List */}
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm text-slate-600 dark:text-slate-400">{collectionMovies.length}</span>
                                部影片
                            </h3>

                            <div className="relative">
                                {isSearching ? (
                                    <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-64 animate-in slide-in-from-right-4">
                                        <Search size={16} className="text-slate-400 mr-2" />
                                        <input
                                            autoFocus
                                            type="text"
                                            className="bg-transparent border-none outline-none text-sm w-full"
                                            placeholder="搜索要添加的影片..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onBlur={() => setTimeout(() => !searchQuery && setIsSearching(false), 200)}
                                        />
                                        <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="ml-2 text-slate-400 hover:text-slate-600">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsSearching(true)}
                                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition"
                                    >
                                        <Plus size={16} /> 添加影片
                                    </button>
                                )}

                                {/* Search Dropdown */}
                                {searchQuery && (
                                    <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-20">
                                        {searchResults.length > 0 ? (
                                            searchResults.map(m => (
                                                <div
                                                    key={m.id}
                                                    onClick={() => handleAddMovie(m)}
                                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700 last:border-0"
                                                >
                                                    <img src={m.coverUrl} className="w-8 h-12 object-cover rounded bg-gray-200" />
                                                    <div className="overflow-hidden">
                                                        <div className="font-bold text-sm truncate">{m.title}</div>
                                                        <div className="text-xs text-slate-500">{m.year} • {m.type}</div>
                                                    </div>
                                                    <Plus size={16} className="ml-auto text-blue-500" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-xs text-slate-400">未找到匹配影片</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {collectionMovies.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-full">
                                        <Search size={24} />
                                    </div>
                                    <p>此合集暂无影片</p>
                                    <button onClick={() => setIsSearching(true)} className="text-blue-500 text-sm font-bold hover:underline">去添加</button>
                                </div>
                            ) : (
                                collectionMovies.map((movie, index) => (
                                    <div
                                        key={movie.id}
                                        className="group flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition bg-white dark:bg-slate-900"
                                    >
                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition text-slate-400">
                                            <button onClick={() => moveMovie(index, 'up')} disabled={index === 0} className="hover:text-blue-500 disabled:opacity-20"><Calendar size={12} className="rotate-180" /></button>
                                            <button onClick={() => moveMovie(index, 'down')} disabled={index === collectionMovies.length - 1} className="hover:text-blue-500 disabled:opacity-20"><Calendar size={12} /></button>
                                        </div>

                                        <div className="relative w-10 h-14 rounded overflow-hidden shrink-0 bg-gray-200">
                                            {movie.coverUrl && <img src={movie.coverUrl} className="w-full h-full object-cover" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{movie.title}</h4>
                                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                <span className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{movie.year}</span>
                                                <span className="line-clamp-1">{movie.director}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveMovie(movie.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition opacity-0 group-hover:opacity-100"
                                            title="移除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition transform active:scale-95"
                    >
                        <Save size={18} /> 保存合集
                    </button>
                </div>
            </div>
        </div>
    );
}
