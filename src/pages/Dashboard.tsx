import React, { useState, useMemo } from 'react';
import {
    Film, Star, Clock, Tag, TrendingUp, BarChart3, PieChart, Activity,
    Award, History, Hash, User, Users, Calendar, LayoutGrid, List
} from 'lucide-react';
import DonutChart from '../components/DonutChart';
import YearlyHeatmap from '../components/YearlyHeatmap';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils';

export default function Dashboard() {
    const { stats, movies } = useData();
    const [activeTab, setActiveTab] = useState<'overview' | 'year'>('overview');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // --- Yearly Logic (Ported from Reports.tsx) ---
    const availableYears = useMemo(() => {
        const years = new Set(movies.map(m => new Date(m.watchDate).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [movies]);

    const yearData = useMemo(() => {
        return movies.filter(m => new Date(m.watchDate).getFullYear() === selectedYear);
    }, [movies, selectedYear]);

    const yearStats = useMemo(() => {
        const total = yearData.length;
        const totalDuration = yearData.reduce((acc, m) => acc + (m.duration || 0) * (m.episodes || 1), 0);
        const avgRating = total > 0 ? (yearData.reduce((acc, m) => acc + m.rating, 0) / total).toFixed(1) : '0.0';

        // Monthly Trend
        const monthlyCounts = Array(12).fill(0);
        yearData.forEach(m => monthlyCounts[new Date(m.watchDate).getMonth()]++);

        // Type Distribution
        const typeCount: Record<string, number> = {};
        yearData.forEach(m => typeCount[m.type] = (typeCount[m.type] || 0) + 1);
        const typeChartData = [
            { label: 'Movie', value: typeCount['Movie'] || 0, color: '#3b82f6' },
            { label: 'Series', value: typeCount['Series'] || 0, color: '#8b5cf6' },
            { label: 'Anime', value: typeCount['Anime'] || 0, color: '#ec4899' },
            { label: 'Doc', value: typeCount['Documentary'] || 0, color: '#10b981' }
        ].filter(d => d.value > 0);

        // Daily Heatmap
        const dayCounts: Record<string, number> = {};
        yearData.forEach(m => dayCounts[m.watchDate] = (dayCounts[m.watchDate] || 0) + 1);

        return { total, totalDuration, avgRating, monthlyCounts, typeChartData, dayCounts };
    }, [yearData]);


    if (!stats) return <div>Loading...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">数据仪表盘</h1>
                    <p className="text-slate-500 dark:text-slate-400">您的观影足迹全景分析</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <LayoutGrid size={16} /> 总览
                    </button>
                    <button
                        onClick={() => setActiveTab('year')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'year' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Calendar size={16} /> 年度回顾
                    </button>
                </div>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* 1. Key Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={<Film />} label="总观影" value={stats.total} sub="部" color="blue" />
                        <StatCard icon={<Star />} label="平均分" value={stats.avgRating} sub="/ 10" color="yellow" />
                        <StatCard icon={<Clock />} label="总时长" value={Math.round(stats.totalDuration / 60)} sub="小时" color="purple" />
                        <StatCard icon={<Tag />} label="最爱标签" value={stats.topTags[0]?.[0] || '-'} sub="Top 1" color="pink" />
                    </div>

                    {/* 2. Recent Movies (NEW) */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><History size={18} /> 最近观看</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.recentMovies?.map((m: any) => (
                                <Link key={m.id} to={`/movie/${m.id}`} className="group block relative rounded-xl overflow-hidden aspect-[16/9] md:aspect-video bg-gray-100 dark:bg-slate-800">
                                    <div className="absolute inset-0">
                                        <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-60" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 p-3 w-full">
                                        <div className="text-xs text-slate-300 mb-1 flex justify-between">
                                            <span>{formatDate(m.watchDate)}</span>
                                            <span className="text-yellow-400 font-bold flex items-center gap-1"><Star size={10} fill="currentColor" /> {m.rating}</span>
                                        </div>
                                        <h4 className="text-white font-bold truncate">{m.title}</h4>
                                    </div>
                                </Link>
                            ))}
                            {(!stats.recentMovies || stats.recentMovies.length === 0) && <div className="col-span-4 text-center text-slate-400 py-8">暂无记录</div>}
                        </div>
                    </div>

                    {/* 3. Top Actors & Directors (NEW) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Actors */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Users size={18} /> 最爱演员</h3>
                            <div className="space-y-4">
                                {stats.topActors?.map(([name, count]: [string, number], idx: number) => (
                                    <div key={name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-800'}`}>{idx + 1}</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-medium">{name}</span>
                                        </div>
                                        <span className="text-sm text-slate-400">{count} 部</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Directors */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><User size={18} /> 最爱导演</h3>
                            <div className="space-y-4">
                                {stats.topDirectors?.map(([name, count]: [string, number], idx: number) => (
                                    <div key={name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-800'}`}>{idx + 1}</span>
                                            <span className="text-slate-700 dark:text-slate-300 font-medium">{name}</span>
                                        </div>
                                        <span className="text-sm text-slate-400">{count} 部</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 4. Charts (Trend & Rating) - Kept from original Dashboard */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><TrendingUp size={18} /> 近半年趋势</h3>
                            <div className="h-48 flex items-end justify-between gap-4 px-2">
                                {stats.trendData.map((val: number, idx: number) => {
                                    const max = Math.max(...stats.trendData, 1);
                                    const height = Math.max((val / max) * 100, 2);
                                    return (
                                        <div key={idx} className="flex flex-col items-center flex-1 gap-2 group h-full justify-end">
                                            <div className="relative w-full max-w-[40px] h-full flex items-end">
                                                <div style={{ height: `${height}%` }} className="w-full bg-blue-500 rounded-t-lg opacity-80 group-hover:opacity-100 transition-all duration-300 relative flex justify-center">
                                                    {/* Made text visible by default if needed, or stick to opacity group-hover but bigger/bolder */}
                                                    <div className="absolute -top-6 text-blue-600 dark:text-blue-400 font-bold text-xs opacity-100 transition">{val > 0 ? val : ''}</div>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase">{stats.labels[idx].split('-')[1]}月</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><BarChart3 size={18} /> 评分分布</h3>
                            <div className="h-48 flex items-end justify-between gap-1">
                                {stats.ratingDist.map((count: number, score: number) => {
                                    if (score === 0) return null;
                                    const max = Math.max(...stats.ratingDist.slice(1), 1);
                                    // Only give min-height if count > 0
                                    const height = count > 0 ? Math.max((count / max) * 100, 4) : 0;

                                    return (
                                        <div key={score} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-sm h-full flex items-end relative overflow-hidden justify-center">
                                                {/* Bar */}
                                                <div
                                                    className={`w-full transition-all duration-500 opacity-80 hover:opacity-100 ${score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-400'}`}
                                                    style={{ height: `${height}%` }}
                                                />
                                                {/* Count Label - Always visible, conditionally colored for 0 */}
                                                <div className={`absolute top-1 text-[10px] font-bold ${count > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    {count}
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-bold">{score}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: YEARLY REVIEW */}
            {activeTab === 'year' && (
                <div className="space-y-6">
                    {/* Year Selector Header */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{selectedYear} 年度概览</h2>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="bg-gray-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition"
                        >
                            {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                            {!availableYears.includes(new Date().getFullYear()) && <option value={new Date().getFullYear()}>{new Date().getFullYear()}年</option>}
                        </select>
                    </div>

                    {/* Year Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard icon={<Film />} label="年度观影" value={yearStats.total} sub="部" color="blue" />
                        <StatCard icon={<Clock />} label="观看时长" value={Math.round(yearStats.totalDuration / 60)} sub="小时" color="purple" />
                        <StatCard icon={<Activity />} label="年度均分" value={yearStats.avgRating} sub="/ 10" color="yellow" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Monthly Trend */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><TrendingUp size={18} /> 月度趋势</h3>
                            <div className="h-64 flex items-end justify-between gap-2 pt-8">
                                {yearStats.monthlyCounts.map((count: number, idx: number) => {
                                    const max = Math.max(...yearStats.monthlyCounts, 1);
                                    const height = count > 0 ? Math.max((count / max) * 100, 5) : 0;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                            <div className="w-full max-w-[40px] h-full relative flex flex-col items-center justify-end">
                                                {/* 数字标签 - 始终可见，使用醒目样式 */}
                                                <div className={`mb-1 px-1.5 py-0.5 rounded-md text-xs font-bold transition-all duration-300 ${count > 0 ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    {count}
                                                </div>
                                                {/* 柱子 */}
                                                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-t-lg flex-1 relative flex items-end overflow-hidden">
                                                    <div className="w-full bg-gradient-to-t from-blue-600 to-blue-400 opacity-85 group-hover:opacity-100 transition-all duration-500 rounded-t-lg" style={{ height: `${height}%` }} />
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{idx + 1}月</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Type Distribution - Improved */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><PieChart size={18} /> 年度类型偏好</h3>
                            <div className="flex-1 flex flex-col justify-center space-y-6 px-2">
                                {yearStats.typeChartData.map((item: any) => {
                                    const percentage = Math.round(item.value / yearStats.total * 100);
                                    return (
                                        <div key={item.label} className="space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                                    {item.label}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-900 dark:text-white font-bold">{item.value} 部</span>
                                                    <span className="text-slate-400 text-xs">({percentage}%)</span>
                                                </div>
                                            </div>
                                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {yearStats.typeChartData.length === 0 && <div className="text-center text-slate-400 py-8">暂无数据</div>}
                            </div>
                        </div>

                        {/* Tag/Genre Preference (NEW) */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm lg:col-span-3">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Tag size={18} /> 标签(Tags) 偏好分布</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {Object.entries(yearStats.dayCounts).length > 0 &&
                                    // Re-calculate top tags for the specific year locally or use yearStats data if available
                                    // We need to compute tag counts for the year.
                                    (() => {
                                        const tagCounts: Record<string, number> = {};
                                        yearData.forEach(m => m.tags?.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));
                                        const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 12);

                                        return sortedTags.map(([tag, count], idx) => {
                                            const max = sortedTags[0][1];
                                            const percent = (count / max) * 100;
                                            return (
                                                <div key={tag} className="space-y-2">
                                                    <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                                                        <span>{tag}</span>
                                                        <span>{count}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full opacity-80" style={{ width: `${percent}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()
                                }
                                {yearData.length === 0 && <div className="col-span-6 text-center text-slate-400 py-4">本年度暂无数据</div>}
                            </div>
                        </div>
                    </div>

                    {/* Heatmap */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Calendar size={18} /> 观影日历</h3>
                        <div className="min-w-[800px]">
                            <YearlyHeatmap year={selectedYear} data={yearStats.dayCounts} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, sub, color }: any) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
        purple: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
        yellow: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
        pink: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/20',
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
                <div className={`p-2 rounded-lg ${colors[color]}`}>{React.cloneElement(icon, { size: 20 })}</div>
                <span className="text-xs text-slate-400 font-medium bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-full">{label}</span>
            </div>
            <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
                <span className="text-xs text-slate-500 mb-1.5">{sub}</span>
            </div>
        </div>
    );
}
