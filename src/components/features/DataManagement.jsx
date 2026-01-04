import React, { useState } from 'react';
import { db } from '../../db/db';
import Button from '../ui/Button';
import { Download, Upload, AlertCircle } from 'lucide-react';

const DataManagement = () => {
    const [status, setStatus] = useState('');

    const handleExport = async () => {
        setStatus('エクスポート中...');
        try {
            const data = {
                timestamp: new Date().toISOString(),
                channels: await db.channels.toArray(),
                videos: await db.videos.toArray(),
                // memos: await db.memos.toArray(), 
                // settings: await db.settings.toArray() // Optional: exclude keys for security?
                // Let's exclude settings for security (API keys) unless user wants them.
                // For now, let's keep it safe and NOT export settings.
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `samon-core-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus('エクスポート完了！');
        } catch (e) {
            console.error(e);
            setStatus('エクスポート失敗: ' + e.message);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm("現在のデータを上書き・追加しますか？\n（既存の同一IDデータは更新されます）")) {
            e.target.value = '';
            return;
        }

        setStatus('インポート中...');
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);

                await db.transaction('rw', db.channels, db.videos, async () => {
                    if (data.channels) await db.channels.bulkPut(data.channels);
                    if (data.videos) await db.videos.bulkPut(data.videos);
                    // if (data.memos) await db.memos.bulkPut(data.memos);
                });

                setStatus('インポート完了！ページをリロードしてください。');
                setTimeout(() => window.location.reload(), 1500);
            } catch (err) {
                console.error(err);
                setStatus('インポート失敗: JSON形式を確認してください。');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="data-management">
            <h3 style={{ fontSize: '1rem', marginTop: 16 }}>データ管理</h3>
            <div className="actions">
                <Button variant="secondary" onClick={handleExport} style={{ width: '100%' }}>
                    <Download size={14} /> バックアップを保存 (JSON)
                </Button>

                <div style={{ width: '100%', position: 'relative' }}>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            opacity: 0, cursor: 'pointer'
                        }}
                    />
                    <Button variant="secondary" style={{ width: '100%' }}>
                        <Upload size={14} /> バックアップから復元
                    </Button>
                </div>
            </div>
            {status && <div className="status-text">{status}</div>}

            <div className="note">
                <AlertCircle size={12} />
                <span>APIキー設定はバックアップに含まれません。</span>
            </div>

            <style>{`
              .data-management {
                  margin-top: 16px;
                  padding-top: 16px;
                  border-top: 1px solid var(--divider-color);
              }
              .data-management .actions {
                  display: flex;
                  gap: 8px;
                  margin-bottom: 8px;
              }
              .status-text {
                  font-size: 0.8rem;
                  color: var(--accent-color);
                  margin-top: 4px;
              }
              .note {
                  display: flex;
                  gap: 4px;
                  align-items: center;
                  font-size: 0.75rem;
                  color: var(--text-secondary);
                  margin-top: 8px;
              }
            `}</style>
        </div>
    );
};

export default DataManagement;
