import React, { useState } from 'react';
import { BrainCircuit, Sparkles, Quote, Lightbulb, Film, X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { AiAnalysisResult } from '../types';

export default function Analysis() {
    const { movies, appSettings } = useData();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | string | null>(null);

    const runAiAnalysis = async () => {
        if (movies.length === 0) { alert("无数据"); return; }
        setIsAnalyzing(true);
        setAiAnalysis(null);
        const isMock = appSettings.aiProvider === 'Mock';

        if (!isMock && !appSettings.aiApiKey) { alert(`请配置 ${appSettings.aiProvider} API Key`); setIsAnalyzing(false); return; }

        try {
            const movieDataStr = movies.slice(0, 30).map(m => `《${m.title}》- ${m.rating}分, 类型:${m.tags.join('/')}, 导演:${m.director}`).join('\n');
            const systemPrompt = `你是一位资深电影评论家。请根据用户的观影记录，生成一份 JSON 格式的分析报告。JSON 结构如下：{ "keywords": [], "analysis": "", "recommendations": [{ "title": "", "reason": "" }] }`;

            let resultStr = '';
            if (isMock) {
                await new Promise(r => setTimeout(r, 2000));
                setAiAnalysis({
                    keywords: ["硬核科幻", "诺兰信徒", "高智商叙事", "视觉控"],
                    analysis: "您的观影品味非常独特，明显偏好宏大的叙事结构和复杂的哲学探讨...",
                    recommendations: [{ title: "降临 (Arrival)", reason: "同样的硬核科幻内核..." }]
                });
                setIsAnalyzing(false);
                return;
            } else {
                const endpoint = appSettings.aiProvider === 'OpenAI' ? 'https://api.openai.com/v1/chat/completions' :
                    appSettings.aiProvider === 'DeepSeek' ? 'https://api.deepseek.com/chat/completions' :
                        `https://generativelanguage.googleapis.com/v1beta/models/${appSettings.aiModel}:generateContent?key=${appSettings.aiApiKey}`;
                const body = appSettings.aiProvider === 'Gemini' ?
                    { contents: [{ parts: [{ text: systemPrompt + "\n\n用户数据:\n" + movieDataStr }] }] } :
                    { model: appSettings.aiModel, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: movieDataStr }] };

                const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(appSettings.aiProvider !== 'Gemini' && { 'Authorization': `Bearer ${appSettings.aiApiKey}` }) }, body: JSON.stringify(body) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error?.message || "API 请求失败");
                resultStr = appSettings.aiProvider === 'Gemini' ? data.candidates?.[0]?.content?.parts?.[0]?.text : data.choices?.[0]?.message?.content;
            }

            if (resultStr) {
                const cleanStr = resultStr.replace(/```json/g, '').replace(/```/g, '').trim();
                setAiAnalysis(JSON.parse(cleanStr));
            } else { throw new Error("未获取到有效返回内容"); }
        } catch (e: any) { console.error(e); setAiAnalysis(`分析失败: ${e.message}`); } finally { setIsAnalyzing(false); }
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <div className="text-center mb-10"><div className="inline-flex items-center justify-center p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-600/30 dark:shadow-purple-900/30 mb-6"><BrainCircuit size={32} className="text-white" /></div><h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">AI 观影助手</h1><p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">当前模型: <span className="text-purple-600 dark:text-purple-400 font-mono">{appSettings.aiProvider === 'Mock' ? 'Mock (内置)' : appSettings.aiModel}</span></p></div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-8 shadow-xl">
                {!aiAnalysis ? (
                    <div className="text-center py-10"><p className="text-slate-500 dark:text-slate-400 mb-8">点击下方按钮开始分析您的 {movies.length} 条观影数据</p><button onClick={runAiAnalysis} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20">{isAnalyzing ? <><div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> 正在分析...</> : <><BrainCircuit size={20} /> 生成分析报告</>}</button></div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        {typeof aiAnalysis === 'string' ? (<div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-200">{aiAnalysis}</div>) : (
                            <>
                                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6 border border-gray-100 dark:border-slate-700/50"><h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Sparkles size={16} /> 您的观影画像</h3><div className="flex flex-wrap gap-3">{aiAnalysis.keywords.map((keyword: string, i: number) => <span key={i} className="px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-900/40 border border-purple-100 dark:border-purple-700/50 text-purple-700 dark:text-purple-100 font-medium shadow-sm">{keyword}</span>)}</div></div>
                                <div className="bg-blue-50/50 dark:bg-slate-800/50 rounded-xl p-6 border border-blue-100 dark:border-slate-700/50 relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10"><Quote size={80} className="text-slate-900 dark:text-white" /></div><h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2"><BrainCircuit size={16} /> 深度解读</h3><p className="text-slate-700 dark:text-slate-300 leading-loose text-lg font-light relative z-10">{aiAnalysis.analysis}</p></div>
                                <div><h3 className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Lightbulb size={16} /> 专属推荐</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{aiAnalysis.recommendations.map((rec: any, i: number) => <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-200 dark:border-slate-700 hover:border-green-500/30 transition group h-full flex flex-col shadow-sm dark:shadow-none"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 group-hover:text-green-600 dark:group-hover:text-green-400 transition"><Film size={18} /></div><h4 className="font-bold text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition">{rec.title}</h4></div><p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1">{rec.reason}</p></div>)}</div></div>
                                <div className="flex justify-center pt-8"><button onClick={() => setAiAnalysis(null)} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-white transition flex items-center gap-2"><X size={14} /> 清除分析结果</button></div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
