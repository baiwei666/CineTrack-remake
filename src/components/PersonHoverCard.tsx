import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Film, Star } from 'lucide-react';
import { useData } from '../context/DataContext';

interface PersonHoverCardProps {
    name: string;
    role: 'director' | 'actor';
    currentMovieId: string;
}

export default function PersonHoverCard({ name, role, currentMovieId }: PersonHoverCardProps) {
    const { movies } = useData();
    const [isHovered, setIsHovered] = useState(false);
    const triggerRef = useRef<HTMLSpanElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    // Find related movies in local library
    const related = movies.filter(m => {
        if (m.id === currentMovieId) return false;
        if (role === 'director' && m.director === name) return true;
        if (role === 'actor' && m.actors?.includes(name)) return true;
        return false;
    });

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY, // Position based on document
                left: rect.left + window.scrollX + (rect.width / 2) // Center horizontally
            });
        }
    };

    useEffect(() => {
        if (isHovered) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isHovered]);

    if (!name) return <span className="text-slate-400">未知</span>;

    const tooltipContent = (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
                top: coords.top,
                left: coords.left,
                position: 'absolute',
                zIndex: 9999, // Ensure it's on top of everything
            }}
            className="absolute -translate-x-1/2 -translate-y-full mt-[-8px] pointer-events-auto" // Adjust placement to be above trigger
        >
            <div className="w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-3 relative">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 px-1 flex justify-between uppercase tracking-wider">
                    <span>{role === 'director' ? '执导作品' : '出演作品'} ({related.length})</span>
                </div>

                {related.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 pr-1">
                        {related.map(m => (
                            <Link
                                key={m.id}
                                to={`/movie/${m.id}`}
                                className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group"
                            >
                                <div className="w-10 h-14 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden shrink-0">
                                    {m.coverUrl ? (
                                        <img src={m.coverUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <Film className="w-4 h-4 text-slate-400 m-auto mt-5" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-500 transition">
                                        {m.title}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{m.year}</span>
                                        <span className="flex items-center gap-0.5 text-yellow-500"><Star size={10} fill="currentColor" /> {m.rating}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-xs text-slate-400 p-2 text-center italic">
                        库中暂无其他相关作品
                    </div>
                )}

                {/* Box Arrow (Visual Only) */}
                <div className="absolute left-1/2 -ml-2 -bottom-2 w-4 h-4 bg-white dark:bg-slate-800 border-r border-b border-gray-100 dark:border-slate-700 rotate-45 transform" />
            </div>
        </motion.div>
    );

    return (
        <>
            <span
                ref={triggerRef}
                className="font-medium text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-500 hover:underline decoration-blue-500/30 underline-offset-4 transition-colors inline-block"
                onMouseEnter={() => {
                    updatePosition();
                    setIsHovered(true);
                }}
                onMouseLeave={() => setIsHovered(false)}
            >
                {name}
            </span>
            {createPortal(
                <AnimatePresence>
                    {isHovered && tooltipContent}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
