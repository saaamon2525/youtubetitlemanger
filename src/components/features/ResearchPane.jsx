import React from 'react';
import ChannelSearch from './ChannelSearch';
import RegisteredChannelList from './RegisteredChannelList';
import VideoFeed from './VideoFeed';
import StockedVideos from './StockedVideos';

const ResearchPane = () => {
    return (
        <div className="research-pane" style={{ padding: 0 }}>
            {/* Search Section */}
            <div style={{ padding: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>リサーチ</h2>
                <ChannelSearch />
            </div>

            <div style={{ height: '1px', background: 'var(--divider-color)' }} />

            {/* Stocked Videos (Input for Analysis) */}
            <StockedVideos />

            {/* List of subs */}
            <div style={{ padding: '0 16px' }}>
                <RegisteredChannelList />
            </div>

            {/* Feed */}
            <VideoFeed />
        </div>
    );
};

export default ResearchPane;
