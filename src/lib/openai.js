import OpenAI from "openai";

let openai = null;

export const initOpenAI = (apiKey) => {
    if (!apiKey) return;
    openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side only apps
    });
};

export const generateWithOpenAI = async (prompt, systemInstruction) => {
    if (!openai) throw new Error("OpenAI API is not initialized. Please set your API Key.");

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction || "You are a helpful assistant." },
                { role: "user", content: prompt },
            ],
            model: "gpt-4o-mini", // Cost effective default
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Generation Error:", error);
        throw error;
    }
};
