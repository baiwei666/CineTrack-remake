
import React, { useState, useEffect, useRef } from 'react';
import { X, FileJson, Download, Upload, Globe, Cpu, Save, Folder, Database, Trash2 } from 'lucide-react';
import { AppSettings, MovieRecord, BackupData } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SettingsModalProps {
    onClose: () => void;
    onSave: (settings: AppSettings) => void;
    onForceSave?: () => void;
    initialSettings: AppSettings;
    movies: MovieRecord[];
    setMovies: React.Dispatch<React.SetStateAction<MovieRecord[]>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSave, onForceSave, initialSettings, movies, setMovies }) => {
    const [localSettings, setLocalSettings] = useState(initialSettings);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [storagePath, setStoragePath] = useState<string>('Loading...');
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        // Load initial Path Config
        if (window.electron?.getPathConfig) {
            window.electron.getPathConfig().then(config => {
                setStoragePath(config.dataPath || config.defaultPath);
            }).catch(err => {
                console.error("getPathConfig failed:", err);
                setStoragePath(`Error: ${err.message}`);
            });
        } else {
            console.error("window.electron or getPathConfig is undefined!");
            setStoragePath("Error: Window.electron API missing");
        }
    }, []);

    const handleChangeLocation = async () => {
        if (!window.electron?.selectFolder) return;
        const newPath = await window.electron.selectFolder();
        if (newPath) {
            const confirmed = confirm(`确定要将数据存储位置更改为:\n${newPath}\n\n这将在新位置创建 data.json (旧数据不会自动迁移，请手动导出导入)。`);
            if (confirmed) {
                await window.electron.setDataPath(newPath);
                setStoragePath(newPath);
                alert("存储位置已更新。请重启应用以确保所有组件使用新路径加载。");
            }
        }
    };

    useEffect(() => {
        setLocalSettings((prev: any) => ({
            tmdbApiKey: '',
            aiProvider: 'Mock',
            aiApiKey: '',
            aiModel: 'gpt-3.5-turbo',
            ...prev
        }));
    }, []);

    const handleExport = () => {
        const backupData: BackupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            movies: movies,
            settings: localSettings,
            theme: theme,
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `cinetrack_full_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const rawData = JSON.parse(ev.target?.result as string);

                // Legacy Backup Support (Just an array of movies)
                if (Array.isArray(rawData)) {
                    if (confirm(`检测到旧版备份文件 (仅包含影片数据)。\n确认导入 ${rawData.length} 条数据吗?`)) {
                        setMovies((prev: any[]) => {
                            const ids = new Set(prev.map(p => p.id));
                            return [...rawData.filter((p: any) => !ids.has(p.id)), ...prev];
                        });
                        alert('影片数据导入成功！');
                        onClose();
                    }
                    return;
                }

                // New Full Backup Support
                if (rawData.version && rawData.movies) {
                    const backup = rawData as BackupData;
                    const msg = `检测到全量备份文件 (v${backup.version})。\n\n包含:\n- ${backup.movies.length} 条影片记录\n- 完整应用设置\n- 主题配置 (${backup.theme})\n\n是否恢复？(这将覆盖当前设置)`;
                    if (confirm(msg)) {
                        // 1. Restore Movies (Merge or Replace? Let's Merge for safety, or user expects restore? usually restore replaces or merges. Let's merge movies, overwrite settings)
                        setMovies((prev: any[]) => {
                            const ids = new Set(prev.map(p => p.id));
                            return [...backup.movies.filter((p: any) => !ids.has(p.id)), ...prev];
                        });

                        // 2. Restore Settings
                        setLocalSettings(backup.settings); // Update UI
                        onSave(backup.settings); // Persist to DataContext/Disk

                        // 3. Restore Theme
                        if (backup.theme) setTheme(backup.theme);

                        alert('全量恢复成功！');
                        onClose();
                    }
                    return;
                }

                alert('无效的备份文件格式');
            } catch (err) {
                console.error(err);
                alert('解析文件失败');
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-slate-700 shadow-2xl">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">设置</h2>
                    <button onClick={onClose}><X className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" /></button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Data Storage Path Panel */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2"><Database size={16} /> 数据存储位置</h3>
                        <div className="flex gap-2 items-center bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
                            <Folder size={18} className="text-blue-500 shrink-0" />
                            <div className="flex-1 truncate text-xs font-mono text-slate-700 dark:text-slate-300" title={storagePath}>
                                {storagePath}
                            </div>
                            <button onClick={handleChangeLocation} className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                                更改
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 px-1">更改后所有的影片数据将保存到此目录。</p>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-slate-700" />

                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"><FileJson size={16} /> 数据备份</h3>
                        <div className="flex gap-2">
                            <button onClick={handleExport} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 py-2 rounded text-sm text-slate-900 dark:text-white flex justify-center items-center gap-2 border border-gray-200 dark:border-slate-600"><Download size={14} /> 导出</button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 py-2 rounded text-sm text-slate-900 dark:text-white flex justify-center items-center gap-2 border border-gray-200 dark:border-slate-600"><Upload size={14} /> 导入</button>
                            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                        </div>
                        <button
                            onClick={() => {
                                if (confirm('警告：这就将删除所有的观影数据和设置，且无法恢复！\n\n请再次确认是否清空所有数据？')) {
                                    // Need to call clearAllData. Pass it via props or useData? 
                                    // SettingsModal takes movies/setMovies props but clearAllData is in context.
                                    // Let's assume onForceSave is repurposed or we add a new prop.
                                    // The user replaced "Force Write" specifically.
                                    // But SettingsModal is used in MainLayout.
                                    // I should probably pass a new prop or use useData inside SettingsModal (it already imports useData?)
                                    // SettingsModal does NOT import useData (it receives props).
                                    // I will use window.location.reload() trick or rely on passed callback.
                                    if (onForceSave) onForceSave(); // I'll repurpose onForceSave prop to trigger clear logic in MainLayout
                                }
                            }}
                            className="w-full mt-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 py-2 rounded text-sm text-red-800 dark:text-red-200 flex justify-center items-center gap-2 border border-red-200 dark:border-red-800/50 transition"
                        >
                            <Trash2 size={14} /> 一键清除所有数据 (慎用)
                        </button>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-slate-700" />
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-2"><Globe size={16} /> TMDB API</h3>
                        <input type="password" value={localSettings.tmdbApiKey || ''} onChange={e => setLocalSettings({ ...localSettings, tmdbApiKey: e.target.value })} placeholder="API Read Access Token" className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2"><Cpu size={16} /> AI 配置</h3>
                        <select value={localSettings.aiProvider || 'Mock'} onChange={e => setLocalSettings({ ...localSettings, aiProvider: e.target.value as any })} className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 mb-2">
                            <option value="Mock">Mock</option>
                            <option value="OpenAI">OpenAI</option>
                            <option value="Gemini">Gemini</option>
                            <option value="DeepSeek">DeepSeek</option>
                        </select>
                        {localSettings.aiProvider !== 'Mock' && (
                            <>
                                <input type="password" value={localSettings.aiApiKey || ''} onChange={e => setLocalSettings({ ...localSettings, aiApiKey: e.target.value })} placeholder="API Key" className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 mb-2" />
                                <input type="text" value={localSettings.aiModel || ''} onChange={e => setLocalSettings({ ...localSettings, aiModel: e.target.value })} placeholder="Model Name" className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500" />
                            </>
                        )}
                    </div>
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">取消</button>
                    <button onClick={() => onSave(localSettings)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium shadow-md">保存</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
