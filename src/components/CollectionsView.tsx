import React, { useState } from 'react';
import { Folder, Plus, MoreVertical, Trash2, Edit2, Film, Calendar, Wand2, Sparkles } from 'lucide-react';
import { Collection } from '../types';
import { useData } from '../context/DataContext';
import SmartCollectionModal from './SmartCollectionModal';
import EditCollectionModal from './EditCollectionModal';

interface CollectionsViewProps {
    onSelectCollection: (collection: Collection) => void;
}

export default function CollectionsView({ onSelectCollection }: CollectionsViewProps) {
    const { collections, setCollections, movies } = useData();
    const [isCreating, setIsCreating] = useState(false);
    const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
    const [smartMode, setSmartMode] = useState<'AI' | 'Local'>('Local');
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [newCollectionName, setNewCollectionName] = useState('');

    const handleCreate = () => {
        if (!newCollectionName.trim()) return;

        const newCollection: Collection = {
            id: Date.now().toString(),
            name: newCollectionName,
            movieIds: [],
            createdAt: new Date().toISOString()
        };

        setCollections(prev => [...prev, newCollection]);
        setNewCollectionName('');
        setIsCreating(false);
    };

    const handleDelete = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('确定要删除这个收藏夹吗？(不会删除里面的影片)')) {
            setCollections(prev => prev.filter(c => c.id !== id));
            if (editingCollection?.id === id) setEditingCollection(null);
        }
    };

    const handleUpdate = (updated: Collection) => {
        setCollections(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingCollection(null);
    };

    const getCollectionStats = (item: Collection) => {
        const count = item.movieIds.length;
        // Find covers from first few movies, OR use custom cover if set
        const collectionMovies = movies.filter(m => item.movieIds.includes(m.id));

        let covers: string[] = [];
        if (item.coverUrl) {
            covers = [item.coverUrl];
            // Add a couple more for the stack effect if available
            const extra = collectionMovies
                .filter(m => m.coverUrl && m.coverUrl !== item.coverUrl)
                .map(m => m.coverUrl)
                .slice(0, 2);
            covers.push(...extra);
        } else {
            covers = collectionMovies.map(m => m.coverUrl).filter(Boolean).slice(0, 3);
        }

        const latestDate = collectionMovies.length > 0
            ? new Date(Math.max(...collectionMovies.map(m => new Date(m.watchDate).getTime()))).toISOString().split('T')[0]
            : item.createdAt.split('T')[0];

        return { count, covers, latestDate };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">我的合集</h2>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">{collections.length}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setSmartMode('AI'); setIsSmartModalOpen(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-purple-600/20 transition hover:-translate-y-0.5"
                        title="使用 AI 深度分析（可能需要较长时间）"
                    >
                        <Wand2 size={18} /> AI 智能整理
                    </button>
                    <button
                        onClick={() => { setSmartMode('Local'); setIsSmartModalOpen(true); }}
                        className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5"
                        title="基于规则快速整理"
                    >
                        <Sparkles size={18} /> 本地快速整理
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5"
                    >
                        <Plus size={18} /> 新建合集
                    </button>
                </div>
            </div>

            {/* Create Input */}
            {isCreating && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-blue-500/50 shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Folder size={24} />
                    </div>
                    <input
                        autoFocus
                        type="text"
                        placeholder="输入收藏夹名称..."
                        className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-bold"
                        value={newCollectionName}
                        onChange={e => setNewCollectionName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm">取消</button>
                        <button onClick={handleCreate} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md">创建</button>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {collections.map(collection => {
                    const stats = getCollectionStats(collection);

                    return (
                        <div
                            key={collection.id}
                            onClick={() => onSelectCollection(collection)}
                            className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-900/5 transition duration-300 relative overflow-hidden"
                        >
                            {/* Covers Stack */}
                            <div className="flex -space-x-4 mb-4 items-center justify-center h-48 bg-gray-50 dark:bg-slate-950/50 rounded-xl overflow-hidden relative">
                                {stats.covers.length > 0 ? (
                                    stats.covers.map((url, idx) => (
                                        <div key={idx} className="w-24 h-36 rounded-lg shadow-lg border-2 border-white dark:border-slate-900 overflow-hidden transform group-hover:scale-105 transition duration-500" style={{ zIndex: idx }}>
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    ))
                                ) : (
                                    <Folder size={64} className="text-slate-200 dark:text-slate-800" />
                                )}
                            </div>

                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0 pr-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 transition truncate">{collection.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                        <span className="flex items-center gap-1"><Film size={12} /> {stats.count} 部</span>
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {stats.latestDate}</span>
                                    </div>
                                </div>

                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition translate-x-2 group-hover:translate-x-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingCollection(collection); }}
                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                        title="编辑"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(collection.id, e)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                        title="删除"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State */}
                {collections.length === 0 && !isCreating && (
                    <div
                        onClick={() => setIsCreating(true)}
                        className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-slate-400 gap-4 cursor-pointer hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition group"
                    >
                        <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition">
                            <Plus size={32} />
                        </div>
                        <p className="font-bold">创建一个新收藏夹</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isSmartModalOpen && (
                <SmartCollectionModal
                    mode={smartMode}
                    onClose={() => setIsSmartModalOpen(false)}
                    onConfirm={(groups) => {
                        const newCols = groups.map(g => ({
                            id: Date.now().toString() + Math.random().toString().slice(2, 6),
                            name: g.name,
                            description: g.description,
                            movieIds: g.ids,
                            createdAt: new Date().toISOString()
                        }));
                        setCollections(prev => [...prev, ...newCols]);
                        setIsSmartModalOpen(false);
                    }}
                />
            )}

            {editingCollection && (
                <EditCollectionModal
                    collection={editingCollection}
                    onClose={() => setEditingCollection(null)}
                    onSave={handleUpdate}
                    onDelete={() => handleDelete(editingCollection.id)}
                />
            )}
        </div>
    );
}
