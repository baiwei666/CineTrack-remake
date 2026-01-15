import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { MovieRecord, AppSettings, AiAnalysisResult, FilterState } from '../types';
import { MOCK_DB } from '../constants';
import { generateId, db } from '../utils';

interface DataContextType {
    movies: MovieRecord[];
    setMovies: React.Dispatch<React.SetStateAction<MovieRecord[]>>;
    appSettings: AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    stats: any;
    isLoaded: boolean;
    saveSettings: (s: AppSettings) => void;
    clearAllData: () => void;
    collections: any[];
    setCollections: React.Dispatch<React.SetStateAction<any[]>>;
    // Shared UI state specific to data manipulation can go here or local
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [movies, setMovies] = useState<MovieRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [appSettings, setAppSettings] = useState<AppSettings>({
        tmdbApiKey: '',
        aiProvider: 'Mock',
        aiApiKey: '',
        aiModel: 'gpt-3.5-turbo'
    });
    const [collections, setCollections] = useState<any[]>([]);

    // Init Data
    useEffect(() => {
        const initApp = async () => {
            try {
                await db.init();
                const savedSettings = await db.getAppSettings();
                if (savedSettings) setAppSettings(savedSettings);

                const hasRunBefore = localStorage.getItem('cinetrack_has_run');
                const savedMovies = await db.getMovies();

                if (hasRunBefore) {
                    setMovies(Array.isArray(savedMovies) ? savedMovies : []);
                } else {
                    if (Array.isArray(savedMovies)) {
                        setMovies(savedMovies);
                    } else {
                        // If we expected data but got none, tread carefully.
                        // Only init mock if we confirm it's a first run (handled by hasRunBefore)
                        // But here hasRunBefore is FALSE.

                        const mockWithIds = MOCK_DB.map(m => ({ ...m, id: generateId() })) as MovieRecord[];
                        setMovies(mockWithIds);
                        // Don't auto-save immediately to disk in case of race conditions, 
                        // let the effect handle it or wait for user interaction?
                        // Actually, for first run, saving mock is fine.
                        await db.saveMovies(mockWithIds);
                    }
                    localStorage.setItem('cinetrack_has_run', 'true');
                }

                // Load Collections
                const savedCollections = localStorage.getItem('cinetrack_collections');
                if (savedCollections) {
                    setCollections(JSON.parse(savedCollections));
                }
            } catch (e) {
                console.error("Critical Init error:", e);
            } finally {
                setIsLoaded(true);
            }
        };
        initApp();
    }, []);

    // Persistence Effects
    useEffect(() => { if (isLoaded) db.saveMovies(movies); }, [movies, isLoaded]);
    useEffect(() => { if (isLoaded) db.saveAppSettings(appSettings); }, [appSettings, isLoaded]);
    useEffect(() => { if (isLoaded) localStorage.setItem('cinetrack_collections', JSON.stringify(collections)); }, [collections, isLoaded]);

    const saveSettings = (newSettings: AppSettings) => {
        setAppSettings(newSettings);
    };

    const clearAllData = async () => {
        try {
            // Explicitly wipe Disk Data first
            await db.saveMovies([]);
            await db.saveAppSettings({ tmdbApiKey: '', aiProvider: 'Mock', aiModel: 'gpt-3.5-turbo' } as AppSettings);

            // Clear State
            setMovies([]);
            setCollections([]);
            setAppSettings({ tmdbApiKey: '', aiProvider: 'Mock', aiModel: 'gpt-3.5-turbo', savedViews: [] });

            // Clear LocalStorage
            localStorage.clear();
            localStorage.setItem('cinetrack_has_run', 'true'); // Prevent mock data regeneration

            alert("所有数据已清空。应用将重启。");
            window.location.reload();
        } catch (e) {
            console.error("Failed to clear data:", e);
            alert("清空数据失败，请手动删除数据文件。");
        }
    };

    // Stats Logic (Moved from App.tsx)
    const stats = useMemo(() => {
        const total = movies.length;
        const avgRating = total > 0 ? (movies.reduce((acc, cur) => acc + cur.rating, 0) / total).toFixed(1) : '0.0';
        const typeCount: Record<string, number> = {};
        const tagCount: Record<string, number> = {};
        const dayCount = Array(7).fill(0);
        const ratingDist = Array(11).fill(0);
        const directorCount: Record<string, number> = {};
        const actorCount: Record<string, number> = {};

        const totalDuration = movies.reduce((acc, m) => {
            const episodes = m.episodes || 1;
            const duration = m.duration || 0;
            const itemTotal = m.type === 'Movie' ? duration : duration * episodes;
            return acc + itemTotal;
        }, 0);

        movies.forEach(m => {
            typeCount[m.type] = (typeCount[m.type] || 0) + 1;
            m.tags?.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1);
            ratingDist[Math.round(m.rating)]++;
            if (m.director) directorCount[m.director] = (directorCount[m.director] || 0) + 1;
            m.actors?.forEach(a => actorCount[a] = (actorCount[a] || 0) + 1);

            const day = new Date(m.watchDate).getDay();
            if (!isNaN(day)) dayCount[day]++;
        });

        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return d.toISOString().slice(0, 7);
        }).reverse();

        const trendData = last6Months.map(month => movies.filter(m => m.watchDate?.startsWith(month)).length);

        const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topDirectors = Object.entries(directorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topActors = Object.entries(actorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const genreData = topTags.map(([label, value]) => ({ label, value }));

        const typeChartData = [
            { label: 'Movie', value: typeCount['Movie'] || 0, color: '#3b82f6' },
            { label: 'Series', value: typeCount['Series'] || 0, color: '#8b5cf6' },
            { label: 'Anime', value: typeCount['Anime'] || 0, color: '#ec4899' },
            { label: 'Documentary', value: typeCount['Documentary'] || 0, color: '#10b981' }
        ].filter(d => d.value > 0);

        const recentMovies = [...movies].sort((a, b) => new Date(b.watchDate).getTime() - new Date(a.watchDate).getTime()).slice(0, 4);

        return {
            total, avgRating, typeCount, trendData, labels: last6Months,
            topTags, totalDuration, ratingDist, topDirectors, topActors,
            typeChartData, dayCount, genreData, recentMovies
        };
    }, [movies]);

    return (
        <DataContext.Provider value={{ movies, setMovies, appSettings, setAppSettings, saveSettings, isLoaded, stats, clearAllData, collections, setCollections }}>
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
