import React, { useState, useEffect } from 'react';
import { db } from '../../db/db';
import Button from '../ui/Button';
import { Plus, Trash, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

const TemplateManager = ({ isOpen, onClose, onSelect, type }) => {
    const templates = useLiveQuery(
        () => db.templates.where('type').equals(type).toArray(),
        [type]
    );

    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const handleAdd = async () => {
        if (!newTitle || !newContent) return;
        await db.templates.add({
            type,
            name: newTitle,
            content: newContent
        });
        setNewTitle('');
        setNewContent('');
        setIsCreating(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('このテンプレートを削除しますか？')) {
            await db.templates.delete(id);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>テンプレート選択 ({type === 'description' ? '概要欄' : type === 'tags' ? 'タグ' : 'その他'})</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="template-list">
                    {templates?.length === 0 && !isCreating && (
                        <p className="empty-msg">テンプレートがありません。</p>
                    )}

                    {templates?.map(tmpl => (
                        <div key={tmpl.id} className="template-item">
                            <div className="tmpl-info" onClick={() => onSelect(tmpl.content)}>
                                <strong>{tmpl.name}</strong>
                                <pre>{tmpl.content.slice(0, 50)}...</pre>
                            </div>
                            <button className="delete-btn" onClick={() => handleDelete(tmpl.id)}>
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {isCreating ? (
                    <div className="create-form">
                        <input
                            placeholder="テンプレート名"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                        />
                        <textarea
                            placeholder="内容"
                            rows={4}
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                        />
                        <div className="form-actions">
                            <Button size="sm" onClick={handleAdd}>追加</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>キャンセル</Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="secondary"
                        onClick={() => setIsCreating(true)}
                        style={{ width: '100%', marginTop: '12px' }}
                    >
                        <Plus size={16} /> 新規作成
                    </Button>
                )}
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000;
                }
                .modal-content {
                    background: var(--bg-secondary);
                    width: 400px;
                    max-height: 80vh;
                    display: flex; flex-direction: column;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-color);
                    padding: 16px;
                }
                .modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 16px;
                }
                .modal-header h3 { margin: 0; font-size: 1rem; }
                .close-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; }
                
                .template-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
                .template-item {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    display: flex;
                }
                .tmpl-info { flex: 1; padding: 8px; cursor: pointer; overflow: hidden; }
                .tmpl-info:hover { background: var(--bg-hover); }
                .tmpl-info strong { display: block; font-size: 0.9rem; margin-bottom: 4px; }
                .tmpl-info pre { margin: 0; font-size: 0.8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: inherit; }
                
                .delete-btn {
                    background: transparent; border: none; border-left: 1px solid var(--border-color);
                    width: 36px; display: flex; align-items: center; justify-content: center;
                    color: var(--text-secondary); cursor: pointer;
                }
                .delete-btn:hover { color: var(--error-color); }
                
                .create-form {
                    margin-top: 12px; border-top: 1px solid var(--divider-color); padding-top: 12px;
                    display: flex; flex-direction: column; gap: 8px;
                }
                .create-form input, .create-form textarea {
                    background: var(--bg-input); border: 1px solid var(--border-color);
                    color: var(--text-primary); padding: 8px; border-radius: 4px;
                }
                .form-actions { display: flex; gap: 8px; }
                .empty-msg { text-align: center; color: var(--text-secondary); font-size: 0.85rem; }
            `}</style>
        </div>
    );
};

export default TemplateManager;
