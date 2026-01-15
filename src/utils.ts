
import { MovieRecord, AppSettings } from './types';

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return '未知日期';
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  } catch (e) {
    return dateStr;
  }
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Hybrid Storage Wrapper (IndexedDB + LocalStorage)
 * 解决 PakePlus/Electron 环境下单一存储可能失效的问题
 */
const DB_NAME = 'CineTrackDB';
const DB_VERSION = 1;
const STORE_MOVIES = 'movies';
const STORE_SETTINGS = 'settings';

// LocalStorage Keys
const LS_MOVIES = 'cinetrack_data';
const LS_SETTINGS = 'cinetrack_settings';
const LS_THEME = 'cinetrack_theme';

// Declare Electron Window Interface
declare global {
  interface Window {
    electron?: {
      platform: string;
      db: {
        read: () => Promise<any>;
        write: (data: any) => Promise<boolean>;
      };
      extractColor: (url: string) => Promise<number[] | null>;
      getPathConfig: () => Promise<{ dataPath?: string; defaultPath: string }>;
      selectFolder: () => Promise<string | null>;
      setDataPath: (path: string) => Promise<boolean>;
    }
  }
}

class CineTrackDB {
  private inMemoryCache: any = null;

  async init(): Promise<void> {
    if (!window.electron) {
      console.warn("Electron environment not detected. Using LocalStorage fallback.");
      return;
    }

    try {
      const fileData = await window.electron.db.read();

      if (!fileData || (typeof fileData === 'object' && Object.keys(fileData).length === 0 && !Array.isArray(fileData.movies))) {
        console.log("No valid local file data found. Checking LocalStorage for migration...");
        // Migration Logic
        const lsMovies = localStorage.getItem(LS_MOVIES);
        const lsSettings = localStorage.getItem(LS_SETTINGS);
        const lsTheme = localStorage.getItem(LS_THEME);

        if (lsMovies || lsSettings) {
          const migrationData = {
            movies: lsMovies ? JSON.parse(lsMovies) : [],
            settings: lsSettings ? JSON.parse(lsSettings) : null,
            theme: lsTheme || 'dark'
          };

          await window.electron.db.write(migrationData);
          this.inMemoryCache = migrationData;
          console.log("Migration successful!");
        } else {
          // New User or clean slate
          this.inMemoryCache = { movies: [], settings: null, theme: 'dark' };
        }
      } else {
        this.inMemoryCache = fileData;
      }
    } catch (e) {
      console.error("DB Init Failed:", e);
    }
  }

  // Helper to sync cache to disk
  private async persist() {
    if (window.electron && this.inMemoryCache) {
      await window.electron.db.write(this.inMemoryCache);
    }
  }

  async getMovies(): Promise<MovieRecord[] | null> {
    if (this.inMemoryCache) return this.inMemoryCache.movies;
    // Fallback for non-electron dev
    const ls = localStorage.getItem(LS_MOVIES);
    return ls ? JSON.parse(ls) : null;
  }

  async saveMovies(movies: MovieRecord[]) {
    if (!this.inMemoryCache) this.inMemoryCache = {};
    this.inMemoryCache.movies = movies;
    await this.persist();

    // Sync LS for backup/dev
    localStorage.setItem(LS_MOVIES, JSON.stringify(movies));
  }

  async getAppSettings(): Promise<AppSettings | null> {
    if (this.inMemoryCache) return this.inMemoryCache.settings;
    const ls = localStorage.getItem(LS_SETTINGS);
    return ls ? JSON.parse(ls) : null;
  }

  async saveAppSettings(settings: AppSettings) {
    if (!this.inMemoryCache) this.inMemoryCache = {};
    this.inMemoryCache.settings = settings;
    await this.persist();
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  }

  async getTheme(): Promise<string | null> {
    if (this.inMemoryCache && this.inMemoryCache.theme) return this.inMemoryCache.theme;
    return localStorage.getItem(LS_THEME);
  }

  async saveTheme(theme: string) {
    if (!this.inMemoryCache) this.inMemoryCache = {};
    this.inMemoryCache.theme = theme;
    await this.persist();
    localStorage.setItem(LS_THEME, theme);
  }
}

export const db = new CineTrackDB();
