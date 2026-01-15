import React, { useState } from 'react';
import { X, Folder, Plus, Check } from 'lucide-react';
import { useData } from '../context/DataContext';
import { MovieRecord, Collection } from '../types';

interface AddToCollectionModalProps {
    movie: MovieRecord;
    onClose: () => void;
}

export default function AddToCollectionModal({ movie, onClose }: AddToCollectionModalProps) {
    const { collections, setCollections } = useData();
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const toggleCollection = (collectionId: string) => {
        setCollections(prev => prev.map(c => {
            if (c.id === collectionId) {
                const exists = c.movieIds.includes(movie.id);
                return {
                    ...c,
                    movieIds: exists
                        ? c.movieIds.filter(id => id !== movie.id)
                        : [...c.movieIds, movie.id]
                };
            }
            return c;
        }));
    };

    const handleCreate = () => {
        if (!newCollectionName.trim()) return;
        const newCollection: Collection = {
            id: Date.now().toString(),
            name: newCollectionName,
            movieIds: [movie.id], // Auto add current movie
            createdAt: new Date().toISOString()
        };
        setCollections(prev => [...prev, newCollection]);
        setNewCollectionName('');
        setIsCreating(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Folder size={18} className="text-blue-500" /> 添加到收藏
                    </h3>
                    <button onClick={onClose}><X size={18} className="text-slate-400 hover:text-slate-800 dark:hover:text-white" /></button>
                </div>

                <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
                    {collections.map(c => {
                        const isAdded = c.movieIds.includes(movie.id);
                        return (
                            <div
                                key={c.id}
                                onClick={() => toggleCollection(c.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${isAdded ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Folder size={18} className={isAdded ? 'text-blue-500' : 'text-slate-400'} />
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${isAdded ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{c.name}</span>
                                        <span className="text-xs text-slate-400">{c.movieIds.length} 部</span>
                                    </div>
                                </div>
                                {isAdded && <div className="bg-blue-500 text-white rounded-full p-0.5"><Check size={12} /></div>}
                            </div>
                        );
                    })}

                    {collections.length === 0 && !isCreating && (
                        <div className="text-center text-slate-400 py-4 text-sm">暂无收藏夹</div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                    {isCreating ? (
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                className="flex-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                                placeholder="收藏夹名称..."
                                value={newCollectionName}
                                onChange={e => setNewCollectionName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            />
                            <button onClick={handleCreate} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-bold">创建</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-500 transition text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> 新建收藏夹
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
