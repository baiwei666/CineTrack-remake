import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, Film } from 'lucide-react';
import { MovieRecord } from '../types';

interface RelatedMoviesProps {
    currentMovie: MovieRecord;
    allMovies: MovieRecord[];
}

export default function RelatedMovies({ currentMovie, allMovies }: RelatedMoviesProps) {
    const related = useMemo(() => {
        if (!currentMovie || !allMovies) return [];

        const scoredMovies = allMovies.filter(m => m.id !== currentMovie.id).map(m => {
            let score = 0;
            // Same Director: High weight
            if (currentMovie.director && m.director === currentMovie.director) score += 10;

            // Common Actors: Medium weight
            const commonActors = m.actors?.filter(a => currentMovie.actors?.includes(a));
            if (commonActors?.length) score += commonActors.length * 3;

            // Common Tags: Low weight
            const commonTags = m.tags?.filter(t => currentMovie.tags?.includes(t));
            if (commonTags?.length) score += commonTags.length * 1;

            // Same Type
            if (m.type === currentMovie.type) score += 1;

            return { ...m, score };
        });

        return scoredMovies.filter(m => m.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
    }, [currentMovie, allMovies]);

    if (related.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Film size={20} className="text-blue-500" /> 猜你喜欢
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {related.map(m => (
                    <Link key={m.id} to={`/movie/${m.id}`} className="group block h-full">
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800 shadow-sm transition hover:shadow-md hover:-translate-y-1">
                            {m.coverUrl ? (
                                <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Film size={20} /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 p-2 flex flex-col justify-end">
                                <span className="text-white font-bold text-xs line-clamp-2 leading-tight">{m.title}</span>
                                <div className="flex items-center gap-1 text-yellow-400 text-[10px] mt-1">
                                    <Star size={8} fill="currentColor" /> {m.rating}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
