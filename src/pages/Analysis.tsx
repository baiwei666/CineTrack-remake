import React, { useState, useEffect } from 'react';
import {
    BrainCircuit, Sparkles, Quote, Lightbulb, Film, X, History,
    Trash2, Calendar, ChevronRight, BarChart3, PieChart, Activity
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { LibraryInsights, StoredReport } from '../types';
import { generateLibraryInsights, BatchProgress } from '../services/aiService';
import DonutChart from '../components/DonutChart';

export default function Analysis() {
    const { movies, appSettings } = useData();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState<BatchProgress | null>(null);
    const [currentReport, setCurrentReport] = useState<LibraryInsights | null>(null);
    const [reportCount, setReportCount] = useState(0);

    const [history, setHistory] = useState<StoredReport[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem('cinetrack_ai_reports');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setHistory(parsed);
                // Load most recent if available
                if (parsed.length > 0 && !currentReport) {
                    setCurrentReport(parsed[0].insights);
                    setReportCount(parsed[0].movieCount);
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        }
    }, []);

    const saveReport = (report: LibraryInsights) => {
        const newEntry: StoredReport = {
            id: Date.now().toString(),
            insights: report,
            movieCount: movies.length,
            generatedAt: new Date().toISOString()
        };
        const newHistory = [newEntry, ...history];
        setHistory(newHistory);
        localStorage.setItem('cinetrack_ai_reports', JSON.stringify(newHistory));
    };

    const deleteReport = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (confirm('确定要删除这份分析报告吗？')) {
            const newHistory = history.filter(h => h.id !== id);
            setHistory(newHistory);
            localStorage.setItem('cinetrack_ai_reports', JSON.stringify(newHistory));
            if (currentReport && history.find(h => h.id === id)?.insights === currentReport) {
                setCurrentReport(newHistory.length > 0 ? newHistory[0].insights : null);
                setReportCount(newHistory.length > 0 ? newHistory[0].movieCount : 0);
            }
        }
    };

    const runAnalysis = async () => {
        if (movies.length === 0) { alert("没有电影数据可供分析"); return; }

        setIsAnalyzing(true);
        setCurrentReport(null);
        setProgress({ current: 0, total: 100, status: '准备开始...' });

        try {
            const report = await generateLibraryInsights(movies, appSettings, (p) => {
                setProgress(p);
            });
            setCurrentReport(report);
            setReportCount(movies.length);
            saveReport(report);
        } catch (e: any) {
            console.error(e);
            alert(`分析失败: ${e.message}`);
        } finally {
            setIsAnalyzing(false);
            setProgress(null);
        }
    };

    // Helper to format date
    const formatDate = (isoString?: string) => {
        if (!isoString) return 'Unknown Date';
        return new Date(isoString).toLocaleString('zh-CN', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Charts Data Preparation
    const genreData = currentReport?.genreDistribution.map((g, i) => ({
        label: g.genre,
        value: g.count,
        color: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'][i % 6]
    })) || [];

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50/50 dark:bg-slate-950/50">
            {/* Sidebar History (Desktop) */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
                ${showHistory ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0
            `}>
                <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <History size={18} className="text-purple-600" /> 历史报告
                    </h2>
                    <button onClick={() => setShowHistory(false)} className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800">
                        <X size={18} />
                    </button>
                </div>
                <div className="overflow-y-auto h-[calc(100vh-60px)] p-3 space-y-2">
                    {history.length === 0 ? (
                        <div className="text-center text-slate-400 py-10 text-sm">暂无历史报告</div>
                    ) : (
                        history.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setCurrentReport(item.insights);
                                    setReportCount(item.movieCount);
                                    setShowHistory(false);
                                }}
                                className={`
                                    p-3 rounded-xl border cursor-pointer transition-all group relative
                                    ${currentReport === item.insights
                                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700/50 hover:border-purple-300 dark:hover:border-purple-700/50'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                        包含 {item.movieCount} 部影片
                                    </span>
                                    <button
                                        onClick={(e) => deleteReport(item.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Calendar size={10} />
                                    {formatDate(item.generatedAt)}
                                </div>
                                {/* Mini Tags Preview */}
                                <div className="flex gap-1 mt-2 overflow-hidden h-1.5 opacity-50">
                                    {item.insights.emotionalProfile.slice(0, 3).map((e, i) => (
                                        <div key={i} className="h-full rounded-full" style={{ width: `${e.percentage}%`, backgroundColor: e.color || '#ccc' }} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 h-full overflow-y-auto w-full relative">
                {/* Mobile Toggle */}
                <button
                    onClick={() => setShowHistory(true)}
                    className="md:hidden absolute top-4 left-4 z-20 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md"
                >
                    <History size={20} />
                </button>

                <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8 min-h-full">

                    {/* Header Section */}
                    <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-2xl p-8 md:p-12">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900 opacity-90"></div>
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <BrainCircuit size={120} />
                        </div>

                        <div className="relative z-10">
                            <h1 className="text-3xl md:text-5xl font-bold mb-4 flex items-center gap-3">
                                <Sparkles className="text-yellow-300" /> AI 观影分析师
                            </h1>
                            <p className="text-lg text-purple-100 max-w-2xl mb-8 leading-relaxed">
                                基于您库中的 {movies.length} 部影片，为您生成专属的深度观影报告。探索您的审美品味、情感偏好与隐藏的观影习惯。
                            </p>

                            {!isAnalyzing ? (
                                <button
                                    onClick={runAnalysis}
                                    className="bg-white text-purple-700 hover:bg-slate-50 px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-black/20 transition transform hover:-translate-y-1 flex items-center gap-2"
                                >
                                    <BrainCircuit size={20} />
                                    {currentReport ? '重新生成完整报告' : '开始深度分析'}
                                </button>
                            ) : (
                                <div className="bg-black/20 backdrop-blur rounded-xl p-4 max-w-md border border-white/10">
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span>{progress?.status || '正在初始化...'}</span>
                                        <span>{Math.round((progress?.current || 0) / (progress?.total || 1) * 100)}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 transition-all duration-300 ease-out"
                                            style={{ width: `${Math.round((progress?.current || 0) / (progress?.total || 1) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Report Content */}
                    {currentReport && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                            {/* 1. Key Metrics Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                        <Film size={24} />
                                    </div>
                                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{reportCount}</span>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider mt-1">分析影片总数</span>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mb-3">
                                        <Activity size={24} />
                                    </div>
                                    <span className="text-3xl font-bold text-slate-800 dark:text-white">
                                        {(movies.reduce((acc, m) => acc + m.rating, 0) / (movies.length || 1)).toFixed(1)}
                                    </span>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider mt-1">平均观影评分</span>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center justify-center">
                                    <div className="text-left w-full">
                                        <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-bold">Generated At</div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(currentReport.generatedAt)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Deep Analysis & Keywords */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                    <Quote size={80} className="absolute top-4 right-4 text-gray-100 dark:text-slate-800 -z-0" />
                                    <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-6 flex items-center gap-2 relative z-10">
                                        <BrainCircuit size={16} /> 深度解读
                                    </h3>
                                    <p className="text-slate-700 dark:text-slate-300 leading-loose text-lg font-light relative z-10">
                                        {currentReport.deepAnalysis}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 border border-indigo-100 dark:border-slate-700 flex flex-col">
                                    <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <Sparkles size={16} /> 您的观影关键词
                                    </h3>
                                    <div className="flex flex-wrap gap-2 content-start">
                                        {currentReport.profileKeywords.map((tag, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 text-sm font-bold rounded-lg shadow-sm border border-indigo-100 dark:border-slate-600">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Visualizations Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Genre Donut */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                                        <PieChart size={16} /> 类型偏好分布
                                    </h3>
                                    <div className="flex items-center justify-center py-4">
                                        <DonutChart data={genreData} displayTotal={reportCount} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {currentReport.genreDistribution.slice(0, 6).map((g, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: genreData[i]?.color }} />
                                                    <span className="text-slate-600 dark:text-slate-300">{g.genre}</span>
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-white">{g.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Emotional & Director Bar */}
                                <div className="space-y-6">
                                    {/* Emotional */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <Activity size={16} /> 情绪能量分布
                                        </h3>
                                        <div className="space-y-4">
                                            {currentReport.emotionalProfile.map((item, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.emotion}</span>
                                                        <span className="text-slate-400">{item.percentage}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${item.percentage}%`,
                                                                backgroundColor: item.color || '#6366f1'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Directors */}
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Film size={16} /> 最常看导演
                                        </h3>
                                        <div className="space-y-3">
                                            {currentReport.directorAnalysis.map((d, i) => (
                                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{d.name}</div>
                                                        <div className="text-xs text-slate-400">{d.style}</div>
                                                    </div>
                                                    <div className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                                                        {d.count} 部
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Recommendations */}
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Lightbulb className="text-yellow-500" /> AI 专属推荐
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentReport.recommendations.map((rec, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 shadow-sm hover:shadow-xl hover:shadow-purple-900/10 transition group cursor-default">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
                                                    <Film size={20} />
                                                </div>
                                                <div className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-lg border border-green-100 dark:border-green-900/50">
                                                    契合度 {rec.matchScore}%
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                                                {rec.title}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {rec.reason}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    )}

                    {!currentReport && !isAnalyzing && (
                        <div className="text-center py-20 opacity-50">
                            <BrainCircuit size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                            <p className="text-slate-500">尚无分析报告，点击上方按钮开始分析</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
