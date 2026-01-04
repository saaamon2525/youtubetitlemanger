import axios from 'axios';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const searchChannels = async (apiKey, query) => {
    if (!apiKey) throw new Error("YouTube API Key is missing");

    try {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: {
                part: 'snippet',
                q: query,
                type: 'channel',
                maxResults: 5,
                key: apiKey
            }
        });
        return response.data.items.map(item => ({
            channelId: item.snippet.channelId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.default.url
        }));
    } catch (error) {
        console.error("YouTube Search Error:", error);
        throw error;
    }
};

export const searchVideos = async (apiKey, query) => {
    if (!apiKey) throw new Error("YouTube API Key is missing");

    try {
        const response = await axios.get(`${BASE_URL}/search`, {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 5,
                key: apiKey
            }
        });
        return response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.default.url,
            channelTitle: item.snippet.channelTitle, // Video search result has this
            publishedAt: item.snippet.publishedAt
        }));
    } catch (error) {
        console.error("YouTube Search Video Error:", error);
        throw error;
    }
};

export const getChannelDetails = async (apiKey, channelId) => {
    if (!apiKey) throw new Error("YouTube API Key is missing");

    try {
        const response = await axios.get(`${BASE_URL}/channels`, {
            params: {
                part: 'snippet,statistics,contentDetails',
                id: channelId,
                key: apiKey
            }
        });
        const item = response.data.items[0];
        if (!item) return null;

        return {
            channelId: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            subscriberCount: item.statistics.subscriberCount,
            uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads
        };
    } catch (error) {
        console.error("YouTube Channel Details Error:", error);
        throw error;
    }
};

export const getChannelVideos = async (apiKey, playlistId, maxResults = 20) => {
    if (!apiKey) throw new Error("YouTube API Key is missing");

    try {
        const response = await axios.get(`${BASE_URL}/playlistItems`, {
            params: {
                part: 'snippet',
                playlistId: playlistId,
                maxResults: maxResults,
                key: apiKey
            }
        });

        return response.data.items.map(item => ({
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle
        }));
    } catch (error) {
        console.error("YouTube Videos Error:", error);
        throw error;
    }
};

export const getVideoDetails = async (apiKey, videoId) => {
    if (!apiKey) throw new Error("YouTube API Key is missing");

    try {
        const response = await axios.get(`${BASE_URL}/videos`, {
            params: {
                part: 'snippet',
                id: videoId,
                key: apiKey
            }
        });
        const item = response.data.items[0];
        if (!item) return null;

        return {
            videoId: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            tags: item.snippet.tags || [],
            publishedAt: item.snippet.publishedAt,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle
        };
    } catch (error) {
        console.error("YouTube Video Detail Error:", error);
        throw error;
    }
};
