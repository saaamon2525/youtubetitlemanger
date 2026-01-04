import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db/db';
import Button from '../ui/Button';
import { Copy, RotateCcw, RotateCw, Trash2, FilePlus, Save } from 'lucide-react';

const TABS = [
    { id: 'draft', label: '自由メモ' },
    { id: 'title', label: 'タイトル構成' },
    { id: 'description', label: '概要欄構築' },
    { id: 'tags', label: 'タグ候補' },
];

import TemplateManager from './TemplateManager';

// Sub-component for Tag Management
const TagManager = () => {
    const [activeTags, setActiveTags] = useState([]);
    const [stockedTags, setStockedTags] = useState([]);
    const [newTagInput, setNewTagInput] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadTags = async () => {
            const memo = await db.memos.get('workspace-tags-data');
            if (memo && memo.content) {
                try {
                    const data = JSON.parse(memo.content);
                    setActiveTags(data.active || []);
                    setStockedTags(data.stock || []);
                } catch (e) {
                    console.error("Failed to parse tags", e);
                }
            } else {
                // Default initial tags
                setStockedTags(['スプラトゥーン3', '実況者', 'ゲーム実況', 'Switch', '任天堂', '初心者', '攻略', '解説']);
            }
            setIsLoaded(true);
        };
        loadTags();
    }, []);

    // Save whenever state changes (after initial load)
    useEffect(() => {
        if (!isLoaded) return;
        const data = { active: activeTags, stock: stockedTags };
        db.memos.put({
            id: 'workspace-tags-data',
            type: 'tags-data',
            content: JSON.stringify(data),
            updatedAt: Date.now()
        });
    }, [activeTags, stockedTags, isLoaded]);

    const addActiveTag = (tag) => {
        if (!activeTags.includes(tag)) {
            setActiveTags([...activeTags, tag]);
        }
    };

    const removeActiveTag = (tag) => {
        setActiveTags(activeTags.filter(t => t !== tag));
    };

    const addStockedTag = () => {
        if (!newTagInput) return;

        // Split by comma (half-width or full-width) or newline
        const tags = newTagInput
            .split(/[,、\n]/)
            .map(t => t.trim())
            .filter(t => t.length > 0);

        if (tags.length === 0) return;

        const newTags = tags.filter(t => !stockedTags.includes(t));
        if (newTags.length > 0) {
            setStockedTags([...stockedTags, ...newTags]);
        }
        setNewTagInput('');
    };

    const deleteStockedTag = (tag, e) => {
        e.stopPropagation();
        if (window.confirm(`タグ「${tag}」をストックから削除しますか？`)) {
            setStockedTags(stockedTags.filter(t => t !== tag));
        }
    };

    const copyActiveTags = () => {
        const text = activeTags.join(',');
        navigator.clipboard.writeText(text);
        // Toast logic could go here
    };

    return (
        <div className="tag-manager">
            {/* Active Tags Section */}
            <div className="tag-section">
                <div className="yt-label-row">
                    <h3>タグ</h3>
                </div>
                <div className="yt-desc">
                    タグは、動画のコンテンツ検索で入力ミスがよくある場合に便利です。
                </div>

                <div className="yt-tag-container">
                    <div className="yt-actions">
                        <button className="yt-icon-btn" onClick={copyActiveTags} title="すべてコピー">
                            <Copy size={18} />
                        </button>
                        <button className="yt-icon-btn" onClick={() => setActiveTags([])} title="すべて削除">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="yt-chips-area">
                        {activeTags.map(tag => (
                            <span key={tag} className="yt-chip" onClick={() => removeActiveTag(tag)}>
                                {tag} <span className="yt-close">×</span>
                            </span>
                        ))}
                        {activeTags.length === 0 && (
                            <span className="yt-placeholder">タグを追加してください</span>
                        )}
                    </div>
                </div>
                <div className="yt-footer">
                    各タグの後にはカンマを入力してください。
                </div>

                {/* Comma separated preview (keep for utility) */}
                {activeTags.length > 0 && (
                    <div className="preview-text">
                        {activeTags.join(',')}
                    </div>
                )}
            </div>

            <div className="divider">
                <div className="divider-icon">▼ よく使うタグ (クリックで追加) ▼</div>
            </div>

            {/* Stocked Tags Section */}
            <div className="tag-section">
                <div className="yt-tag-container stock-container">
                    <div className="yt-input-area">
                        <input
                            type="text"
                            className="yt-input"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addStockedTag()}
                            placeholder="新しいタグを追加..."
                        />
                        <button className="yt-add-btn" onClick={addStockedTag} disabled={!newTagInput}>追加</button>
                    </div>
                    <div className="yt-chips-area stock-area">
                        {stockedTags.map(tag => (
                            <span
                                key={tag}
                                className={`yt-chip stock ${activeTags.includes(tag) ? 'selected' : ''}`}
                                onClick={() => addActiveTag(tag)}
                            >
                                {tag}
                                <button className="yt-stock-delete" onClick={(e) => deleteStockedTag(tag, e)}>×</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .tag-manager {
                    display: flex; flex-direction: column; height: 100%;
                    padding: 24px; gap: 24px; overflow-y: auto;
                    background: #1f1f1f; /* Darker bg */
                    font-family: Roboto, Arial, sans-serif;
                }
                .tag-section {
                    display: flex; flex-direction: column; gap: 8px;
                }
                .yt-label-row h3 {
                    margin: 0; font-size: 15px; color: #aaaaaa; font-weight: 500;
                }
                .yt-desc {
                    font-size: 12px; color: #aaaaaa; margin-bottom: 8px;
                }

                .yt-tag-container {
                    background: #282828; /* YouTube Input BG */
                    border: 1px solid #3e3e3e; /* YouTube Border */
                    border-radius: 4px;
                    padding: 12px;
                    padding-top: 40px; /* Space for actions */
                    position: relative;
                    min-height: 120px;
                }
                .stock-container {
                    padding-top: 12px;
                    background: #1f1f1f;
                    border: 1px dashed #3e3e3e;
                }

                .yt-actions {
                    position: absolute;
                    top: 8px; right: 8px;
                    display: flex; gap: 8px;
                }
                .yt-icon-btn {
                    background: transparent; border: none; color: #aaaaaa;
                    cursor: pointer; padding: 4px; border-radius: 50%;
                }
                .yt-icon-btn:hover { background: #3e3e3e; color: #fff; }

                .yt-chips-area {
                    display: flex; flex-wrap: wrap; gap: 8px;
                }
                
                .yt-chip {
                    display: inline-flex; align-items: center; height: 32px;
                    background: #3ea6ff26; /* Light blueish tint for active? Or gray */
                    /* Actually YouTube uses gray chips usually, let's stick to gray for stock, blueish for active */
                    background: #3e3e3e; 
                    color: #fff;
                    padding: 0 12px;
                    border-radius: 16px; /* Pill shape */
                    font-size: 13px;
                    cursor: pointer;
                    user-select: none;
                }
                
                /* Specific styling matching screenshot provided implicitly */
                .yt-chip {
                    background: #3d3d3d; /* Dark gray chip */
                    border: 1px solid transparent;
                }
                .yt-chip:hover { background: #505050; }
                
                .yt-close {
                    font-size: 18px; margin-left: 8px; color: #aaa;
                }
                .yt-close:hover { color: #fff; }

                .yt-placeholder {
                    color: #717171; font-size: 14px;
                }

                .yt-footer {
                    font-size: 12px; color: #aaaaaa; margin-top: 4px;
                }
                
                /* Stock Section */
                .yt-chip.stock {
                    background: #282828; border: 1px solid #555;
                }
                .yt-chip.stock.selected { opacity: 0.5; }
                .yt-stock-delete {
                    background: none; border: none; color: #888; font-size: 16px; margin-left: 6px; cursor: pointer;
                }
                .yt-stock-delete:hover { color: #ff4d4d; }

                .yt-input-area {
                    display: flex; gap: 8px; margin-bottom: 12px;
                }
                .yt-input {
                    background: #121212; border: 1px solid #3e3e3e; color: #fff;
                    padding: 8px; border-radius: 4px; flex: 1;
                }
                .yt-add-btn {
                    background: #3ea6ff; color: #050505; border: none; padding: 0 16px;
                    border-radius: 2px; font-weight: 500; cursor: pointer;
                }
                .yt-add-btn:disabled { background: #555; color: #aaa; }

                .preview-text {
                    font-family: monospace; font-size: 11px; color: #717171;
                    background: #121212; padding: 6px; border-radius: 4px;
                    word-break: break-all; margin-top: 8px;
                }
                
                .divider { display: flex; justify-content: center; margin: 10px 0; }
                .divider-icon { font-size: 11px; color: #555; }
            `}</style>
        </div>
    );
};

const Workspace = () => {
    const [activeTab, setActiveTab] = useState('draft');
    const [content, setContent] = useState('');
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);

    // Save timeout ref
    const saveTimeoutRef = useRef(null);

    // Load content on tab change
    useEffect(() => {
        if (activeTab === 'tags') return; // Handled by TagManager

        const loadContent = async () => {
            const memo = await db.memos.get(`workspace-${activeTab}`);
            const initialText = memo ? memo.content : '';
            setContent(initialText);
            setHistory([initialText]);
            setHistoryIndex(0);
        };
        loadContent();
    }, [activeTab]);

    // Handle text change with History & Auto-save
    const handleChange = (e) => {
        const newVal = e.target.value;
        setContent(newVal);

        // History logic (debounce slightly or simple push)
        // For simplicity, we push to history on pause not every char, but here we just update current state
        // Real undo/redo usually needs more complex logic, here is a simplified "snapshot" approach
    };

    // Snapshot for history on blur or pause could be better, 
    // but let's just save history on "significant" pauses or manual save?
    // Let's stick to simple auto-save for DB, and maybe a manual "Checkpoint" or simple debounce for history.

    const handleBlur = () => {
        if (activeTab === 'tags') return;
        if (content !== history[historyIndex]) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(content);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
        saveToDb(content);
    };

    const handleInsertTemplate = (tmplContent) => {
        if (activeTab === 'tags') return;
        const newText = content + (content ? '\n' : '') + tmplContent;
        setContent(newText);

        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newText);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        saveToDb(newText);
        setIsTemplateOpen(false);
    };

    const saveToDb = (text) => {
        db.memos.put({ id: `workspace-${activeTab}`, type: activeTab, content: text, updatedAt: Date.now() });
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setContent(prev);
            setHistoryIndex(historyIndex - 1);
            saveToDb(prev);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setContent(next);
            setHistoryIndex(historyIndex + 1);
            saveToDb(next);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
    };

    const handleClear = () => {
        if (window.confirm("このタブの内容を消去しますか？")) {
            setContent('');
            saveToDb('');
        }
    };

    return (
        <div className="workspace-pane">
            <div className="workspace-header">
                <h2>ワークスペース</h2>
                <div className="tab-bar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'tags' ? (
                <TagManager />
            ) : (
                <>
                    <div className="toolbar">
                        <div className="tool-group">
                            <button onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
                                <RotateCcw size={16} />
                            </button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
                                <RotateCw size={16} />
                            </button>
                        </div>
                        <div className="tool-group">
                            <button
                                onClick={() => setIsTemplateOpen(true)}
                                title="テンプレート挿入"
                            >
                                <FilePlus size={16} /> テンプレート
                            </button>
                        </div>
                        <div className="tool-group">
                            <button onClick={handleCopy} title="Copy All">
                                <Copy size={16} />
                            </button>
                            <button onClick={handleClear} title="Clear" className="danger">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <textarea
                        className="workspace-editor"
                        value={content}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={`${TABS.find(t => t.id === activeTab).label} を入力...`}
                    />
                </>
            )}

            <TemplateManager
                isOpen={isTemplateOpen}
                onClose={() => setIsTemplateOpen(false)}
                onSelect={handleInsertTemplate}
                type={activeTab} // Pass current tab type to filter templates
            />

            <style>{`
                .workspace-pane {
                    display: flex; flex-direction: column; height: 100%;
                    background: var(--bg-secondary);
                }
                .workspace-header {
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
                }
                .workspace-header h2 {
                    margin: 0; padding: 12px 16px; font-size: 1rem; color: var(--text-primary);
                }
                .tab-bar {
                    display: flex;
                    padding: 0 8px;
                    gap: 4px;
                }
                .tab-btn {
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    padding: 8px 12px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                }
                .tab-btn.active {
                    color: var(--accent-color);
                    border-bottom-color: var(--accent-color);
                }
                .tab-btn:hover { color: var(--text-primary); }
                
                /* Standard Toolbar Styles */
                .toolbar {
                    display: flex; justify-content: space-between;
                    padding: 8px 12px;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--bg-primary);
                }
                .tool-group { display: flex; gap: 8px; }
                .toolbar button {
                    background: transparent; border: none;
                    color: var(--text-secondary);
                    cursor: pointer; padding: 4px;
                    border-radius: 4px;
                }
                .toolbar button:hover:not(:disabled) { background: var(--bg-hover); color: var(--text-primary); }
                .toolbar button:disabled { opacity: 0.3; cursor: default; }
                .toolbar button.danger:hover { color: var(--error-color); }

                .workspace-editor {
                    flex: 1;
                    width: 100%;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    border: none;
                    padding: 16px;
                    resize: none;
                    outline: none;
                    font-size: 1rem;
                    line-height: 1.6;
                    font-family: inherit;
                }
            `}</style>
        </div>
    );
};

export default Workspace;
