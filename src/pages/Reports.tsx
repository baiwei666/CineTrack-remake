import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { BarChart3, Calendar, PieChart, Activity, TrendingUp, Trophy, Film, Clock } from 'lucide-react';
import DonutChart from '../components/DonutChart';
import { formatDate } from '../utils';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function Reports() {
    const { movies } = useData();
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    // Get available years
    const availableYears = useMemo(() => {
        const years = new Set(movies.map(m => new Date(m.watchDate).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [movies]);

    // Filter data for selected year
    const yearData = useMemo(() => {
        return movies.filter(m => new Date(m.watchDate).getFullYear() === selectedYear);
    }, [movies, selectedYear]);

    // Compute Year Stats
    const stats = useMemo(() => {
        const total = yearData.length;
        const totalDuration = yearData.reduce((acc, m) => acc + (m.duration || 0) * (m.episodes || 1), 0);
        const avgRating = total > 0 ? (yearData.reduce((acc, m) => acc + m.rating, 0) / total).toFixed(1) : '0.0';

        // Monthly Trend
        const monthlyCounts = Array(12).fill(0);
        yearData.forEach(m => {
            const month = new Date(m.watchDate).getMonth();
            monthlyCounts[month]++;
        });

        // Top Genres
        const tagCount: Record<string, number> = {};
        yearData.forEach(m => m.tags?.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
        const topGenres = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));

        // Type Distribution
        const typeCount: Record<string, number> = {};
        yearData.forEach(m => typeCount[m.type] = (typeCount[m.type] || 0) + 1);
        const typeChartData = [
            { label: 'Movie', value: typeCount['Movie'] || 0, color: '#3b82f6' },
            { label: 'Series', value: typeCount['Series'] || 0, color: '#8b5cf6' },
            { label: 'Anime', value: typeCount['Anime'] || 0, color: '#ec4899' },
            { label: 'Doc', value: typeCount['Documentary'] || 0, color: '#10b981' }
        ].filter(d => d.value > 0);

        // Daily Heatmap Data (Day of Year -> Count)
        const dayCounts: Record<string, number> = {};
        yearData.forEach(m => {
            dayCounts[m.watchDate] = (dayCounts[m.watchDate] || 0) + 1;
        });

        return { total, totalDuration, avgRating, monthlyCounts, topGenres, typeChartData, dayCounts };
    }, [yearData]);


    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header with Year Selector */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BarChart3 className="text-blue-500" /> 统计报表
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">回顾您的观影历程与数据深度分析</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">选择年份:</span>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        className="bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                        {availableYears.map(y => <option key={y} value={y}>{y}年</option>)}
                        {!availableYears.includes(new Date().getFullYear()) && <option value={new Date().getFullYear()}>{new Date().getFullYear()}年</option>}
                    </select>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={<Film />} label="年度观影" value={stats.total} sub="部" color="blue" />
                <StatCard icon={<Clock />} label="总时长" value={Math.round(stats.totalDuration / 60)} sub="小时" color="purple" />
                <StatCard icon={<Activity />} label="平均评分" value={stats.avgRating} sub="/ 10" color="yellow" />
                <StatCard icon={<Trophy />} label="年度最爱" value={stats.topGenres[0]?.label || '-'} sub={stats.topGenres[0] ? `${stats.topGenres[0].value}部` : ''} color="pink" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Trend - Custom Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><TrendingUp size={18} /> 每月观影趋势</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {stats.monthlyCounts.map((count, idx) => {
                            const max = Math.max(...stats.monthlyCounts, 1);
                            const height = (count / max) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                    <div className="w-full max-w-[40px] bg-gray-100 dark:bg-slate-800 rounded-t-lg h-full relative flex items-end overflow-hidden">
                                        <div
                                            className="w-full bg-blue-500 opacity-80 group-hover:opacity-100 transition-all duration-500 rounded-t-lg"
                                            style={{ height: `${height}%` }}
                                        />
                                        <div className="absolute top-2 w-full text-center text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition">{count}</div>
                                    </div>
                                    <span className="text-xs text-slate-400">{idx + 1}月</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Type Distribution */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><PieChart size={18} /> 类型分布</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <DonutChart data={stats.typeChartData} />
                    </div>
                </div>
            </div>

            {/* Heatmap Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Calendar size={18} /> 观影日历</h3>
                <div className="min-w-[800px]">
                    <YearlyHeatmap year={selectedYear} data={stats.dayCounts} />
                </div>
            </div>
        </div>
    );
}

// Sub-components

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

function YearlyHeatmap({ year, data }: { year: number, data: Record<string, number> }) {
    // Generate all days for the year
    const days = useMemo(() => {
        const d = [];
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
            d.push(new Date(dt));
        }
        return d;
    }, [year]);

    // Group by week for grid display (GitHub style is Column=Week, Row=Day)
    // Simplified: Just a grid of days for now, maybe grouped by month labels?
    // Let's do a flex wrap grid for simplicity and mobile friendliness

    // Better Approach: 12 Month blocks
    const months = Array.from({ length: 12 }, (_, i) => {
        return days.filter(d => d.getMonth() === i);
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {months.map((monthDays, midx) => (
                <div key={midx} className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 mb-1">{midx + 1}月</span>
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty slots for start of month */}
                        {Array.from({ length: monthDays[0].getDay() }).map((_, i) => <div key={`empty-${i}`} />)}

                        {monthDays.map(day => {
                            const dateStr = day.toISOString().split('T')[0];
                            const count = data[dateStr] || 0;
                            let bg = 'bg-gray-100 dark:bg-slate-800';
                            if (count > 0) bg = 'bg-blue-200 dark:bg-blue-900';
                            if (count > 1) bg = 'bg-blue-400 dark:bg-blue-700';
                            if (count > 2) bg = 'bg-blue-600 dark:bg-blue-500';

                            return (
                                <div
                                    key={dateStr}
                                    title={`${dateStr}: ${count} 部`}
                                    className={`w-full aspect-square rounded-sm ${bg} transition hover:scale-125`}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
