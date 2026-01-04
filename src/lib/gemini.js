import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let model = null;
let currentKey = null;

const MODEL_NAME = "gemini-flash-latest";

export const initGemini = (apiKey) => {
    if (!apiKey) {
        console.warn("Gemini API Key is empty");
        return;
    }
    currentKey = apiKey;
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        // Default model without tools
        model = genAI.getGenerativeModel({ model: MODEL_NAME });
        console.log(`Gemini Initialized (${MODEL_NAME}) with key length:`, apiKey.length);
    } catch (e) {
        console.error("Gemini Init Failed:", e);
    }
};

export const generateWithGemini = async (prompt, systemInstruction, useSearch = false) => {
    if (!genAI) {
        throw new Error("Gemini API is not initialized. Please set your API Key in Settings.");
    }

    try {
        const finalPrompt = systemInstruction
            ? `System Instruction:\n${systemInstruction}\n\nUser Request:\n${prompt}`
            : prompt;

        console.log("Gemini: Sending Request...", { model: MODEL_NAME, useSearch, promptLength: finalPrompt.length });

        // If search is requested, create a fresh model instance with tools
        let targetModel = model;
        if (useSearch) {
            console.log("Gemini: Enabling Google Search Grounding");
            targetModel = genAI.getGenerativeModel({
                model: MODEL_NAME,
                tools: [{ googleSearch: {} }]
            });
        }

        // Add 60s timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out (60s)")), 60000)
        );

        const generatePromise = async () => {
            const result = await targetModel.generateContent(finalPrompt);
            const response = await result.response;
            console.log("Gemini: Response Received");
            return response.text();
        };

        return await Promise.race([generatePromise(), timeoutPromise]);
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw error;
    }
};

// Debug helper
export const getAvailableGeminiModels = async () => {
    if (!currentKey) return "API Key not set";
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${currentKey}`);
        const data = await response.json();
        if (data.models) {
            return data.models.map(m => m.name.replace('models/', '')).join(', ');
        }
        return JSON.stringify(data);
    } catch (e) {
        return "Failed to fetch models: " + e.message;
    }
};
