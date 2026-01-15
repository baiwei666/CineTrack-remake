import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Calendar, Clock, Layers, Film, Quote,
    User, Users, Hash, ImageIcon, PenLine, Save, PlayCircle
} from 'lucide-react';
import WatchControls from '../components/WatchControls';
import RelatedMovies from '../components/RelatedMovies';
import { useData } from '../context/DataContext';
import StarRating from '../components/StarRating';
import { formatDate } from '../utils';
import { MovieRecord } from '../types';
import { getTMDBDetails, getTMDBSeasonDetails } from '../services/tmdb';

import PersonHoverCard from '../components/PersonHoverCard';

export default function MovieDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { movies, setMovies, appSettings } = useData();
    const movie = movies.find(m => m.id === id);

    // Context for global background
    const { setGlobalBackground } = useOutletContext<{ setGlobalBackground: (url: string | null) => void }>();
    const [imageLoaded, setImageLoaded] = useState(false);

    // Local state for editing thoughts
    const [thought, setThought] = useState('');
    const [isEditingThought, setIsEditingThought] = useState(false);

    // Initialize thought from overview (per data swap fix)
    useEffect(() => {
        if (movie) {
            setThought(movie.overview || '');
        }
    }, [movie]);

    // Fetch Extra TMDB Data (Images & Seasons)
    useEffect(() => {
        if (!movie || !movie.tmdbId || !appSettings.tmdbApiKey) return;

        const fetchExtraData = async () => {
            let updates: Partial<MovieRecord> = {};
            let hasUpdates = false;

            // 1. Fetch Images if missing
            if (!movie.images || movie.images.length === 0) {
                const details = await getTMDBDetails(movie.tmdbId!, movie.type === 'Movie' ? 'movie' : 'tv', appSettings.tmdbApiKey);
                if (details?.images && details.images.length > 0) {
                    updates.images = details.images;
                    hasUpdates = true;
                }
            }

            // 2. Fetch Season Details if Series and missing
            if (movie.type !== 'Movie' && (!movie.seasons || movie.seasons.length === 0)) {
                // Default to current season tracked or Season 1
                const targetSeason = movie.season || 1;
                const seasonData = await getTMDBSeasonDetails(movie.tmdbId!, targetSeason, appSettings.tmdbApiKey);
                if (seasonData) {
                    updates.seasons = [seasonData];
                    hasUpdates = true;
                }
            }

            if (hasUpdates) {
                handleUpdateMovie({ ...movie, ...updates });
            }
        };

        fetchExtraData();
    }, [movie?.id, movie?.tmdbId, appSettings.tmdbApiKey]);

    // Global Background Effect
    useEffect(() => {
        if (movie?.coverUrl) {
            setGlobalBackground(movie.coverUrl);
        }
        return () => setGlobalBackground(null);
    }, [movie, setGlobalBackground]);

    // Update Movie Handler
    const handleUpdateMovie = (updatedMovie: MovieRecord) => {
        setMovies(prev => prev.map(m => m.id === updatedMovie.id ? updatedMovie : m));
    };

    const saveThought = () => {
        if (!movie) return;
        // Update overview with the thought (per data swap fix)
        // We leave review/comment alone as they hold the Plot currently
        const updated = { ...movie, overview: thought };
        handleUpdateMovie(updated);
        setIsEditingThought(false);
    };

    if (!movie) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <h2 className="text-2xl font-bold mb-4">未找到该影片</h2>
                <button onClick={() => navigate('/library')} className="text-blue-500 hover:underline">返回列表</button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-full rounded-3xl p-6 lg:p-10 shadow-sm bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm border border-white/10"
        >
            <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white/10 backdrop-blur-md rounded-full text-slate-700 dark:text-slate-200 hover:bg-white/20 transition z-20 shadow-sm border border-white/10">
                <ArrowLeft size={24} />
            </button>

            <div className="relative z-10 flex flex-col lg:flex-row gap-8 xl:gap-12 max-w-7xl mx-auto mt-8">
                {/* Left: Poster & Watch Controls */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="w-full lg:w-1/3 xl:w-1/4 shrink-0 flex flex-col gap-6"
                >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/20 group hover:shadow-3xl hover:shadow-black/40 transition duration-500">
                        <img
                            src={movie.coverUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => { e.currentTarget.src = ''; }}
                        />
                        {!imageLoaded && !movie.coverUrl && (
                            <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Film size={60} />
                            </div>
                        )}
                    </div>

                    {/* Integrated Watch Controls */}
                    <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
                        <WatchControls movie={movie} onUpdate={handleUpdateMovie} />
                    </div>
                </motion.div>

                {/* Right: Info & Sections */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="flex-1 min-w-0 space-y-8"
                >
                    {/* Header */}
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-white/20 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 shadow-sm">{movie.type}</span>
                            {movie.year && <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-white/20 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">{movie.year}</span>}
                            {movie.tags?.slice(0, 3).map(tag => (
                                <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-transparent border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                                    <Hash size={10} /> {tag}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-4 tracking-tight drop-shadow-lg">
                            {movie.title}
                        </h1>
                        {movie.originalTitle && <h2 className="text-xl text-slate-500 font-light mb-6">{movie.originalTitle}</h2>}

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <span className="text-4xl font-bold text-yellow-500">{movie.rating}</span>
                                <span className="text-sm text-slate-400">/10</span>
                                <StarRating rating={movie.rating} size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-200 dark:border-slate-800/50">
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> 观看日期</span>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{formatDate(movie.watchDate)}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12} /> 时长</span>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{movie.duration ? `${movie.duration} 分钟` : '未知'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><User size={12} /> 导演</span>
                            <div className="font-medium text-slate-800 dark:text-slate-200 relative">
                                <PersonHoverCard name={movie.director || ''} role="director" currentMovieId={movie.id} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={12} /> 主演</span>
                            <div className="font-medium text-slate-800 dark:text-slate-200 flex flex-wrap gap-x-3 gap-y-1">
                                {movie.actors && movie.actors.length > 0 ? (
                                    movie.actors.map((actor) => (
                                        <PersonHoverCard key={actor} name={actor} role="actor" currentMovieId={movie.id} />
                                    ))
                                ) : '未知'}
                            </div>
                        </div>
                    </div>

                    {/* Content Overview (Plot) - Swapped per user request */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Film size={20} className="text-blue-500" /> 内容简介
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {movie.review || movie.comment || '暂无简介...'}
                        </p>
                    </div>

                    {/* Thoughts & Memories (Editable) - Swapped per user request */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Quote size={20} className="text-purple-500" /> 心得回忆
                            </h3>
                            <button
                                onClick={() => isEditingThought ? saveThought() : setIsEditingThought(true)}
                                className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-500 transition"
                            >
                                {isEditingThought ? <><Save size={14} /> 保存</> : <><PenLine size={14} /> 编辑</>}
                            </button>
                        </div>

                        {isEditingThought ? (
                            <textarea
                                value={thought}
                                onChange={(e) => setThought(e.target.value)}
                                className="w-full h-32 bg-white/50 dark:bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-inner resize-none font-serif text-slate-700 dark:text-slate-300"
                                placeholder="写下您的观影感受..."
                            />
                        ) : (
                            <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-white/40 dark:border-slate-700/30 shadow-sm relative group">
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-serif text-lg">
                                    {movie.overview || <span className="italic text-slate-400">暂无心得...</span>}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stills/Images (Scrollable) */}
                    {movie.images && movie.images.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ImageIcon size={20} className="text-pink-500" /> 剧照/海报
                            </h3>
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700">
                                {movie.images.map((img, idx) => (
                                    <div key={idx} className="shrink-0 w-64 aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm snap-start">
                                        <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition duration-500 cursor-pointer" loading="lazy" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Episodes List (For Series) */}
                    {movie.type !== 'Movie' && movie.seasons && movie.seasons.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Layers size={20} className="text-indigo-500" /> 分集剧情
                            </h3>
                            <div className="space-y-6">
                                {movie.seasons.map(season => (
                                    <div key={season.season_number} className="bg-white/40 dark:bg-slate-800/40 rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
                                        <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            {season.poster_path && <img src={season.poster_path} className="w-8 h-12 object-cover rounded shadow-sm" />}
                                            {season.name}
                                            <span className="text-xs text-slate-500 font-normal bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{season.episodes.length} 集</span>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {season.episodes.map(ep => (
                                                <div key={ep.episode_number} className="flex gap-4 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group">
                                                    <div className="shrink-0 w-32 aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                                                        {ep.still_path ? (
                                                            <img src={ep.still_path} className="w-full h-full object-cover" loading="lazy" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><Film size={20} /></div>
                                                        )}
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                            <PlayCircle className="text-white drop-shadow-md" size={24} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0 py-1">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h5 className="font-bold text-slate-800 dark:text-slate-200 truncate pr-2" title={ep.name}>
                                                                {ep.episode_number}. {ep.name}
                                                            </h5>
                                                            {ep.runtime && <span className="text-xs text-slate-400 shrink-0">{ep.runtime}m</span>}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                            {ep.overview || '暂无简介'}
                                                        </p>
                                                        <div className="mt-2 text-[10px] text-slate-400">
                                                            {ep.air_date ? formatDate(ep.air_date) : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Related Recommendations */}
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                        <RelatedMovies currentMovie={movie} allMovies={movies} />
                    </div>

                </motion.div>
            </div>
        </motion.div>
    );
}
