import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Clapperboard, LayoutGrid, List as ListIcon, BrainCircuit,
    Share2, Sun, Moon, Settings, Plus, BarChart3
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import SettingsModal from '../components/SettingsModal';
import AddEditModal from '../components/AddEditModal';
import ShareExportModal from '../components/ShareExportModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal'; // Ideally manage this locally or via Context if global

export default function MainLayout() {
    const { theme, toggleTheme } = useTheme();
    const {
        movies, setMovies, appSettings, saveSettings, clearAllData,
        // You might need to expose these if modals are here
        stats
    } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const [globalBackground, setGlobalBackground] = useState<string | null>(null);

    return (
        <div className={`h-screen w-screen font-sans selection:bg-blue-500/30 bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors duration-300 relative overflow-hidden flex flex-col`}>
            {/* Global Immersive Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <AnimatePresence mode='wait'>
                    {globalBackground && (
                        <motion.div
                            key={globalBackground}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0"
                        >
                            <img src={globalBackground} className="w-full h-full object-cover blur-[100px] scale-125 opacity-60 dark:opacity-50" alt="" />
                            <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/60 mix-blend-overlay" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Base ambient background if no image */}
                {!globalBackground && <div className="absolute inset-0 bg-gray-50 dark:bg-slate-950 transition-colors duration-500" />}
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50 relative z-40 titlebar">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white"><Clapperboard className="text-blue-500" /> CineTrack</div>
                <div className="flex gap-2 titlebar-no-drag">
                    <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 dark:text-slate-400"><Settings size={20} /></button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white p-2 rounded-lg shadow-md"><Plus size={20} /></button>
                </div>
            </div>

            {/* Desktop Drag Region */}
            <div className="hidden md:block fixed top-0 left-0 right-0 h-8 z-50 titlebar pointer-events-none" />

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
                {/* Sidebar */}
                <aside className="hidden md:flex flex-col w-64 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-r border-gray-200/30 dark:border-slate-800/30 p-6 h-full transition-colors duration-300">
                    <div className="flex items-center gap-3 font-bold text-2xl text-slate-900 dark:text-white mb-10 pt-2">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"><Clapperboard className="text-white" size={24} /></div>
                        CineTrack
                    </div>
                    <nav className="space-y-2 flex-1 overflow-y-auto scrollbar-none">
                        <NavLink to="/dashboard" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400' : 'text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}><LayoutGrid size={20} /> 仪表盘</NavLink>
                        <NavLink to="/library" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400' : 'text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}><ListIcon size={20} /> 全部记录</NavLink>
                        <NavLink to="/analysis" className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${isActive ? 'bg-purple-50 text-purple-600 dark:bg-purple-600/10 dark:text-purple-400' : 'text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}><BrainCircuit size={20} /> AI 分析</NavLink>

                        {/* Saved Views */}
                        {appSettings.savedViews && appSettings.savedViews.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider mb-2 px-4">智能视图</h3>
                                <div className="space-y-1">
                                    {appSettings.savedViews.map(view => (
                                        <NavLink
                                            key={view.id}
                                            to={`/library?view=${view.id}`}
                                            className={({ isActive }) => {
                                                // React Router v6 isActive logic check omitted for brevity
                                                return `w-full flex items-center gap-3 px-4 py-2 rounded-xl transition font-medium text-sm text-slate-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800`;
                                            }}
                                        >
                                            <LayoutGrid size={16} /> {view.name}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        )}
                    </nav>
                    <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-4">
                        <button onClick={() => setIsShareOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition text-sm font-medium"><Share2 size={18} /> 分享长图</button>
                        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition text-sm font-medium">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}{theme === 'dark' ? '切换亮色模式' : '切换深色模式'}</button>
                        <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition text-sm font-medium"><Settings size={18} /> 设置与数据</button>
                        <button onClick={() => setIsModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"><Plus size={20} /> 添加观影</button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <div className="pt-6">
                        <Outlet context={{ setGlobalBackground }} />
                    </div>
                </main>
            </div>

            {/* Global Modals */}
            {isModalOpen && <AddEditModal onClose={() => setIsModalOpen(false)} onSave={(m) => {
                // Basic Add Handler
                if (typeof m === 'object') {
                    // Need proper Save handler here. 
                    // Since setMovies is in DataContext, we can do it.
                    setMovies(prev => [m, ...prev]);
                }
                setIsModalOpen(false);
            }} editingMovie={null} appSettings={appSettings} />}

            {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} onSave={(s) => { saveSettings(s); setIsSettingsOpen(false); }} onForceSave={clearAllData} initialSettings={appSettings} movies={movies} setMovies={setMovies} />}

            {isShareOpen && <ShareExportModal onClose={() => setIsShareOpen(false)} movies={movies} aiAnalysis={null} stats={stats} />}
        </div>
    );
}
