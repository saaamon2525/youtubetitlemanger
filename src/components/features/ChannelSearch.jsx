import React, { useState } from 'react';
import { useYouTube } from '../../hooks/useYouTube';
import Button from '../ui/Button';
import { db } from '../../db/db';
import { useSettings } from '../../contexts/SettingsContext';
import { Search, Plus, Film, User, Bookmark } from 'lucide-react';

const ChannelSearch = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('channel'); // 'channel' or 'video'
  const { search, searchResults, registerChannel, isLoading, error } = useYouTube();
  const { currentStockGroupId } = useSettings();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      search(query, searchType);
    }
  };

  const handleStockVideo = async (video) => {
    // Add to DB with 'stock' status using current group
    const groupId = currentStockGroupId || 1;
    await db.videos.put({
      videoId: video.videoId,
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      channelTitle: video.channelTitle,
      publishedAt: video.publishedAt,
      status: 'stock',
      groupId: groupId,
      addedAt: Date.now()
    });
  };

  return (
    <div className="channel-search">
      <div className="search-tabs">
        <button
          className={`tab ${searchType === 'channel' ? 'active' : ''}`}
          onClick={() => setSearchType('channel')}
        >
          <User size={14} /> チャンネル
        </button>
        <button
          className={`tab ${searchType === 'video' ? 'active' : ''}`}
          onClick={() => setSearchType('video')}
        >
          <Film size={14} /> 動画
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchType === 'channel' ? "チャンネルを検索..." : "動画を検索..."}
          className="input-text"
          style={{ flex: 1 }}
        />
        <Button type="submit" disabled={isLoading} size="sm">
          <Search size={16} />
        </Button>
      </form>

      {error && <div className="error-text">{error}</div>}

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(item => (
            <div key={item.type === 'channel' ? item.channelId : item.videoId} className="search-item">
              <img
                src={item.thumbnail}
                alt=""
                className={item.type === 'channel' ? "channel-icon-sm" : "video-thumb-sm"}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="channel-title" title={item.title}>{item.title}</div>
                {item.type === 'video' && <div className="sub-text">{item.channelTitle}</div>}
              </div>

              {item.type === 'channel' ? (
                <Button size="sm" onClick={() => registerChannel(item.channelId)}>
                  <Plus size={14} />
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => handleStockVideo(item)}>
                  <Bookmark size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .search-tabs { display: flex; gap: 4px; margin-bottom: 8px; }
        .tab { 
            flex: 1; border: none; background: var(--bg-secondary); color: var(--text-secondary); 
            padding: 6px; cursor: pointer; border-radius: var(--radius-sm); font-size: 0.85rem;
            display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .tab:hover { background: var(--bg-hover); }
        .tab.active { background: var(--accent-color); color: #000; font-weight: bold; }
        
        .video-thumb-sm {
          width: 60px; height: 34px; object-fit: cover; border-radius: 2px;
        }
        .sub-text { font-size: 0.75rem; color: var(--text-secondary); }
        
        .input-text {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px;
          border-radius: var(--radius-sm);
        }
        .error-text {
          color: var(--error-color);
          font-size: 0.8rem;
          margin-bottom: 8px;
        }
        .search-results {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 16px;
        }
        .search-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border-bottom: 1px solid var(--divider-color);
        }
        .channel-icon-sm {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .channel-title {
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
};

export default ChannelSearch;
