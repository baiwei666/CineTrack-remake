import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface EpisodeHoverCardProps {
    children: React.ReactNode;
    episode: {
        name: string;
        overview: string;
        episode_number: number;
        air_date?: string;
    };
    className?: string; // Allow passing styles to the wrapper
}

export default function EpisodeHoverCard({ children, episode, className }: EpisodeHoverCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout>();
    const [coords, setCoords] = useState({ top: 0, left: 0, arrowOffset: 0 });

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const margin = 16;
            const tooltipWidth = 320; // w-80 = 20rem = 320px

            // Calculate center point relative to viewport
            const triggerCenter = rect.left + (rect.width / 2);

            // Calculate ideal left position (centered)
            let leftVueport = triggerCenter - (tooltipWidth / 2);

            // Clamp to viewport
            if (leftVueport < margin) {
                leftVueport = margin;
            } else if (leftVueport + tooltipWidth > window.innerWidth - margin) {
                leftVueport = window.innerWidth - tooltipWidth - margin;
            }

            // Calculate arrow offset relative to the tooltip's new left edge
            // We want the arrow center to align with the trigger center
            const arrowOffset = triggerCenter - leftVueport;

            setCoords({
                top: rect.top + window.scrollY,
                left: leftVueport + window.scrollX,
                arrowOffset
            });
        }
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        updatePosition();
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsHovered(false);
        }, 150); // Small delay to allow bridging
    };

    useEffect(() => {
        if (isHovered) {
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isHovered]);

    const tooltipContent = (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 4, scale: 0.96, filter: "blur(2px)" }}
            transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                mass: 0.8
            }}
            style={{
                top: coords.top,
                left: coords.left,
                position: 'absolute',
                zIndex: 9999,
            }}
            className="absolute mt-[-12px] pointer-events-none -translate-y-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-4 relative pointer-events-auto transform-gpu">
                <div className="text-sm font-bold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
                    <span className="mr-2">第 {episode.episode_number} 集</span>
                    {episode.name}
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700 pr-1">
                    {episode.overview || '暂无简介'}
                </div>

                {episode.air_date && (
                    <div className="mt-3 pt-2 text-xs text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-end">
                        首播: {episode.air_date}
                    </div>
                )}

                {/* Box Arrow */}
                <div
                    className="absolute -bottom-2 w-4 h-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-r border-b border-white/20 dark:border-slate-700/50 rotate-45 transform"
                    style={{ left: coords.arrowOffset - 8 }} // -8 to center the 16px arrow
                />
            </div>
        </motion.div>
    );

    return (
        <>
            <div
                ref={triggerRef}
                className={className}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            {createPortal(
                <AnimatePresence>
                    {isHovered && tooltipContent}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
