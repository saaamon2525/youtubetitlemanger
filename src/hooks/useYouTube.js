import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../db/db';
import { searchChannels, getChannelDetails, getChannelVideos, searchVideos } from '../lib/youtube';
import { useLiveQuery } from 'dexie-react-hooks';

export const useYouTube = () => {
    const { apiKeys } = useSettings();
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Live query for registered channels
    const registeredChannels = useLiveQuery(() => db.channels.toArray(), []);

    const search = async (query, type = 'channel') => {
        if (!apiKeys.youtube) {
            setError("YouTube API Key is required");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            let results = [];
            if (type === 'channel') {
                results = await searchChannels(apiKeys.youtube, query);
            } else {
                results = await searchVideos(apiKeys.youtube, query);
            }
            // Tag them so UI knows
            setSearchResults(results.map(r => ({ ...r, type })));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const registerChannel = async (channelId) => {
        if (!apiKeys.youtube) return;
        try {
            // Fetch full details to store
            const details = await getChannelDetails(apiKeys.youtube, channelId);
            if (details) {
                // Add lastUpdated timestamp
                await db.channels.put({ ...details, lastUpdated: Date.now() });
                // Clear search results to show success or reset
                setSearchResults([]);
            }
        } catch (err) {
            console.error("Failed to register channel:", err);
            setError("Failed to register channel");
        }
    };

    const unregisterChannel = async (id) => {
        await db.channels.delete(id);
    };

    const fetchVideosForChannel = useCallback(async (channel) => {
        // Cache logic: if updated < 4 hours ago, use DB videos?
        // Actually, we usually want to see if we have videos in 'videos' table for this channel.
        // For now, let's just simple fetch & upsert logic initiated by user or auto-refresh.

        if (!apiKeys.youtube || !channel.uploadsPlaylistId) return;

        try {
            // 1. Fetch latest videos
            const videos = await getChannelVideos(apiKeys.youtube, channel.uploadsPlaylistId);

            // 2. Store them. using bulkPut to update existing ones or insert new.
            // We need to be careful not to overwrite 'status' (stock/adopted) if it exists.
            // Dexie bulkPut overwrites entire object if key matches. 
            // We should check existence first or use a modify approach.

            // Strategy: Iterate properly.
            await db.transaction('rw', db.videos, async () => {
                for (const video of videos) {
                    const existing = await db.videos.where({ videoId: video.videoId }).first();
                    if (!existing) {
                        await db.videos.add({
                            ...video,
                            status: 'new', // Default status
                            addedAt: Date.now()
                        });
                    }
                    // If existing, we don't update to preserve status/notes. 
                    // Or strictly update details like title if they changed? Not common for old videos.
                    // Ignoring existing ensures we don't wipe data.
                }
            });

            // Update channel lastUpdated
            await db.channels.update(channel.id, { lastUpdated: Date.now() });

        } catch (err) {
            console.error(err);
            setError("Failed to fetch videos");
        }
    }, [apiKeys.youtube]);

    const fetchAllChannels = async () => {
        if (!registeredChannels) return;
        setIsLoading(true);
        // Execute sequentially or parallel
        for (const ch of registeredChannels) {
            await fetchVideosForChannel(ch);
        }
        setIsLoading(false);
    };

    return {
        searchResults,
        registeredChannels,
        search,
        registerChannel,
        unregisterChannel,
        fetchAllChannels,
        isLoading,
        error
    };
};
