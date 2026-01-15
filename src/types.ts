export type MovieType = 'Movie' | 'Series' | 'Anime' | 'Documentary';
export type WatchStatus = 'plan' | 'watching' | 'completed' | 'dropped';

export interface MovieRecord {
  id: string;
  tmdbId?: number;
  title: string;
  originalTitle?: string;
  type: MovieType;
  coverUrl: string;
  rating: number;
  doubanRating: number;
  watchDate: string;
  tags: string[];
  comment: string;
  actors: string[];
  director?: string;
  year: number;
  duration?: number;
  season?: number;
  episodes?: number;

  // Watch Timer & Status
  status: WatchStatus;
  progress: number; // For movies: minutes watched; For series: episodes watched
  history?: { date: string; duration: number; action: string }[];

  // Enhanced Details
  overview?: string; // Content Overview (Plot)
  review?: string; // User's Thoughts/Memories
  images?: string[]; // Stills/Backdrops
  seasons?: {
    season_number: number;
    name: string;
    poster_path?: string;
    episodes: {
      episode_number: number;
      name: string;
      overview: string;
      still_path?: string;
      air_date?: string;
      runtime?: number;
    }[];
  }[];
}

export interface FilterState {
  search: string;
  type: MovieType | 'All';
  tag: string;
  sort: 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc';
}


export type FilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'between';

export interface FilterRule {
  id: string;
  field: keyof MovieRecord;
  operator: FilterOperator;
  value: any;
}

export interface SavedView {
  id: string;
  name: string;
  icon: string;
  rules: FilterRule[];
}

export interface AppSettings {
  tmdbApiKey: string;
  aiProvider: 'Mock' | 'OpenAI' | 'Gemini' | 'DeepSeek';
  aiApiKey: string;
  aiModel: string;
  savedViews: SavedView[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  movieIds: string[];
  createdAt: string;
}

export interface AiAnalysisResult {
  keywords: string[];
  analysis: string;
  recommendations: {
    title: string;
    reason: string;
  }[];
}

export interface BackupData {
  version: number;
  timestamp: string;
  movies: MovieRecord[];
  settings: AppSettings;
  theme: 'dark' | 'light';
}