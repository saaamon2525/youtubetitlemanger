import React, { useEffect, useState } from 'react';
import { analyzeTitles } from '../../lib/tokenizer';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '../ui/Button';

import { useSettings } from '../../contexts/SettingsContext';

const KeywordCloud = ({ onKeywordSelect }) => {
    const { currentStockGroupId } = useSettings();
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(false);

    // Get titles of stocked videos for the current group
    const stockedTitles = useLiveQuery(() => {
        if (!currentStockGroupId) return [];
        return db.videos
            .where('[status+groupId]')
            .equals(['stock', currentStockGroupId])
            .toArray()
            .then(videos => videos.map(v => v.title));
    }, [currentStockGroupId]);

    useEffect(() => {
        if (stockedTitles && stockedTitles.length > 0) {
            setLoading(true);
            analyzeTitles(stockedTitles).then(results => {
                setKeywords(results);
                setLoading(false);
            }).catch(err => {
                console.error("Analysis Failed", err);
                setLoading(false);
            });
        } else {
            setKeywords([]);
        }
    }, [stockedTitles]);

    if (!stockedTitles || stockedTitles.length === 0) {
        return (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                左ペインで動画をストックして分析を開始してください。
            </div>
        );
    }

    return (
        <div className="keyword-cloud">
            <h3>トレンドキーワード</h3>
            {loading && <div>分析中...</div>}
            <div className="cloud-container">
                {keywords.map(item => (
                    <button
                        key={item.text}
                        className="keyword-tag"
                        style={{ fontSize: Math.min(1.5, Math.max(0.8, 0.8 + (item.value / 5))) + 'rem' }}
                        onClick={() => onKeywordSelect(item.text)}
                    >
                        {item.text}
                    </button>
                ))}
            </div>

            <style>{`
        .keyword-cloud h3 {
          margin-top: 0;
          font-size: 1.1rem;
        }
        .cloud-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          background: var(--bg-hover);
          border-radius: var(--radius-md);
        }
        .keyword-tag {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: 16px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .keyword-tag:hover {
          background: var(--accent-color);
          border-color: var(--accent-color);
          color: #000;
        }
      `}</style>
        </div>
    );
};

export default KeywordCloud;
