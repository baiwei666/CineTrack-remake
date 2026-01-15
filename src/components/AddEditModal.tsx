import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Plus, X, Search, Film, Star, Save, Calendar } from 'lucide-react';
import { MovieRecord, MovieType, AppSettings } from '../types';
import { generateId } from '../utils';
import { MOCK_DB, TMDB_IMAGE_BASE } from '../constants';
import { searchTMDB, getTMDBDetails } from '../services/tmdb';
import StarRating from './StarRating';

const AddEditModal = ({
  onClose,
  onSave,
  editingMovie,
  appSettings
}: {
  onClose: () => void;
  onSave: (movie: MovieRecord) => void;
  editingMovie: MovieRecord | null;
  appSettings: AppSettings;
}) => {

  const [formData, setFormData] = useState<Partial<MovieRecord>>(
    editingMovie || {
      type: 'Movie',
      rating: 8,
      watchDate: new Date().toISOString().split('T')[0],
      tags: [],
      coverUrl: '',
      actors: [],
      director: '',
      season: undefined,
      episodes: 1
    }
  );

  useEffect(() => {
    if (editingMovie) {
      setFormData(editingMovie);
    } else {
      setFormData({
        type: 'Movie',
        rating: 8,
        watchDate: new Date().toISOString().split('T')[0],
        tags: [],
        coverUrl: '',
        actors: [],
        director: '',
        season: undefined,
        episodes: 1
      });
    }
  }, [editingMovie]);

  useEffect(() => {
    if (!appSettings.tmdbApiKey || !formData.tmdbId || !formData.season || formData.type === 'Movie') {
      return;
    }

    const fetchSeasonDetails = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/tv/${formData.tmdbId}/season/${formData.season}?api_key=${appSettings.tmdbApiKey}&language=zh-CN`);
        if (res.ok) {
          const data = await res.json();
          setFormData(prev => ({
            ...prev,
            coverUrl: data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : prev.coverUrl,
            comment: data.overview || prev.comment,
            year: data.air_date ? new Date(data.air_date).getFullYear() : prev.year
          }));
        }
      } catch (error) {
        console.error("Failed to fetch season details:", error);
      }
    };

    const timer = setTimeout(fetchSeasonDetails, 600);
    return () => clearTimeout(timer);

  }, [formData.season, formData.tmdbId, formData.type, appSettings.tmdbApiKey]);


  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      if (!appSettings.tmdbApiKey) {
        // Mock Search
        const results = MOCK_DB.filter(m => m.title?.includes(query));
        setSearchSuggestions(results);
      } else {
        // TMDB Search via Service
        const results = await searchTMDB(query, appSettings.tmdbApiKey);
        setSearchSuggestions(results);
      }
    } catch (error) {
      console.error("Search Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.length > 1) {
      searchTimeoutRef.current = setTimeout(() => performSearch(val), 500);
    } else {
      setSearchSuggestions([]);
    }
  };

  const selectMovie = async (item: any) => {
    // If it's a mock item or we have no API key, just fill what we have
    if (!appSettings.tmdbApiKey && !item.media_type) {
      setFormData(prev => ({ ...prev, ...item, tags: item.tags || [], comment: item.comment || '' }));
      setSearchSuggestions([]);
      return;
    }

    setIsFetchingDetails(true);
    try {
      const details = await getTMDBDetails(item.id, item.media_type || 'movie', appSettings.tmdbApiKey);
      if (details) {
        setFormData(prev => ({
          ...prev,
          ...details,
          // Preserve user-entered rating or default if not set
          rating: prev.rating,
          // Preserve other fields if needed, but details should overwrite metadata
        }));
      }
    } catch (err) {
      console.error("Failed to load details", err);
    } finally {
      setIsFetchingDetails(false);
      setSearchSuggestions([]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {editingMovie ? <Edit2 className="text-blue-500" /> : <Plus className="text-green-500" />}
            {editingMovie ? '编辑记录' : '添加新记录'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!editingMovie && (
            <div className="relative z-20">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
                <span>搜影视资料 {appSettings.tmdbApiKey ? '(TMDB)' : '(模拟)'}</span>
                {isSearching && <span className="text-xs text-blue-500 animate-pulse">搜索中...</span>}
                {isFetchingDetails && <span className="text-xs text-green-500 animate-pulse">获取详情中...</span>}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="输入电影/剧集名称..."
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    onChange={handleSearchInput}
                  />
                </div>
              </div>
              {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg mt-1 shadow-xl max-h-80 overflow-y-auto z-50">
                  {searchSuggestions.map((m, idx) => (
                    <div key={idx} onClick={() => selectMovie(m)} className="p-3 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex gap-3 border-b border-gray-100 dark:border-slate-700/50 last:border-0 group">
                      {m.poster_path || m.coverUrl ? (
                        <img src={m.coverUrl || `${TMDB_IMAGE_BASE}${m.poster_path}`} className="w-12 h-16 object-cover rounded shrink-0 shadow-sm" alt="" />
                      ) : (
                        <div className="w-12 h-16 bg-gray-200 dark:bg-slate-600 rounded flex items-center justify-center text-slate-400 dark:text-slate-300 shrink-0"><Film size={16} /></div>
                      )}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="text-slate-900 dark:text-white font-bold text-sm truncate flex justify-between items-center">
                            <span className="truncate pr-2">{m.title || m.name}</span>
                            <span className="text-yellow-500 text-xs flex items-center gap-0.5 shrink-0 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
                              <Star size={10} fill="currentColor" />
                              {m.vote_average?.toFixed(1) || m.doubanRating || 'N/A'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-xs flex items-center gap-2 mt-0.5">
                            <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{new Date(m.release_date || m.first_air_date || m.year).getFullYear() || 'N/A'}</span>
                            <span className="uppercase text-[10px] border border-slate-200 dark:border-slate-600 px-1 rounded">{m.media_type === 'movie' || m.type === 'Movie' ? 'Movie' : 'TV'}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-1">
                          {m.overview || '暂无简介...'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">影片标题</label>
                <input
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">年份</label>
                  <input
                    type="number"
                    value={formData.year || ''}
                    onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">类型</label>
                  <select
                    value={formData.type || 'Movie'}
                    onChange={e => setFormData({ ...formData, type: e.target.value as MovieType })}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  >
                    <option value="Movie">电影</option>
                    <option value="Series">剧集</option>
                    <option value="Anime">动画</option>
                    <option value="Documentary">纪录片</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">观看日期</label>
                  <input
                    type="date"
                    value={formData.watchDate || ''}
                    onChange={e => setFormData({ ...formData, watchDate: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
                {/* 季数输入 (非电影可见) */}
                {(formData.type !== 'Movie') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                      <span>当前季数</span>
                      {formData.tmdbId && <span className="text-[10px] text-green-500">自动同步封面</span>}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.season || ''}
                      onChange={e => setFormData({ ...formData, season: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                      placeholder="选填"
                    />
                  </div>
                )}

                {/* 时长输入 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {formData.type === 'Movie' ? '时长 (分钟)' : '单集时长 (分钟)'}
                  </label>
                  <input
                    type="number"
                    value={formData.duration || ''}
                    onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* 集数输入 (非电影可见) */}
                {formData.type !== 'Movie' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">观看集数</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.episodes || ''}
                      onChange={e => setFormData({ ...formData, episodes: parseInt(e.target.value) })}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition"
                      placeholder="1"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
                  <span>个人评分 (0-10)</span>
                  <span className="text-yellow-500 font-bold">{formData.rating || 0}</span>
                </label>
                <input
                  type="range" min="0" max="10" step="0.5"
                  value={formData.rating || 0}
                  onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="mt-2 flex justify-center">
                  <StarRating rating={formData.rating || 0} size={20} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">封面链接</label>
                <div className="flex gap-2">
                  <input
                    value={formData.coverUrl || ''}
                    onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition"
                  />
                  {formData.coverUrl && <img src={formData.coverUrl} className="w-10 h-10 object-cover rounded border border-gray-300 dark:border-slate-600" alt="preview" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">导演</label>
                  <input
                    value={formData.director || ''}
                    onChange={e => setFormData({ ...formData, director: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tags (逗号隔开)</label>
                  <input
                    value={formData.tags?.join(', ') || ''}
                    onChange={e => setFormData({ ...formData, tags: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) })}
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">主演 (逗号分隔)</label>
                <input
                  value={formData.actors?.join(', ') || ''}
                  onChange={e => setFormData({ ...formData, actors: e.target.value.split(/[,，]/).map(s => s.trim()).filter(Boolean) })}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">观影笔记 / 简介</label>
            <textarea
              value={formData.comment || ''}
              onChange={e => setFormData({ ...formData, comment: e.target.value })}
              placeholder="记录你的观影感受或剧情简介..."
              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white h-32 focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed transition"
            />
          </div>

          <button
            onClick={() => {
              if (!formData.title) return alert('请输入标题');
              onSave({ ...formData, id: formData.id || generateId() } as MovieRecord);
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Save size={20} />
            保存记录
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditModal;