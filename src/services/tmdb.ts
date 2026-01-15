import { MovieRecord } from '../types';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

interface TMDBSearchResult {
    id: number;
    title?: string;
    name?: string; // For TV shows
    media_type: 'movie' | 'tv';
    poster_path?: string;
    release_date?: string;
    first_air_date?: string; // For TV shows
    overview: string;
}

interface TMDBDetail {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string;
    release_date?: string;
    first_air_date?: string;
    overview: string;
    runtime?: number;
    episode_run_time?: number[];
    credits?: {
        cast: { name: string }[];
        crew: { name: string; job: string }[];
    };
    genres?: { name: string }[];
    vote_average?: number;
    original_title?: string;
    original_name?: string;
    number_of_episodes?: number;
}

export const searchTMDB = async (query: string, apiKey: string): Promise<TMDBSearchResult[]> => {
    if (!query || !apiKey) return [];
    try {
        const response = await fetch(`${BASE_URL}/search/multi?api_key=${apiKey}&language=zh-CN&query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
    } catch (error) {
        console.error("TMDB Search Error:", error);
        return [];
    }
};

export const getTMDBDetails = async (id: number, type: 'movie' | 'tv', apiKey: string): Promise<Partial<MovieRecord> | null> => {
    if (!id || !apiKey) return null;
    try {
        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${apiKey}&language=zh-CN&append_to_response=credits,images&include_image_language=zh,null`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data: any = await response.json();

        // Map to MovieRecord
        const title = data.title || data.name || 'Unknown';
        const originalTitle = data.original_title || data.original_name;
        const year = new Date(data.release_date || data.first_air_date || '').getFullYear() || 0;
        const coverUrl = data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : '';
        const actors = data.credits?.cast.slice(0, 5).map((c: any) => c.name) || [];
        const director = data.credits?.crew.find((c: any) => c.job === 'Director')?.name;
        const duration = data.runtime || (data.episode_run_time && data.episode_run_time.length > 0 ? data.episode_run_time[0] : 0);
        const tags = data.genres?.map((g: any) => g.name) || [];
        const overview = data.overview;
        const doubanRating = data.vote_average;
        const episodes = type === 'movie' ? 1 : (data.number_of_episodes || 1);

        // Images (Backdrops preferred)
        const images = data.images?.backdrops?.map((b: any) => `${IMAGE_BASE_URL}${b.file_path}`).slice(0, 10) || [];

        return {
            tmdbId: data.id,
            title,
            originalTitle,
            coverUrl,
            year,
            actors,
            director,
            duration,
            tags,
            overview, // Use proper field name
            doubanRating, // Use TMDB rating as external rating
            episodes,
            type: type === 'movie' ? 'Movie' : 'Series',
            images,
            // For series, we assume season 1 initially if tracking, but can be updated later
            season: type === 'tv' ? 1 : undefined
        };
    } catch (error) {
        console.error("TMDB Detail Error:", error);
        return null;
    }
};

export const getTMDBSeasonDetails = async (id: number, seasonNumber: number, apiKey: string) => {
    try {
        const response = await fetch(`${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${apiKey}&language=zh-CN`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
            season_number: data.season_number,
            name: data.name,
            poster_path: data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : undefined,
            episodes: data.episodes?.map((e: any) => ({
                episode_number: e.episode_number,
                name: e.name,
                overview: e.overview,
                still_path: e.still_path ? `${IMAGE_BASE_URL}${e.still_path}` : undefined,
                air_date: e.air_date,
                runtime: e.runtime
            })) || []
        };
    } catch (error) {
        console.error("Failed to fetch season details", error);
        return null;
    }
};
