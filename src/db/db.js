import Dexie from 'dexie';

export const db = new Dexie('SamonCoreDB');

db.version(1).stores({
  channels: '++id, channelId, title, lastUpdated', // YouTube Channels
  videos: '++id, videoId, channelId, title, publishedAt, status, [status+publishedAt]', // status: 'stock', 'rejected', 'adopted'
  memos: '++id, type, content, updatedAt', // type: 'title', 'description', 'tags', 'scratchpad'
  settings: 'key', // Simple key-value store for settings (api keys)
});

db.version(2).stores({
  templates: '++id, type, name', // type: 'title', 'description', 'tags'
  channelProfile: 'key', // singleton 'myProfile': channelId, styleData
  workspaceHistory: '++id, tab, timestamp', // tab: 'title', 'desc', 'tags'
});

db.version(3).stores({
  stockGroups: '++id, name',
  videos: '++id, videoId, channelId, title, publishedAt, status, groupId, [status+groupId]' // Added groupId
});

// Helper to pre-populate settings if needed, or migration
db.open().then(async () => {
  // Ensure default group exists
  const count = await db.stockGroups.count();
  if (count === 0) {
    await db.stockGroups.add({ id: 1, name: '基本グループ' });
  }
}).catch(function (err) {
  console.error('Failed to open db: ' + (err.stack || err));
});
