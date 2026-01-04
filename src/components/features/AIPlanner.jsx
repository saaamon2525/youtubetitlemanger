import React, { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { generateWithGemini } from '../../lib/gemini';
import { generateWithOpenAI } from '../../lib/openai';
import Button from '../ui/Button';
import { Sparkles, Copy, RefreshCw, FileText, Tag, Type } from 'lucide-react';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

const AIPlanner = ({ startKeyword }) => {
    const { apiKeys, selectedModel, customInstructions, currentStockGroupId } = useSettings();
    const [keyword, setKeyword] = useState(startKeyword || '');
    const [context, setContext] = useState('');
    const [useProfile, setUseProfile] = useState(true); // Default to true if available
    const [useStocked, setUseStocked] = useState(true);
    const [useSearch, setUseSearch] = useState(false);
    const [resultData, setResultData] = useState(null); // JSON Parsed data
    const [rawResult, setRawResult] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    // History State
    const [keywordHistory, setKeywordHistory] = useState([]);
    const [contextHistory, setContextHistory] = useState([]);
    const [showKwHistory, setShowKwHistory] = useState(false);
    const [showCtxHistory, setShowCtxHistory] = useState(false);

    const profile = useLiveQuery(() => db.channelProfile.get('myProfile'));
    const hasProfile = !!profile?.styleData;

    // Fetch stocked videos for current group
    const stockedVideos = useLiveQuery(async () => {
        if (!currentStockGroupId) return [];
        return await db.videos.where('[status+groupId]').equals(['stock', currentStockGroupId]).toArray();
    }, [currentStockGroupId]);
    const hasStocked = stockedVideos?.length > 0;

    // Load history on mount
    React.useEffect(() => {
        const kwh = JSON.parse(localStorage.getItem('history_keywords') || '[]');
        const ctxh = JSON.parse(localStorage.getItem('history_contexts') || '[]');
        setKeywordHistory(kwh);
        setContextHistory(ctxh);
    }, []);

    // Update local state when prop changes
    React.useEffect(() => {
        if (startKeyword) setKeyword(startKeyword);
    }, [startKeyword]);

    const addToHistory = (type, value) => {
        if (!value.trim()) return;
        if (type === 'keyword') {
            const newHist = [value, ...keywordHistory.filter(h => h !== value)].slice(0, 10);
            setKeywordHistory(newHist);
            localStorage.setItem('history_keywords', JSON.stringify(newHist));
        } else {
            const newHist = [value, ...contextHistory.filter(h => h !== value)].slice(0, 10);
            setContextHistory(newHist);
            localStorage.setItem('history_contexts', JSON.stringify(newHist));
        }
    };

    const handleGenerate = async () => {
        if (!keyword) return;

        // Save history before generating
        addToHistory('keyword', keyword);
        if (context) addToHistory('context', context);

        console.log("Starting Generation...", { keyword, context });
        setIsGenerating(true);
        setError(null);
        setResultData(null);
        setRawResult('');


        // ... (rest of function) ...

        let systemPrompt = `あなたはプロのYouTube作家です。
指定された「キーワード」と「コンテキスト」を使って、クリック率（CTR）が高く、視聴維持率が見込める動画企画を提案してください。

出力は以下のJSON形式のみで返してください。マークダウンのcode blockで囲んでも構いませんが、中身は必ず正しいJSONにしてください。

{
  "titles": [
     {"text": "タイトル案1", "reason": "クリックを誘う理由（短く）"},
     {"text": "タイトル案2", "reason": "..."}
  ],
  "description": "概要欄の構成案（箇条書きなどで）...",
  "tags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"]
}

出力言語: 日本語`;

        // Inject Custom Instructions
        if (customInstructions && customInstructions.trim()) {
            systemPrompt += `\n\n【ユーザー定義のカスタム指示 (重要)】\n${customInstructions}`;
        }

        if (useProfile && hasProfile) {
            const style = profile.styleData;
            systemPrompt += `\n\n【重要：チャンネルスタイルの適用】
このチャンネルのタイトルは以下の特徴があります。これを可能な限り模倣してください：
"${style.titleStyle}"
タイトルの型: ${style.titleTemplate}

また、概要欄には以下の定型文を必ず含めてください：
"${style.descriptionTemplate}"`;
        }

        if (useStocked && hasStocked) {
            const referenceTitles = stockedVideos.map(v => v.title).join('\n');
            systemPrompt += `\n\n【参考タイトル（ストック済み）】
以下の動画タイトルも参考にしつつ、これらよりも魅力的なタイトルを作ってください：
${referenceTitles}`;
        }

        const userPrompt = `キーワード: ${keyword}\n追加コンテキスト: ${context}`;

        try {
            let output = '';
            if (selectedModel === 'gemini') {
                output = await generateWithGemini(userPrompt, systemPrompt, useSearch);
            } else {
                output = await generateWithOpenAI(userPrompt, systemPrompt);
            }

            console.log("Raw Output received:", output);
            setRawResult(output);

            // Simple JSON extraction
            let jsonString = output;
            // If wrapped in markdown code blocks, remove them
            const match = output.match(/```json([\s\S]*?)```/) || output.match(/```([\s\S]*?)```/);
            if (match) {
                jsonString = match[1];
            }

            try {
                const parsed = JSON.parse(jsonString);
                setResultData(parsed);
            } catch (e) {
                console.warn("JSON Parse failed", e);
                // Fallback to displaying raw text if JSON is broken
            }

        } catch (err) {
            console.error(err);
            let msg = err.message || JSON.stringify(err);

            if (msg.includes('404') || msg.includes('not found') || msg.includes('429')) {
                msg += "\n\nモデルエラーの可能性があります。";
                try {
                    const { getAvailableGeminiModels } = await import('../../lib/gemini');
                    const models = await getAvailableGeminiModels();
                    msg = `【モデルエラー】\n現在の設定: ${selectedModel}\n利用可能なモデル一覧:\n${models}\n\n詳細: ${err.message}`;
                } catch (e) {
                    msg += " (モデル一覧取得失敗)";
                }
            }
            setError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could add toaster here
    };

    return (
        <div className="ai-planner">
            <h3>AI企画プランニング</h3>

            {/* Keyword Input with History */}
            <div className="form-group relative">
                <div className="label-row">
                    <label>ターゲットキーワード</label>
                    {keywordHistory.length > 0 && (
                        <button
                            className="history-btn"
                            onClick={() => setShowKwHistory(!showKwHistory)}
                            title="履歴"
                        >
                            <RefreshCw size={12} /> 履歴
                        </button>
                    )}
                </div>
                <input
                    className="input"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="例: マインクラフト"
                />
                {showKwHistory && (
                    <div className="history-dropdown">
                        {keywordHistory.map((h, i) => (
                            <div key={i} className="history-item" onClick={() => { setKeyword(h); setShowKwHistory(false); }}>
                                {h}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Context Input with History */}
            <div className="form-group relative">
                <div className="label-row">
                    <label>コンテキスト / スタイル (任意)</label>
                    {contextHistory.length > 0 && (
                        <button
                            className="history-btn"
                            onClick={() => setShowCtxHistory(!showCtxHistory)}
                            title="履歴"
                        >
                            <RefreshCw size={12} /> 履歴
                        </button>
                    )}
                </div>
                <textarea
                    className="input textarea"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="例: 初心者向け、テンポよく解説..."
                    rows={2}
                />
                {showCtxHistory && (
                    <div className="history-dropdown">
                        {contextHistory.map((h, i) => (
                            <div key={i} className="history-item" onClick={() => { setContext(h); setShowCtxHistory(false); }}>
                                {h}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {hasProfile && (
                <div className="style-option">
                    <label>
                        <input
                            type="checkbox"
                            checked={useProfile}
                            onChange={(e) => setUseProfile(e.target.checked)}
                        />
                        自分のチャンネルスタイル（分析済み）を適用する
                    </label>
                </div>
            )}

            {hasStocked && (
                <div className="style-option">
                    <label>
                        <input
                            type="checkbox"
                            checked={useStocked}
                            onChange={(e) => setUseStocked(e.target.checked)}
                        />
                        ストック済みの動画タイトルを参考にする ({stockedVideos.length}件)
                    </label>
                </div>
            )}

            {/* Google Search Grounding Option (Only for Gemini) */}
            {selectedModel === 'gemini' && (
                <div className="style-option">
                    <label title="Geminiの検索機能を使って、最新情報やゲームの詳細を調べてから生成します">
                        <input
                            type="checkbox"
                            checked={useSearch}
                            onChange={(e) => setUseSearch(e.target.checked)}
                        />
                        Google検索で情報を補完する (Grounding)
                    </label>
                </div>
            )}

            <Button
                onClick={handleGenerate}
                disabled={isGenerating || !keyword}
                style={{ width: '100%' }}
            >
                <Sparkles size={16} /> {isGenerating ? '生成中...' : '企画案を生成'}
            </Button>

            {error && <div className="error">{error}</div>}

            {/* Render Structured Results */}
            {resultData && (
                <div className="results-container">
                    <h4><Type size={16} /> タイトル案</h4>
                    <div className="title-cards">
                        {resultData.titles?.map((t, idx) => (
                            <div key={idx} className="title-card">
                                <div className="title-text">{t.text || t}</div>
                                {t.reason && <div className="title-reason">{t.reason}</div>}
                                <button className="copy-btn" onClick={() => copyToClipboard(t.text || t)}>
                                    <Copy size={14} /> コピー
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="meta-section">
                        <div className="meta-block">
                            <h4><FileText size={16} /> 概要欄構成</h4>
                            <div className="desc-content">
                                {resultData.description}
                                <button className="copy-icon-btn" onClick={() => copyToClipboard(resultData.description)}>
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="meta-block">
                            <h4><Tag size={16} /> 推奨タグ</h4>
                            <div className="tags-list">
                                {resultData.tags?.map(tag => (
                                    <span key={tag} className="tag-chip" onClick={() => copyToClipboard(tag)}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fallback or Raw Toggle could go here if needed, but for now just fallback if no parsed data */}
            {!resultData && rawResult && (
                <div className="results-area">
                    <div className="results-header">
                        <h4>AIからの提案 (Raw)</h4>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(rawResult)}>
                            <Copy size={16} />
                        </Button>
                    </div>
                    <div className="markdown-preview">
                        {rawResult.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
        .ai-planner {
          padding: 16px;
          padding-bottom: 80px; /* Extra space for scrolling */
          margin-top: 16px;
          border-top: 1px solid var(--divider-color);
        }
        .ai-planner h3 { margin-top: 0; font-size: 1.1rem; }
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; margin-bottom: 4px; color: var(--text-secondary); font-size: 0.9rem; }
        .input {
          width: 100%;
          padding: 8px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
        }
        .textarea { resize: vertical; }
        .style-option { margin-bottom: 12px; font-size: 0.9rem; }
        .style-option label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--accent-color); }
        .error { color: var(--error-color); margin-top: 8px; font-size: 0.9rem; white-space: pre-wrap; }
        
        .relative { position: relative; }
        .label-row { display: flex; justify-content: space-between; align-items: center; mb-1; }
        .history-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.8rem; }
        .history-btn:hover { color: var(--accent-color); }
        
        .history-dropdown {
            position: absolute; top: 100%; right: 0; left: 0;
            background: var(--bg-secondary); border: 1px solid var(--border-color);
            z-index: 10; max-height: 200px; overflow-y: auto;
            border-radius: var(--radius-sm); box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .history-item { padding: 8px; cursor: pointer; font-size: 0.9rem; border-bottom: 1px solid var(--divider-color); }
        .history-item:hover { background: var(--bg-hover); color: var(--accent-color); }

        
        /* Structured Results */
        .results-container {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .results-container h4 {
           margin: 0 0 8px 0;
           font-size: 0.95rem;
           color: var(--accent-color);
           display: flex;
           align-items: center;
           gap: 6px;
        }
        .title-cards {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .title-card {
           background: var(--bg-secondary);
           border: 1px solid var(--border-color);
           padding: 10px;
           border-radius: var(--radius-sm);
           position: relative;
        }
        .title-text {
           font-weight: bold;
           font-size: 1rem;
           margin-bottom: 4px;
           padding-right: 60px; /* Space for copy btn */
        }
        .title-reason {
           font-size: 0.8rem;
           color: var(--text-secondary);
        }
        .copy-btn {
           position: absolute;
           top: 8px;
           right: 8px;
           background: var(--bg-hover);
           border: 1px solid var(--border-color);
           color: var(--text-primary);
           border-radius: 4px;
           padding: 2px 8px;
           font-size: 0.75rem;
           cursor: pointer;
           display: flex;
           align-items: center;
           gap: 4px;
        }
        .copy-btn:hover { background: var(--accent-color); color: #000; border-color: var(--accent-color); }

        .meta-section {
           display: flex;
           flex-direction: column;
           gap: 12px;
        }
        .meta-block {
           background: var(--bg-secondary);
           border: 1px solid var(--border-color);
           padding: 10px;
           border-radius: var(--radius-sm);
           position: relative;
        }
        .desc-content {
           white-space: pre-wrap;
           font-size: 0.9rem;
           line-height: 1.5;
        }
        .copy-icon-btn {
           position: absolute;
           top: 8px;
           right: 8px;
           background: transparent;
           border: none;
           color: var(--text-secondary);
           cursor: pointer;
        }
        .copy-icon-btn:hover { color: var(--text-primary); }

        .tags-list {
           display: flex;
           flex-wrap: wrap;
           gap: 6px;
        }
        .tag-chip {
           background: var(--bg-hover);
           color: var(--text-primary);
           padding: 4px 8px;
           border-radius: 12px;
           font-size: 0.85rem;
           cursor: pointer;
        }
        .tag-chip:hover {
           background: var(--accent-color);
           color: #000;
        }

        /* Legacy Raw View */
        .results-area {
          margin-top: 16px;
          background: var(--bg-hover);
          padding: 12px;
          border-radius: var(--radius-md);
        }
        .results-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }
        .markdown-preview p { margin: 4px 0; font-size: 0.95rem; white-space: pre-wrap; }
      `}</style>
        </div>
    );
};

export default AIPlanner;
