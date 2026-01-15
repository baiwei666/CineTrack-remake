import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { MovieRecord } from '../types';

const DeleteConfirmModal = ({ 
  movie, 
  onClose, 
  onConfirm 
}: { 
  movie: MovieRecord | null, 
  onClose: () => void, 
  onConfirm: () => void 
}) => {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-red-200 dark:border-red-500/30 shadow-2xl p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-full">
            <AlertTriangle className="text-red-600 dark:text-red-500" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">确认删除记录?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              您即将删除影片 <span className="text-slate-900 dark:text-white font-medium">《{movie.title}》{movie.season ? `(第${movie.season}季)` : ''}</span>
              <br />此操作无法撤销。
            </p>
          </div>
          <div className="flex gap-3 w-full pt-2">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl transition text-sm font-medium"
            >
              取消
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition text-sm font-medium shadow-lg shadow-red-600/20 dark:shadow-red-900/20"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;