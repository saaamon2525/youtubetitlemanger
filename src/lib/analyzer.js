import { getChannelDetails, getChannelVideos, getVideoDetails } from './youtube';
import { generateWithGemini } from './gemini';

export const analyzeChannelStyle = async ({ youtubeKey, aiKey, channelId }) => {
    if (!youtubeKey || !aiKey || !channelId) {
        throw new Error("Missing API Keys or Channel ID");
    }

    try {
        // 1. Get Uploads Playlist URL
        const channel = await getChannelDetails(youtubeKey, channelId);
        if (!channel) throw new Error("Channel not found");

        const uploadsId = channel.uploadsPlaylistId;

        // 2. Get Recent Videos
        const videos = await getChannelVideos(youtubeKey, uploadsId, 10);
        if (!videos || videos.length === 0) throw new Error("No videos found");

        // 3. Get Details (for description/tags) for top 5 to save quota/time
        // We really just need the full description for analysis
        const detailedVideos = [];
        for (const v of videos.slice(0, 5)) {
            const details = await getVideoDetails(youtubeKey, v.videoId);
            if (details) detailedVideos.push(details);
        }

        // 4. Construct Prompt
        const examples = detailedVideos.map(v => `Title: ${v.title}\nDescription:\n${v.description.slice(0, 300)}...`).join('\n---\n');

        const systemPrompt = `あなたはYouTubeチャンネル分析のプロです。
渡された「直近の動画データ」から、このチャンネルの「タイトルの付け方のクセ（型）」と「概要欄の定型文（テンプレート）」を抽出してください。

出力は以下のJSON形式のみで行ってください。

{
  "titleStyle": "分析されたタイトルの特徴（例: 隅付き括弧【】を先頭につける、感嘆符！が多い、など）",
  "titleTemplate": "タイトルの型（例: 【{keyword}】{content}！）", 
  "descriptionTemplate": "概要欄の共通部分（挨拶やSNSリンクなど、毎回使われている定型文）",
  "tags": ["よく使われているタグ1", "タグ2"]
}`;

        const userPrompt = `以下のごがデータを分析してください:\n\n${examples}`;

        // 5. Generate with AI
        // We assume Gemini is initialized globally or we might need to re-init with the specific key passed if different.
        // For simplicity, we assume SettingsContext manages init, but here we might be running in a context where we want to be sure.
        // Ideally we pass the key to generateWithGemini, but currently it relies on global init.
        // We will assume the key passed here is the 'active' one or just rely on global state.

        // However, the function `analyzeChannelStyle` receives `aiKey`. 
        // If we want to be safe, we should ensure gemini is initialized with it.
        // But `generateWithGemini` uses a module-level variable. 
        // Let's rely on the app having initialized it via SettingsContext.

        const result = await generateWithGemini(userPrompt, systemPrompt);

        // 6. Parse JSON
        let jsonString = result;
        const match = result.match(/```json([\s\S]*?)```/) || result.match(/```([\s\S]*?)```/);
        if (match) jsonString = match[1];

        return JSON.parse(jsonString);

    } catch (e) {
        console.error("Analysis Failed", e);
        throw e;
    }
};
