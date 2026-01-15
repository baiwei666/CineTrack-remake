import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, CheckCircle, Clock, Plus } from 'lucide-react';
import { MovieRecord, WatchStatus } from '../types';
import { useData } from '../context/DataContext';

interface WatchControlsProps {
    movie: MovieRecord;
    onUpdate: (updatedMovie: MovieRecord) => void;
}

export default function WatchControls({ movie, onUpdate }: WatchControlsProps) {
    const [status, setStatus] = useState<WatchStatus>(movie.status || 'plan');
    const [progress, setProgress] = useState<number>(movie.progress || 0);

    // Initial sync
    useEffect(() => {
        if (movie.status) setStatus(movie.status);
        if (movie.progress) setProgress(movie.progress);
    }, [movie]);

    const handleStatusChange = (newStatus: WatchStatus) => {
        setStatus(newStatus);
        const updated = { ...movie, status: newStatus };

        // If completing, auto-fill watch date if empty
        if (newStatus === 'completed' && !movie.watchDate) {
            updated.watchDate = new Date().toISOString().split('T')[0];
            updated.progress = movie.type === 'Movie' ? (movie.duration || 0) : (movie.episodes || 1);
        }

        onUpdate(updated);
    };

    const handleEpisodeIncrement = () => {
        const current = progress || 0;
        const total = movie.episodes || 1;
        if (current < total) {
            const newProgress = current + 1;
            setProgress(newProgress);
            const isFinished = newProgress >= total;

            const updated = {
                ...movie,
                progress: newProgress,
                status: isFinished ? 'completed' : 'watching'
            } as MovieRecord;

            if (isFinished && !movie.watchDate) {
                updated.watchDate = new Date().toISOString().split('T')[0];
            }

            onUpdate(updated);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const statusColors = {
        plan: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
        watching: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        completed: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        dropped: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };

    const statusLabels = {
        plan: '想看',
        watching: '在看',
        completed: '看过',
        dropped: '弃坑',
    };

    return (
        <div className="bg-white/10 dark:bg-slate-900/10 rounded-2xl p-2 space-y-4">
            {/* Status Grid */}
            <div className="grid grid-cols-4 gap-2">
                {(['plan', 'watching', 'completed', 'dropped'] as WatchStatus[]).map((s) => {
                    const isActive = status === s;

                    // Style config
                    let activeClass = '';
                    let icon = null;
                    let label = '';

                    switch (s) {
                        case 'plan':
                            activeClass = 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 ring-2 ring-blue-500';
                            icon = <Clock size={18} />;
                            label = '想看';
                            break;
                        case 'watching':
                            activeClass = 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400 ring-2 ring-purple-500';
                            icon = <Play size={18} />;
                            label = '在看';
                            break;
                        case 'completed':
                            activeClass = 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 ring-2 ring-green-500';
                            icon = <CheckCircle size={18} />;
                            label = '看过';
                            break;
                        case 'dropped':
                            activeClass = 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 ring-2 ring-red-500';
                            icon = <Square size={18} />;
                            label = '弃坑';
                            break;
                    }

                    return (
                        <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all duration-300 ${isActive ? activeClass : 'bg-white/5 dark:bg-slate-800/50 text-slate-500 hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-300 hover:scale-105'}`}
                        >
                            <div className={isActive ? 'scale-110 transition' : ''}>{icon}</div>
                            <span className="text-xs font-bold">{label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Series/Anime Episode Control (Only for Series/Anime when Watching) */}
            {movie.type !== 'Movie' && status === 'watching' && (
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-3 flex items-center justify-between border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-bold uppercase">当前进度</span>
                            <span className="text-lg font-black text-slate-800 dark:text-white">
                                第 {progress} <span className="text-sm font-medium text-slate-400">/ {movie.episodes || '?'} 集</span>
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleEpisodeIncrement}
                        disabled={progress >= (movie.episodes || 999)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-purple-600/20 transition disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                    >
                        <Plus size={18} /> 看完一集
                    </button>
                </div>
            )}
        </div>
    );
}
