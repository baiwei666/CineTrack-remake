import { MovieRecord, AppSettings } from '../types';

export interface CollectionSuggestion {
    id: string;
    name: string;
    description: string;
    movieIds: string[];
    movies: MovieRecord[];
    reason: string;
    confidence: number;
}

interface AIResponse {
    suggestions: {
        name: string;
        description: string;
        movieIds: string[];
        reason: string;
        confidence: number;
    }[];
}

export interface BatchProgress {
    current: number;
    total: number;
    status: string;
}

const BATCH_SIZE = 30;

/**
 * Analyzes a single batch of movies
 */
async function analyzeBatch(
    movies: MovieRecord[],
    appSettings: AppSettings,
    allMoviesMap: Map<string, MovieRecord>
): Promise<CollectionSuggestion[]> {
    const movieDataForAI = movies.map(m => ({
        id: m.id,
        title: m.title,
        year: m.year,
        director: m.director,
        collectionId: m.collectionId,
        collectionName: m.collectionName,
    }));

    const systemPrompt = `你是电影合集整理助手。根据电影列表建议合集分组。分组依据：1.同系列电影(collectionId相同) 2.相似标题(如星球大战1/2/3) 3.同导演作品(>=3部)。要求：每合集>=2部电影，优先用collectionId。返回JSON：{"suggestions":[{"name":"名称","description":"描述","movieIds":["id1","id2"],"reason":"原因","confidence":95}]}。只返回JSON。`;

    const userContent = `分析这${movies.length}部电影：${JSON.stringify(movieDataForAI)}`;

    const endpoint = appSettings.aiProvider === 'OpenAI'
        ? 'https://api.openai.com/v1/chat/completions'
        : appSettings.aiProvider === 'DeepSeek'
            ? 'https://api.deepseek.com/chat/completions'
            : `https://generativelanguage.googleapis.com/v1beta/models/${appSettings.aiModel}:generateContent?key=${appSettings.aiApiKey}`;

    const body = appSettings.aiProvider === 'Gemini'
        ? {
            contents: [{ parts: [{ text: systemPrompt + "\n\n" + userContent }] }],
            generationConfig: { maxOutputTokens: 4096 }
        }
        : {
            model: appSettings.aiModel,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            temperature: 0.3,
            max_tokens: 4096
        };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (appSettings.aiProvider !== 'Gemini') {
        headers['Authorization'] = `Bearer ${appSettings.aiApiKey}`;
    }

    const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error?.message || `API 请求失败: ${res.status}`);
    }

    const resultStr = appSettings.aiProvider === 'Gemini'
        ? data.candidates?.[0]?.content?.parts?.[0]?.text
        : data.choices?.[0]?.message?.content;

    if (!resultStr) {
        throw new Error('未获取到有效返回内容');
    }

    const cleanStr = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed: AIResponse = JSON.parse(cleanStr);

    return (parsed.suggestions || [])
        .filter(s => s.movieIds && s.movieIds.length >= 2)
        .map((s, index) => ({
            id: `ai-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
            name: s.name,
            description: s.description,
            movieIds: s.movieIds.filter(id => allMoviesMap.has(id)),
            movies: s.movieIds
                .filter(id => allMoviesMap.has(id))
                .map(id => allMoviesMap.get(id)!),
            reason: s.reason,
            confidence: s.confidence
        }))
        .filter(s => s.movieIds.length >= 2);
}

/**
 * Merge suggestions from multiple batches, deduplicating by collection name
 */
function mergeSuggestions(allSuggestions: CollectionSuggestion[]): CollectionSuggestion[] {
    const merged = new Map<string, CollectionSuggestion>();

    for (const suggestion of allSuggestions) {
        const key = suggestion.name.toLowerCase().trim();

        if (merged.has(key)) {
            // Merge movie IDs
            const existing = merged.get(key)!;
            const combinedIds = [...new Set([...existing.movieIds, ...suggestion.movieIds])];
            existing.movieIds = combinedIds;
            existing.movies = combinedIds.map(id =>
                suggestion.movies.find(m => m.id === id) || existing.movies.find(m => m.id === id)!
            ).filter(Boolean);
            // Keep higher confidence
            existing.confidence = Math.max(existing.confidence, suggestion.confidence);
        } else {
            merged.set(key, { ...suggestion });
        }
    }

    return Array.from(merged.values())
        .filter(s => s.movieIds.length >= 2)
        .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Analyzes ALL movies using batched API calls with progress callback
 */
export async function analyzeForCollectionsBatched(
    movies: MovieRecord[],
    appSettings: AppSettings,
    onProgress?: (progress: BatchProgress) => void
): Promise<CollectionSuggestion[]> {
    console.log('[AIService] analyzeForCollectionsBatched called');
    console.log('[AIService] Total movies:', movies.length);

    if (movies.length === 0) {
        return [];
    }

    if (appSettings.aiProvider === 'Mock' || !appSettings.aiApiKey) {
        throw new Error('NO_AI_CONFIG');
    }

    const allMoviesMap = new Map(movies.map(m => [m.id, m]));
    const batches: MovieRecord[][] = [];

    // Split into batches
    for (let i = 0; i < movies.length; i += BATCH_SIZE) {
        batches.push(movies.slice(i, i + BATCH_SIZE));
    }

    console.log('[AIService] Split into', batches.length, 'batches');

    const allSuggestions: CollectionSuggestion[] = [];

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        onProgress?.({
            current: i + 1,
            total: batches.length,
            status: `正在分析第 ${i + 1}/${batches.length} 批 (${batch.length} 部电影)...`
        });

        try {
            console.log(`[AIService] Processing batch ${i + 1}/${batches.length}`);
            const batchSuggestions = await analyzeBatch(batch, appSettings, allMoviesMap);
            allSuggestions.push(...batchSuggestions);
            console.log(`[AIService] Batch ${i + 1} returned ${batchSuggestions.length} suggestions`);
        } catch (error: any) {
            console.error(`[AIService] Batch ${i + 1} failed:`, error.message);
            // Continue with other batches
        }

        // Small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    onProgress?.({
        current: batches.length,
        total: batches.length,
        status: '正在合并结果...'
    });

    const merged = mergeSuggestions(allSuggestions);
    console.log('[AIService] Merged to', merged.length, 'unique suggestions');

    return merged;
}

// ==========================================
// AI Analysis Report Logic (Map-Reduce)
// ==========================================

import { LibraryInsights } from '../types';

interface BatchStats {
    keywords: string[];
    genres: Record<string, number>;
    directors: Record<string, number>;
    highRatedMovies: string[]; // Keep track of top movies for context
}

/**
 * Pass 1: Analyze a batch to just extract raw stats (cheaper/faster)
 */
async function analyzeBatchForStats(
    movies: MovieRecord[],
    appSettings: AppSettings
): Promise<BatchStats> {
    // We can actually do this LOCALLY for the most part to save tokens!
    // But for "Subjective Keywords" or "Vibe", we might need AI.
    // Let's try a hybrid: Calculate hard stats locally, use AI for "Vibe Keywords" only.

    // 1. Local Stats Calculation
    const genres: Record<string, number> = {};
    const directors: Record<string, number> = {};
    const highRated = movies.filter(m => m.rating >= 8).map(m => m.title);

    movies.forEach(m => {
        // Genres/Tags
        m.tags.forEach(t => {
            genres[t] = (genres[t] || 0) + 1;
        });
        // Director
        if (m.director) {
            directors[m.director] = (directors[m.director] || 0) + 1;
        }
    });

    // 2. AI for Keywords (Optional - maybe we just skip this per batch to save time? 
    // Actually, getting keywords per batch allows us to find "micro-trends". 
    // Let's do a lightweight AI call or just rely on tags if we want speed.
    // For now, let's purely aggregate local stats to be super fast and efficient, 
    // and ONLY do one big AI call at the end with the aggregated stats.)

    return {
        keywords: [], // We'll let the final pass generate keywords based on the top stats
        genres,
        directors,
        highRatedMovies: highRated
    };
}

/**
 * Final Pass: Generate comprehensive insights from aggregated stats
 */
async function generateFinalReport(
    totalMovies: number,
    aggregatedStats: BatchStats,
    sampleMovies: MovieRecord[],
    appSettings: AppSettings
): Promise<LibraryInsights> {
    const topGenres = Object.entries(aggregatedStats.genres)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([k, v]) => `${k} (${Math.round(v / totalMovies * 100)}%)`)
        .join(', ');

    const topDirectors = Object.entries(aggregatedStats.directors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([k, v]) => k)
        .join(', ');

    const recentMovies = sampleMovies.slice(0, 20).map(m => `《${m.title}》(${m.rating}分, ${m.tags.join('/')})`).join('; ');

    const systemPrompt = `你是一位专业的电影评论家和数据分析师。我将提供一位用户的观影统计数据和部分近期片单。请据此生成一份深度的观影分析报告。
    
    返回 strict JSON 格式 (不要使用 Markdown):
    {
      "profileKeywords": ["关键词1", "关键词2", ...], // 5-8个通过数据洞察出的用户画像关键词
      "genreDistribution": [{"genre": "类型名", "percentage": 0-100, "count": 数量}], // 前6-8个主要类型分布
      "directorAnalysis": [{"name": "导演名", "count": 数量, "style": "简短风格描述"}], // 前3-5位最常看导演
      "emotionalProfile": [{"emotion": "情绪名(如: 肾上腺素/治愈/深沉)", "percentage": 0-100, "color": "Hex颜色"}], // 估算的观影情绪分布
      "watchingHabits": ["习惯1", "习惯2", ...], // 3-5条观影习惯洞察
      "deepAnalysis": "一段300字左右的深度解读，分析用户的审美品味、潜在性格和观影哲学。",
      "recommendations": [{"title": "推荐电影", "reason": "推荐理由", "matchScore": 80-100}] // 5部推荐
    }`;

    const userContent = `
    用户数据概览:
    - 总观影量: ${totalMovies}部
    - 观看最多的类型: ${topGenres}
    - 最常看导演: ${topDirectors}
    - 近期/高分电影样本: ${recentMovies}
    `;

    // Re-use request logic
    const endpoint = appSettings.aiProvider === 'OpenAI'
        ? 'https://api.openai.com/v1/chat/completions'
        : appSettings.aiProvider === 'DeepSeek'
            ? 'https://api.deepseek.com/chat/completions'
            : `https://generativelanguage.googleapis.com/v1beta/models/${appSettings.aiModel}:generateContent?key=${appSettings.aiApiKey}`;

    const body = appSettings.aiProvider === 'Gemini'
        ? {
            contents: [{ parts: [{ text: systemPrompt + "\n\n" + userContent }] }],
            generationConfig: { responseMimeType: "application/json" } // Gemini JSON mode
        }
        : {
            model: appSettings.aiModel,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userContent }
            ],
            temperature: 0.5,
            response_format: { type: "json_object" }, // OpenAI/DeepSeek JSON mode
            max_tokens: 4096
        };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (appSettings.aiProvider !== 'Gemini') {
        headers['Authorization'] = `Bearer ${appSettings.aiApiKey}`;
    }

    const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `API 请求失败: ${res.status}`);

    const resultStr = appSettings.aiProvider === 'Gemini'
        ? data.candidates?.[0]?.content?.parts?.[0]?.text
        : data.choices?.[0]?.message?.content;

    if (!resultStr) throw new Error('未获取到返回内容');

    const cleanStr = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanStr) as LibraryInsights;
}

export async function generateLibraryInsights(
    movies: MovieRecord[],
    appSettings: AppSettings,
    onProgress?: (progress: BatchProgress) => void
): Promise<LibraryInsights> {
    if (movies.length === 0) throw new Error('没有足够的电影数据进行分析');

    // 1. Map Phase: Calculate Stats Locally (Super fast)
    // We don't really need to batch this for strict "AI" reasons since it's local,
    // but splitting helps UI non-blocking if array is huge.
    // For now, just do it in one pass because local JS is fast enough for <10k items.

    onProgress?.({ current: 50, total: 100, status: '正在聚合全库数据...' });
    await new Promise(r => setTimeout(r, 100)); // UI breathe

    const batchStats = await analyzeBatchForStats(movies, appSettings);

    // 2. Reduce Phase: Send to AI
    onProgress?.({ current: 80, total: 100, status: 'AI 正在深度解读...' });

    const report = await generateFinalReport(movies.length, batchStats, movies, appSettings);

    // Add Metadata
    report.generatedAt = new Date().toISOString();

    onProgress?.({ current: 100, total: 100, status: '分析完成' });

    return report;
}
