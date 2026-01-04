import React, { useState } from 'react';
import KeywordCloud from './KeywordCloud';
import AIPlanner from './AIPlanner';

const AnalysisPane = () => {
    const [selectedKeyword, setSelectedKeyword] = useState('');

    return (
        <div className="analysis-pane" style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: '16px' }}>
                <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>分析・企画</h2>
            </div>

            <KeywordCloud onKeywordSelect={setSelectedKeyword} />

            <AIPlanner startKeyword={selectedKeyword} />
        </div>
    );
};

export default AnalysisPane;
