
import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Download, Share2, Film, Star, Clock, BrainCircuit, Sparkles, Quote, ImageOff } from 'lucide-react';
import { MovieRecord, AiAnalysisResult } from '../types';

interface ShareExportModalProps {
  onClose: () => void;
  movies: MovieRecord[];
  aiAnalysis: AiAnalysisResult | string | null;
  stats: {
    total: number;
    avgRating: string;
    totalDuration: number;
    topTags: [string, number][];
  };
}

const ShareExportModal: React.FC<ShareExportModalProps> = ({ onClose, movies, aiAnalysis, stats }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleDownload = async () => {
    if (exportRef.current === null) return;
    setIsGenerating(true);

    try {
      // 启用 useCORS 和 cacheBust 以解决跨域图片在 Canvas 中不显示的问题
      const dataUrl = await toPng(exportRef.current, { 
        cacheBust: true,
        useCORS: true, 
        pixelRatio: 2, 
        backgroundColor: '#020617',
        skipAutoScale: true
      });
      
      const link = document.createElement('a');
      link.download = `cinetrack-share-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('生成图片失败，部分图片可能因跨域限制无法显示');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageError = (id: string) => {
    setFailedImages(prev => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
    });
  };

  // 解析 AI 分析结果 (如果是对象)
  const structuredAi = typeof aiAnalysis === 'object' ? aiAnalysis : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col border border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-2xl">
          <div className="flex items-center gap-2 text-white">
            <Share2 className="text-blue-500" />
            <h2 className="font-bold text-lg">生成分享长图</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Preview Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 flex justify-center">
            {/* 
               Export Container: 
               固定宽度 600px 以保证生成的图片在手机/电脑上布局一致且美观。
               强制使用深色主题以获得最佳的“电影感”视觉效果。
               h-fit 确保高度随内容自动撑开，不被裁剪。
            */}
            <div 
              ref={exportRef} 
              className="w-[600px] bg-slate-950 text-slate-100 flex-shrink-0 relative overflow-hidden shadow-2xl h-fit"
              style={{ minHeight: '1000px' }}
            >
                {/* Decorative Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-full h-96 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />

                {/* 1. Brand Header */}
                <div className="p-8 pb-4 relative z-10">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-2">
                                <Film className="text-blue-500 fill-current" /> CineTrack
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">MY MOVIE JOURNEY</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white">{new Date().getFullYear()}</p>
                            <p className="text-slate-500 text-xs tracking-widest uppercase">{new Date().toLocaleDateString('en-US', {month:'long', day:'numeric'})}</p>
                        </div>
                    </div>

                    {/* 2. Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                            <div className="text-2xl font-bold text-white">{stats.total}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Watched</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                            <div className="text-2xl font-bold text-yellow-500">{stats.avgRating}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Avg Score</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                            <div className="text-2xl font-bold text-purple-400">{Math.round(stats.totalDuration / 60)}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Hours</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center">
                            <div className="text-xs font-bold text-pink-400 truncate w-full px-1">{stats.topTags[0]?.[0] || '-'}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">Top Genre</div>
                        </div>
                    </div>

                    {/* 3. AI Analysis Highlight (If available) */}
                    {structuredAi && (
                        <div className="mb-8 relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-30 blur"></div>
                            <div className="relative bg-slate-900 rounded-xl p-6 border border-slate-800">
                                <div className="flex items-center gap-2 text-purple-400 mb-3 text-sm font-bold uppercase tracking-wider">
                                    <BrainCircuit size={16} /> AI Insight
                                </div>
                                
                                {/* Keywords */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {structuredAi.keywords.slice(0, 4).map((k, i) => (
                                        <span key={i} className="text-xs bg-purple-500/10 text-purple-200 px-2 py-1 rounded border border-purple-500/20 whitespace-nowrap">
                                            #{k}
                                        </span>
                                    ))}
                                </div>

                                {/* Summary Text */}
                                <div className="relative pl-4 border-l-2 border-slate-700">
                                    <Quote size={24} className="absolute -top-2 -left-3 text-slate-800 fill-slate-800 z-0" />
                                    <p className="text-sm text-slate-300 leading-relaxed italic relative z-10">
                                        {structuredAi.analysis.length > 150 
                                            ? structuredAi.analysis.substring(0, 150) + "..." 
                                            : structuredAi.analysis}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Poster Wall */}
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 mb-4 text-xs font-bold uppercase tracking-wider">
                            <Film size={14} /> Library Collection
                        </div>
                        {movies.length > 0 ? (
                            <div className="grid grid-cols-5 gap-2">
                                {movies.map((m) => {
                                    const isFailed = failedImages.has(m.id);
                                    return (
                                        <div key={m.id} className="aspect-[2/3] relative rounded overflow-hidden bg-slate-800 border border-slate-700 shadow-lg">
                                            {m.coverUrl && !isFailed ? (
                                                <img 
                                                    src={m.coverUrl} 
                                                    className="w-full h-full object-cover" 
                                                    referrerPolicy="no-referrer"
                                                    loading="eager"
                                                    onError={() => handleImageError(m.id)}
                                                    alt="" 
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1 bg-slate-800">
                                                    {isFailed ? <ImageOff size={16} className="opacity-50" /> : <Film size={16} />}
                                                    {isFailed && <span className="text-[8px] opacity-50">N/A</span>}
                                                </div>
                                            )}
                                            {/* Overlay Rating */}
                                            <div className="absolute top-1 right-1 bg-black/70 backdrop-blur px-1 rounded text-[8px] font-bold text-white flex items-center gap-0.5 z-10">
                                                <Star size={6} className="text-yellow-500 fill-current" />
                                                {m.rating}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                           <div className="text-center py-10 text-slate-600 text-sm">暂无海报数据</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 text-center border-t border-slate-800/50 mt-4">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">Generated by CineTrack</p>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-b-2xl flex justify-between items-center">
          <div className="text-sm text-slate-400">
            预览效果可能因屏幕而异，导出时为高清大图。
          </div>
          <button 
            onClick={handleDownload} 
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isGenerating ? '生成中...' : (
                <>
                 <Download size={18} /> 下载分享图片
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareExportModal;
