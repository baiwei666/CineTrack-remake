import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
    List as ListIcon, Search, Files, Film, Star, Layers, Quote, Clock, Calendar,
    User, Users, Edit2, Trash2, Filter, Folder, ArrowLeft
} from 'lucide-react';
import StarRating from '../components/StarRating';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import AddEditModal from '../components/AddEditModal';
import CollectionsView from '../components/CollectionsView';
import AddToCollectionModal from '../components/AddToCollectionModal';
import { formatDate } from '../utils';
import { useData } from '../context/DataContext';
import { FilterState, MovieRecord, FilterRule, SavedView, Collection } from '../types';
import { generateId } from '../utils';
import FilterPanel from '../components/FilterPanel';

export default function Library() {
    const { movies, setMovies, appSettings, saveSettings } = useData();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'records' | 'collections'>('records');
    const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);

    const [showDuplicates, setShowDuplicates] = useState(false);
    const [movieToDelete, setMovieToDelete] = useState<MovieRecord | null>(null);
    const [editingMovie, setEditingMovie] = useState<MovieRecord | null>(null);
    const [addingToCollectionMovie, setAddingToCollectionMovie] = useState<MovieRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Advanced Filter State
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState<FilterRule[]>([]);

    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId && appSettings.savedViews) {
            const view = appSettings.savedViews.find((v: SavedView) => v.id === viewId);
            if (view) {
                setAdvancedFilters(view.rules);
                setShowFilterPanel(true);
            }
        }
    }, [searchParams, appSettings.savedViews]);

    const handleSaveView = () => {
        const name = prompt("请输入视图名称 (例如 '2023高分科幻'):");
        if (name) {
            const newView: SavedView = {
                id: generateId(),
                name,
                icon: 'LayoutGrid',
                rules: advancedFilters
            };
            const updatedViews = [...(appSettings.savedViews || []), newView];
            saveSettings({ ...appSettings, savedViews: updatedViews });
        }
    };

    const [filters, setFilters] = useState<FilterState>({
        search: '',
        type: 'All',
        tag: 'All',
        sort: 'date_desc'
    });

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        movies.forEach(m => m.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [movies]);

    const duplicateIds = useMemo(() => {
        const lookup = new Map<string, string[]>();
        movies.forEach(m => {
            const key = m.title.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '');
            if (!lookup.has(key)) lookup.set(key, []);
            lookup.get(key)?.push(m.id);
        });
        const result = new Set<string>();
        for (const ids of lookup.values()) if (ids.length > 1) ids.forEach(id => result.add(id));
        return result;
    }, [movies]);

    const filteredMovies = useMemo(() => {
        let result = movies;

        // Collection Filter Override
        if (viewingCollection) {
            result = result.filter(m => viewingCollection.movieIds.includes(m.id));
        }

        if (showDuplicates) return result.filter(m => duplicateIds.has(m.id)).sort((a, b) => a.title.localeCompare(b.title));

        return result.filter(m => {
            const searchLower = filters.search.toLowerCase();
            const matchSearch = m.title.toLowerCase().includes(searchLower) || m.tags.some(t => t.toLowerCase().includes(searchLower)) || m.actors?.some(a => a.toLowerCase().includes(searchLower)) || (m.director && m.director.toLowerCase().includes(searchLower));
            const matchType = filters.type === 'All' || m.type === filters.type;
            const matchTag = filters.tag === 'All' || m.tags.includes(filters.tag);

            // Advanced Filters Logic (AND)
            const matchAdvanced = advancedFilters.every(rule => {
                const val = m[rule.field];
                if (val === undefined || val === null) return false;

                switch (rule.operator) {
                    case 'equals':
                        return String(val).toLowerCase() === String(rule.value).toLowerCase();
                    case 'contains':
                        if (Array.isArray(val)) return val.some(v => String(v).toLowerCase().includes(String(rule.value).toLowerCase()));
                        return String(val).toLowerCase().includes(String(rule.value).toLowerCase());
                    case 'gt':
                        return Number(val) > Number(rule.value);
                    case 'lt':
                        return Number(val) < Number(rule.value);
                    default:
                        return true;
                }
            });

            return matchSearch && matchType && matchTag && matchAdvanced;
        }).sort((a, b) => {
            switch (filters.sort) {
                case 'date_desc': return new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime();
                case 'date_asc': return new Date(a.watchDate).getTime() - new Date(b.watchDate).getTime();
                case 'rating_desc': return b.rating - a.rating;
                case 'rating_asc': return a.rating - b.rating;
                default: return 0;
            }
        });
    }, [movies, filters, showDuplicates, duplicateIds, viewingCollection, advancedFilters]);

    const handleDelete = () => {
        if (movieToDelete) {
            setMovies(prev => prev.filter(m => m.id !== movieToDelete.id));
            setMovieToDelete(null);
        }
    };

    const handleSave = (movie: MovieRecord) => {
        setMovies(prev => prev.map(m => m.id === movie.id ? movie : m));
        setEditingMovie(null);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header / Tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-none backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    {viewingCollection ? (
                        <div className="flex items-center gap-3">
                            <button onClick={() => setViewingCollection(null)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition">
                                <ArrowLeft size={20} className="text-slate-700 dark:text-slate-300" />
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Folder size={24} className="text-blue-500" /> {viewingCollection.name}
                                </h1>
                                <span className="text-xs text-slate-500">包含 {viewingCollection.movieIds.length} 部影片</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('records')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap outline-none ${activeTab === 'records' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <ListIcon size={16} className="-ml-1" /> 所有记录
                            </button>
                            <button
                                onClick={() => setActiveTab('collections')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center justify-center gap-2 whitespace-nowrap outline-none ${activeTab === 'collections' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                <Folder size={16} className="-ml-1" /> 合集
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters - Only show for Views or Records Tab */}
                {(activeTab === 'records' || viewingCollection) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full lg:w-auto">
                        <div className="relative group lg:col-span-1">
                            <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition" size={18} />
                            <input type="text" placeholder="搜名/人/类..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-900 dark:text-white w-full text-sm focus:border-blue-500 dark:focus:border-blue-500 outline-none transition shadow-sm dark:shadow-none" />
                        </div>
                        <button onClick={() => setShowDuplicates(!showDuplicates)} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border transition shadow-sm dark:shadow-none ${showDuplicates ? 'bg-orange-50 border-orange-500 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300' : 'bg-white dark:bg-slate-950 border-gray-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Files size={16} /> 查重</button>
                        <select value={filters.tag} onChange={e => setFilters({ ...filters, tag: e.target.value })} className="bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition shadow-sm dark:shadow-none"><option value="All">所有标签</option>{allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}</select>
                        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value as any })} className="bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition shadow-sm dark:shadow-none"><option value="All">所有格式</option><option value="Movie">电影</option><option value="Series">剧集</option><option value="Anime">动画</option></select>
                    </div>
                )}
            </div>


            {/* Content Switcher */}
            {activeTab === 'collections' && !viewingCollection ? (
                <CollectionsView onSelectCollection={(c) => setViewingCollection(c)} />
            ) : (
                <>
                    {/* Advanced Filter Panel */}
                    {(activeTab === 'records' || viewingCollection) && showFilterPanel && (
                        <FilterPanel
                            rules={advancedFilters}
                            onChange={setAdvancedFilters}
                            onClose={() => setShowFilterPanel(false)}
                            onSaveView={handleSaveView}
                        />
                    )}

                    {/* Filter Toggle */}
                    {(activeTab === 'records' || viewingCollection) && (
                        <div className="flex justify-end px-1">
                            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`text-sm flex items-center gap-1 ${showFilterPanel ? 'text-blue-500' : 'text-slate-500'}`}>
                                <Filter size={14} /> {showFilterPanel ? '收起筛选' : '高级筛选'}
                            </button>
                        </div>
                    )}

                    {/* Movie Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMovies.map(movie => (
                            <div key={movie.id} onClick={() => navigate(`/movie/${movie.id}`)} className="group bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-blue-900/5 dark:hover:shadow-blue-900/10 hover:border-gray-300 dark:hover:border-slate-600 transition duration-300 flex flex-col cursor-pointer h-full">
                                <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-slate-800 shrink-0">
                                    {movie.coverUrl ? <img src={movie.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={movie.title} /> : <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600 bg-gray-100 dark:bg-slate-800"><Film size={40} /></div>}
                                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-lg border border-gray-200 dark:border-white/10 z-10">
                                        <Star size={14} className="text-yellow-500 dark:text-yellow-400 fill-current" />
                                        <span className="text-slate-900 dark:text-white font-bold text-sm">{movie.rating}</span>
                                    </div>
                                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                        {movie.year && <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs text-slate-900 dark:text-white font-medium border border-gray-200 dark:border-white/10 w-fit shadow-sm">{movie.year}</div>}
                                        {movie.season && <div className="bg-orange-100/90 dark:bg-orange-600/90 backdrop-blur-md px-2 py-1 rounded-md text-xs text-orange-700 dark:text-white font-bold border border-orange-200 dark:border-orange-500/50 w-fit flex items-center gap-1 shadow-sm"><Layers size={10} /> S{movie.season}</div>}
                                        {movie.episodes && movie.episodes > 1 && <div className="bg-cyan-100/90 dark:bg-cyan-600/90 backdrop-blur-md px-2 py-1 rounded-md text-xs text-cyan-700 dark:text-white font-bold border border-cyan-200 dark:border-cyan-500/50 w-fit flex items-center gap-1 shadow-sm"><ListIcon size={10} /> {movie.episodes}集</div>}
                                    </div>
                                    <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out z-20 flex flex-col translate-y-4 group-hover:translate-y-0">
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center justify-center w-12 h-12 rounded-xl shadow-lg ${movie.rating >= 8 ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'}`}><span className="text-2xl font-bold tracking-tighter">{movie.rating}</span></div>
                                                <div className="flex flex-col gap-1"><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">评分</span><StarRating rating={movie.rating} size={12} /></div>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto scrollbar-none space-y-2"><div className="flex items-center gap-2"><Quote size={14} className="text-blue-500 dark:text-blue-400" /><span className="text-xs font-bold text-slate-800 dark:text-slate-200">简介与笔记</span></div><p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{movie.comment || <span className="italic opacity-50">暂无内容...</span>}</p></div>
                                        {movie.tags && movie.tags.length > 0 && <div className="mt-3 pt-2 border-t border-gray-200 dark:border-slate-700/50 flex flex-wrap gap-1.5">{movie.tags.slice(0, 6).map(t => <span key={t} className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 px-1.5 py-0.5 rounded">{t}</span>)}</div>}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 dark:opacity-80 group-hover:opacity-0 transition-opacity duration-300"></div>
                                    <div className="absolute bottom-0 left-0 p-4 w-full group-hover:opacity-0 transition-opacity duration-300">
                                        <div className="flex gap-2 mb-1"><span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded shadow">{movie.type}</span>{movie.duration && <span className="text-[10px] bg-slate-800/80 backdrop-blur-sm text-slate-200 px-1.5 py-0.5 rounded shadow flex items-center gap-1"><Clock size={10} /> {movie.duration}m</span>}</div>
                                        <h3 className="text-lg font-bold text-white truncate drop-shadow-md">{movie.title}</h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-200 mt-1 font-medium opacity-90"><span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(movie.watchDate)}</span></div>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900">
                                    <div className="mb-4 space-y-2">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${movie.rating >= 8 ? 'bg-green-500' : 'bg-yellow-500'}`} title={`评分: ${movie.rating}`} />
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm" title={movie.title}>{movie.title}</h4>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                {movie.season && <span className="text-[10px] text-orange-600 dark:text-orange-400 font-mono bg-orange-100 dark:bg-orange-900/30 px-1 rounded">S{movie.season}</span>}
                                                {movie.episodes && movie.episodes > 1 && <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono bg-cyan-100 dark:bg-cyan-900/30 px-1 rounded">{movie.episodes}集</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-1">{movie.director && <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" title="导演"><User size={12} className="text-blue-500" /><span className="truncate">{movie.director}</span></div>}{movie.actors && movie.actors.length > 0 && <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-500" title="主演"><Users size={12} className="mt-0.5 shrink-0" /><span className="line-clamp-1">{movie.actors.join(' / ')}</span></div>}</div>
                                        {movie.tags && movie.tags.length > 0 && <div className="flex flex-wrap gap-1 pt-1">{movie.tags.slice(0, 3).map((tag, i) => <span key={i} className="text-[10px] bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">{tag}</span>)}</div>}
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-slate-800 mt-auto">
                                        <div className="flex gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingMovie(movie); setIsModalOpen(true); }} className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-xs flex items-center gap-1.5 transition py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800"><Edit2 size={14} /> 编辑</button>
                                            <button onClick={(e) => { e.stopPropagation(); setAddingToCollectionMovie(movie); }} className="text-slate-500 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 text-xs flex items-center gap-1.5 transition py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800"><Folder size={14} /> 收藏</button>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setMovieToDelete(movie); }} className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-xs flex items-center gap-1.5 transition py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800"><Trash2 size={14} /> 删除</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {isModalOpen && <AddEditModal onClose={() => setIsModalOpen(false)} onSave={handleSave} editingMovie={editingMovie} appSettings={appSettings} />}
            {movieToDelete && <DeleteConfirmModal movie={movieToDelete} onClose={() => setMovieToDelete(null)} onConfirm={handleDelete} />}
            {addingToCollectionMovie && <AddToCollectionModal movie={addingToCollectionMovie} onClose={() => setAddingToCollectionMovie(null)} />}
        </div >
    );
}
