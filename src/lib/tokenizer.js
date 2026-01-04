import kuromoji from 'kuromoji';

let tokenizer = null;
let isLoading = false;

// Initialize tokenizer
export const initTokenizer = () => {
    if (tokenizer || isLoading) return Promise.resolve(tokenizer);

    isLoading = true;
    return new Promise((resolve, reject) => {
        // Use relative path for better compatibility depending on deployment
        // But for local dev /dict is usually root of public
        kuromoji.builder({ dicPath: "./dict" }).build((err, _tokenizer) => {
            isLoading = false;
            if (err) {
                console.error("Kuromoji Init Failed:", err);
                reject(err);
            } else {
                tokenizer = _tokenizer;
                console.log("Kuromoji Initialized");
                resolve(tokenizer);
            }
        });
    });
};

export const extractKeywords = async (text) => {
    if (!tokenizer) await initTokenizer();

    const tokens = tokenizer.tokenize(text);
    // Extract Nouns (名詞) and Adjectives (形容詞)
    // Filter out common stop words if necessary
    return tokens
        .filter(token => (token.pos === '名詞' || token.pos === '形容詞') && token.surface_form.length > 1) // Ignore single chars
        .map(token => token.surface_form);
};

export const analyzeTitles = async (titles) => {
    if (!tokenizer) await initTokenizer();

    const wordCounts = {};

    for (const title of titles) {
        const keywords = await extractKeywords(title);
        keywords.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
    }

    // Convert to array and sort
    return Object.entries(wordCounts)
        .map(([text, value]) => ({ text, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50); // Top 50
};
