import React, { createContext, useContext, useState, useEffect } from 'react';
import { initGemini } from '../lib/gemini';
import { initOpenAI } from '../lib/openai';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [apiKeys, setApiKeys] = useState({
        gemini: '',
        openai: '',
        youtube: '',
    });
    const [selectedModel, setSelectedModel] = useState('gemini'); // 'gemini' or 'openai'
    const [channelId, setChannelId] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');
    const [currentStockGroupId, setCurrentStockGroupId] = useState(1); // Default to 1
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Load from localStorage
        const storedGemini = localStorage.getItem('apiKeyGemini') || '';
        const storedOpenAI = localStorage.getItem('apiKeyOpenAI') || '';
        const storedYouTube = localStorage.getItem('apiKeyYouTube') || '';
        const storedModel = localStorage.getItem('selectedModel') || 'gemini';
        const storedChannelId = localStorage.getItem('myChannelId') || '';
        const storedInstructions = localStorage.getItem('customInstructions') || '';
        const storedGroupId = parseInt(localStorage.getItem('currentStockGroupId') || '1', 10);

        setApiKeys({
            gemini: storedGemini,
            openai: storedOpenAI,
            youtube: storedYouTube,
        });
        setSelectedModel(storedModel);
        setChannelId(storedChannelId);
        setCustomInstructions(storedInstructions);
        setCurrentStockGroupId(storedGroupId);

        // Initialize SDKs
        if (storedGemini) initGemini(storedGemini);
        if (storedOpenAI) initOpenAI(storedOpenAI);
    }, []);

    const setActiveStockGroup = (id) => {
        setCurrentStockGroupId(id);
        localStorage.setItem('currentStockGroupId', id);
    };

    const saveSettings = (newKeys, newModel, newChannelId, newInstructions) => {
        // ... (existing)
        localStorage.setItem('apiKeyGemini', newKeys.gemini);
        localStorage.setItem('apiKeyOpenAI', newKeys.openai);
        localStorage.setItem('apiKeyYouTube', newKeys.youtube);
        localStorage.setItem('selectedModel', newModel);
        localStorage.setItem('myChannelId', newChannelId);
        localStorage.setItem('customInstructions', newInstructions !== undefined ? newInstructions : customInstructions);

        setApiKeys(newKeys);
        setSelectedModel(newModel);
        setChannelId(newChannelId);
        if (newInstructions !== undefined) setCustomInstructions(newInstructions);

        // Re-init SDKs
        if (newKeys.gemini) initGemini(newKeys.gemini);
        if (newKeys.openai) initOpenAI(newKeys.openai);
    };

    const openSettings = () => setIsOpen(true);
    const closeSettings = () => setIsOpen(false);

    return (
        <SettingsContext.Provider value={{
            apiKeys,
            selectedModel,
            channelId,
            customInstructions,
            currentStockGroupId,
            setActiveStockGroup,
            saveSettings,
            isOpen,
            openSettings,
            closeSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
};
