import React, { useState } from 'react';
import { db } from '../../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '../ui/Button';
import { X, Check, ChevronDown, ChevronUp, ExternalLink, Plus, Folder, Edit2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { getVideoDetails } from '../../lib/youtube';

const StockedVideos = () => {
  const { apiKeys, currentStockGroupId, setActiveStockGroup } = useSettings();

  // Groups
  const stockGroups = useLiveQuery(() => db.stockGroups.toArray());
  const currentGroup = stockGroups?.find(g => g.id === currentStockGroupId);

  // Videos (Filtered)
  const stockedVideos = useLiveQuery(() => {
    if (!currentStockGroupId) return [];
    return db.videos
      .where('[status+groupId]')
      .equals(['stock', currentStockGroupId])
      .toArray();
  }, [currentStockGroupId]);

  const [expandedId, setExpandedId] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');

  const handleRemove = (id) => db.videos.update(id, { status: 'rejected' });

  const handleAddGroup = async () => {
    if (!groupNameInput) return;
    const id = await db.stockGroups.add({ name: groupNameInput });
    setActiveStockGroup(id);
    setIsAddingGroup(false);
    setGroupNameInput('');
  };

  const startRenaming = () => {
    if (currentGroup) {
      setGroupNameInput(currentGroup.name);
      setIsRenamingGroup(true);
    }
  };

  const handleRenameGroup = async () => {
    if (!groupNameInput || !currentStockGroupId) return;
    await db.stockGroups.update(currentStockGroupId, { name: groupNameInput });
    setIsRenamingGroup(false);
    setGroupNameInput('');
  };

  const toggleExpand = async (video) => {
    if (expandedId === video.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(video.id);

    // If tags are missing, fetch full details
    if (!video.tags && !video.fetchedDetails) {
      setLoadingDetails(true);
      try {
        const details = await getVideoDetails(apiKeys.youtube, video.videoId);
        if (details) {
          await db.videos.update(video.id, {
            description: details.description,
            tags: details.tags,
            fetchedDetails: true
          });
        }
      } catch (e) {
        console.error("Failed to fetch details", e);
      } finally {
        setLoadingDetails(false);
      }
    }
  };

  if (!stockGroups) return null;

  return (
    <div className="stocked-videos">
      <div className="group-header">
        <div className="group-selector">
          <label><Folder size={12} /> ストック:</label>
          {isRenamingGroup ? (
            <div className="inline-edit">
              <input
                value={groupNameInput}
                onChange={e => setGroupNameInput(e.target.value)}
                autoFocus
                className="edit-input"
              />
              <button className="icon-btn" onClick={handleRenameGroup}><Check size={14} /></button>
              <button className="icon-btn" onClick={() => setIsRenamingGroup(false)}><X size={14} /></button>
            </div>
          ) : (
            <>
              <select
                value={currentStockGroupId}
                onChange={(e) => setActiveStockGroup(parseInt(e.target.value))}
                className="group-select"
              >
                {stockGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button className="icon-btn" onClick={startRenaming} title="名前変更"><Edit2 size={13} /></button>
              <button className="icon-btn" onClick={() => { setIsAddingGroup(true); setGroupNameInput(''); }} title="新規グループ"><Plus size={14} /></button>
            </>
          )}
        </div>
      </div>

      {isAddingGroup && (
        <div className="add-group-form">
          <input
            value={groupNameInput}
            onChange={e => setGroupNameInput(e.target.value)}
            placeholder="グループ名"
            autoFocus
          />
          <Button size="sm" onClick={handleAddGroup}>追加</Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAddingGroup(false)}>X</Button>
        </div>
      )}

      {/* Legacy check: If old videos exist with no groupId, user might want to see them? 
          For now we assume db migration or default usage. */}

      <h3 style={{ marginTop: '12px' }}>リスト ({stockedVideos?.length || 0})</h3>
      <div className="list">
        {(stockedVideos || []).map(video => (
          <div key={video.id} className={`stock-item ${expandedId === video.id ? 'expanded' : ''}`}>
            <div className="stock-header" onClick={() => toggleExpand(video)}>
              <div className="title">{video.title}</div>
              <div className="actions">
                {expandedId === video.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </div>

            {expandedId === video.id && (
              <div className="stock-details">
                {loadingDetails && !video.fetchedDetails ? (
                  <div className="loading">詳細を取得中...</div>
                ) : (
                  <>
                    <div className="detail-row">
                      <label>概要欄:</label>
                      <div className="desc-box">
                        {video.description || "概要欄なし"}
                      </div>
                    </div>
                    <div className="detail-row">
                      <label>タグ:</label>
                      <div className="tags-box">
                        {video.tags && video.tags.length > 0 ? (
                          video.tags.map(tag => <span key={tag} className="tag">{tag}</span>)
                        ) : "タグなし"}
                      </div>
                    </div>
                    <div className="detail-actions">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="youtube-link"
                      >
                        YouTubeで開く <ExternalLink size={12} />
                      </a>
                      <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); handleRemove(video.id); }}>
                        <X size={14} /> 削除
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`
        .stocked-videos {
          padding: 16px;
          border-top: 1px solid var(--divider-color);
          background-color: rgba(62, 166, 255, 0.05); /* Blue tint */
        }
        .stocked-videos h3 {
          margin: 0 0 8px 0;
          font-size: 0.9rem;
          color: var(--accent-color);
        }
        .group-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .group-selector { display: flex; align-items: center; gap: 8px; width: 100%; }
        .group-selector label { font-size: 0.8rem; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; }
        .group-select { flex: 1; padding: 4px; border-radius: 4px; background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color); font-size: 0.85rem; }
        .icon-btn { background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px; display: flex; align-items: center; justify-content: center; }
        .icon-btn:hover { color: var(--accent-color); }
        .add-group-form { display: flex; gap: 4px; margin-bottom: 8px; }
        .add-group-form input { flex: 1; padding: 4px; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--border-color); }
        .inline-edit { display: flex; flex: 1; gap: 4px; align-items: center; }
        .edit-input { flex: 1; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); font-size: 0.85rem; background: var(--bg-input); color: var(--text-primary); }

        .stock-item {
          border-bottom: 1px solid var(--divider-color);
          font-size: 0.85rem;
          background: var(--bg-secondary);
          border-radius: 4px;
          margin-bottom: 4px;
          overflow: hidden;
        }
        .stock-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          cursor: pointer;
        }
        .stock-header:hover {
          background: var(--bg-hover);
        }
        .stock-header .title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 8px;
          font-weight: 500;
        }
        .stock-details {
          padding: 8px;
          background: var(--bg-primary);
          border-top: 1px solid var(--divider-color);
        }
        .detail-row {
          margin-bottom: 8px;
        }
        .detail-row label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }
        .desc-box {
          max-height: 100px;
          overflow-y: auto;
          white-space: pre-wrap;
          font-size: 0.8rem;
          background: var(--bg-input);
          padding: 6px;
          border-radius: 4px;
        }
        .tags-box {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .tag {
          font-size: 0.75rem;
          background: var(--bg-hover);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--text-secondary);
        }
        .detail-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed var(--divider-color);
        }
        .youtube-link {
          color: var(--accent-color);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
        }
        .youtube-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default StockedVideos;
