import React, { useEffect, useState } from 'react';
import { useYouTube } from '../../hooks/useYouTube';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '../ui/Button';
import { Bookmark, BookmarkCheck } from 'lucide-react';

import { useSettings } from '../../contexts/SettingsContext';

const VideoFeed = () => {
  const { fetchAllChannels, isLoading } = useYouTube();
  const { currentStockGroupId } = useSettings();

  // Fetch videos from DB, sorted by date (newest first). Limiting to 50 for performance.
  // We only show status='new' or 'stock'.
  const videos = useLiveQuery(() =>
    db.videos
      .where('status').anyOf('new')
      .reverse()
      .sortBy('publishedAt')
      .then(list => list.slice(0, 50))
  );

  const handleStock = async (videoId) => {
    // Default to group 1 if not set
    const groupId = currentStockGroupId || 1;
    await db.videos.where('videoId').equals(videoId).modify({ status: 'stock', groupId });
  };

  if (!videos) return <div style={{ padding: 16 }}>動画を読み込み中...</div>;

  return (
    <div className="video-feed">
      <div className="feed-header">
        <h3>最新動画</h3>
      </div>

      <div className="video-list">
        {videos.length === 0 && <div className="empty">動画がありません。更新ボタンで取得してください。</div>}
        {videos.map(video => (
          <div key={video.videoId} className="video-item">
            <div className="video-thumb">
              <img src={video.thumbnail} alt="" />
            </div>
            <div className="video-content">
              <div className="video-title" title={video.title}>{video.title}</div>
              <div className="video-meta">{video.channelTitle}</div>
              <Button size="sm" variant="secondary" onClick={() => handleStock(video.videoId)}>
                <Bookmark size={14} /> ストック
              </Button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .video-feed {
          padding: 16px;
          border-top: 1px solid var(--divider-color);
        }
        .feed-header {
          margin-bottom: 12px;
        }
        .feed-header h3 {
          margin: 0;
          font-size: 1rem;
          color: var(--text-secondary);
        }
        .video-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .video-item {
          display: flex;
          gap: 10px;
          background: var(--bg-hover);
          padding: 8px;
          border-radius: var(--radius-sm);
        }
        .video-thumb img {
          width: 100px;
          height: 56px;
          object-fit: cover;
          border-radius: 4px;
        }
        .video-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .video-title {
          font-size: 0.85rem;
          line-height: 1.2;
          max-height: 2.4em;
          overflow: hidden;
          font-weight: 500;
        }
        .video-meta {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .empty {
          color: var(--text-secondary);
          font-style: italic;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default VideoFeed;
