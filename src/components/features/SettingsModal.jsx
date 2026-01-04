import React, { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import Button from '../ui/Button';
import DataManagement from './DataManagement';

import { analyzeChannelStyle } from '../../lib/analyzer';
import { db } from '../../db/db';

const SettingsModal = () => {
    const { apiKeys, selectedModel, channelId, customInstructions, saveSettings, isOpen, closeSettings } = useSettings();
    const [localKeys, setLocalKeys] = useState(apiKeys);
    const [localModel, setLocalModel] = useState(selectedModel);
    const [localChannelId, setLocalChannelId] = useState(channelId);
    const [localInstructions, setLocalInstructions] = useState(customInstructions);

    // Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('');
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLocalKeys(apiKeys);
            setLocalModel(selectedModel);
            setLocalChannelId(channelId);
            setLocalInstructions(customInstructions);
            loadProfile();
        }
    }, [isOpen, apiKeys, selectedModel, channelId, customInstructions]);

    const loadProfile = async () => {
        const profile = await db.channelProfile.get('myProfile');
        if (profile) setProfileData(profile.styleData);
    };

    const handleSave = () => {
        saveSettings(localKeys, localModel, localChannelId, localInstructions);
        closeSettings();
    };

    const runAnalysis = async () => {
        if (!localChannelId || !localKeys.youtube || (!localKeys.gemini && !localKeys.openai)) {
            setAnalysisStatus("APIキーとチャンネルIDが必要です");
            return;
        }

        setIsAnalyzing(true);
        setAnalysisStatus("分析中... 直近の動画を取得しています");

        try {
            const result = await analyzeChannelStyle({
                youtubeKey: localKeys.youtube,
                aiKey: localKeys.gemini || localKeys.openai, // Prefer Gemini logic or current selected
                channelId: localChannelId
            });

            await db.channelProfile.put({ key: 'myProfile', channelId: localChannelId, styleData: result, lastAnalyzed: new Date() });
            setProfileData(result);
            setAnalysisStatus("分析完了！スタイルが保存されました。");
        } catch (e) {
            console.error(e);
            setAnalysisStatus("分析失敗: " + e.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>設定</h2>

                {/* --- API Keys Section (Collapsed or standard) --- */}
                <div className="scroll-area">
                    <div className="form-group">
                        <label>AIモデル</label>
                        <select
                            value={localModel}
                            onChange={(e) => setLocalModel(e.target.value)}
                            className="input-select"
                        >
                            <option value="gemini">Google Gemini (推奨)</option>
                            <option value="openai">OpenAI GPT-4o-mini</option>
                        </select>
                    </div>

                    <div className="api-keys-grid">
                        <div className="form-group">
                            <label>Gemini Key</label>
                            <input
                                type="password"
                                value={localKeys.gemini}
                                onChange={(e) => setLocalKeys({ ...localKeys, gemini: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>YouTube Key</label>
                            <input
                                type="password"
                                value={localKeys.youtube}
                                onChange={(e) => setLocalKeys({ ...localKeys, youtube: e.target.value })}
                            />
                        </div>
                    </div>

                    <hr className="divider" />

                    {/* --- Custom Instructions Section --- */}
                    <div className="form-group">
                        <label>AIへのカスタム指示 (Prompt)</label>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            すべてのAI生成時に、システムプロンプトとして追加されます。(例: 「常に明るい口調で」「専門用語は避けて」など)
                        </div>
                        <textarea
                            value={localInstructions}
                            onChange={(e) => setLocalInstructions(e.target.value)}
                            placeholder="ここに独自のルールを入力..."
                            rows={3}
                            style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', resize: 'vertical' }}
                        />
                    </div>

                    <hr className="divider" />

                    {/* --- Channel Analysis Section --- */}
                    <div className="analysis-section">
                        <h3>自チャンネル分析 (Beta)</h3>
                        <div className="form-group">
                            <label>チャンネルID (例: UC...)</label>
                            <div className="input-with-btn">
                                <input
                                    value={localChannelId}
                                    onChange={(e) => setLocalChannelId(e.target.value)}
                                    placeholder="UCxxxxxxxxxxxx"
                                />
                                <Button
                                    onClick={runAnalysis}
                                    disabled={isAnalyzing || !localChannelId}
                                    size="sm"
                                >
                                    {isAnalyzing ? '分析中...' : 'スタイル分析'}
                                </Button>
                            </div>
                        </div>
                        {analysisStatus && <div className="status-msg">{analysisStatus}</div>}

                        {profileData && (
                            <div className="profile-preview">
                                <label>検出されたスタイル:</label>
                                <div className="preview-box">
                                    <div className="tag-row">
                                        <span className="badge">タイトル型</span>
                                        <span>{profileData.titleTemplate || '不明'}</span>
                                    </div>
                                    <div className="tag-row">
                                        <span className="badge">概要欄定型</span>
                                        <span className="truncate">{profileData.descriptionTemplate ? 'あり' : 'なし'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-actions">
                    <DataManagement /> {/* Moved here for layout balance or keep below */}
                    <div className="btn-group">
                        <Button variant="ghost" onClick={closeSettings}>キャンセル</Button>
                        <Button onClick={handleSave}>設定を保存</Button>
                    </div>
                </div>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
          background: var(--bg-secondary);
          padding: 24px;
          border-radius: var(--radius-md);
          width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          display: flex; flex-direction: column;
        }
        .scroll-area { overflow-y: auto; flex: 1; }
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; margin-bottom: 4px; color: var(--text-secondary); font-size: 0.85rem; }
        .form-group input, .form-group select {
          width: 100%; padding: 8px; background: var(--bg-input);
          border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-sm);
        }
        .api-keys-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .divider { border: 0; border-top: 1px solid var(--divider-color); margin: 16px 0; }
        
        .input-with-btn { display: flex; gap: 8px; }
        .input-with-btn input { flex: 1; }
        
        .analysis-section h3 { margin: 0 0 12px 0; font-size: 1rem; color: var(--accent-color); }
        .status-msg { font-size: 0.8rem; color: var(--text-primary); margin-top: 4px; }
        
        .profile-preview { margin-top: 12px; background: var(--bg-primary); padding: 8px; border-radius: 4px; border: 1px solid var(--divider-color); }
        .preview-box { font-size: 0.8rem; }
        .tag-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .badge { background: var(--bg-hover); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; color: var(--text-secondary); }
        .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

        .modal-actions {
          margin-top: 16px; pt-4; border-top: 1px solid var(--divider-color);
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
        }
        .btn-group { display: flex; gap: 8px; }
      `}</style>
        </div>
    );
};



export default SettingsModal;
