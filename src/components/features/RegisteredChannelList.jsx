import React from 'react';
import { useYouTube } from '../../hooks/useYouTube';
import Button from '../ui/Button';
import { Trash2, RefreshCw } from 'lucide-react';

const RegisteredChannelList = () => {
  const { registeredChannels, unregisterChannel, fetchAllChannels, isLoading } = useYouTube();

  if (!registeredChannels) return <div>読み込み中...</div>;

  return (
    <div className="registered-channels">
      <div className="header">
        <h3>登録チャンネル ({registeredChannels.length})</h3>
        <Button size="sm" variant="ghost" onClick={fetchAllChannels} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
        </Button>
      </div>

      <div className="channel-list">
        {registeredChannels.map(channel => (
          <div key={channel.id} className="channel-item">
            <img src={channel.thumbnail} alt="" className="channel-avatar" />
            <div className="channel-info">
              <div className="name">{channel.title}</div>
              <div className="meta">
                {Number(channel.subscriberCount).toLocaleString()} 人
              </div>
            </div>
            <button
              className="delete-btn"
              onClick={() => unregisterChannel(channel.id)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .registered-channels .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .registered-channels h3 {
          font-size: 1rem;
          margin: 0;
          color: var(--text-secondary);
        }
        .channel-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .channel-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: var(--bg-hover);
          border-radius: var(--radius-sm);
          transition: background-color 0.2s;
        }
        .channel-item:hover {
          background: #3a3a3a;
        }
        .channel-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }
        .channel-info {
          flex: 1;
          min-width: 0;
        }
        .channel-info .name {
          font-size: 0.9rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .channel-info .meta {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .delete-btn {
          background: none;
          border: none;
          color: var(--text-disabled);
          cursor: pointer;
          padding: 4px;
        }
        .delete-btn:hover {
          color: var(--error-color);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default RegisteredChannelList;
