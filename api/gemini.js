export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY 未設定於 Vercel 環境變數中' });
    }

    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt 為必填欄位' });
        }

        // 1. 自動取得當前的真實日期 (YYYY-MM-DD)
        const todayStr = new Date().toISOString().split('T')[0];

        // 2. 構建 Payload：注入系統日期 + 開啟 Google Search 聯網
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: {
                parts: [{ 
                    text: `Today's date is ${todayStr}. You are an expert NBA Fantasy Basketball analyst. Always answer using up-to-date and accurate information as of this date.` 
                }]
            },
            tools: [{ googleSearch: {} }] // 開啟 Google Search 實時聯網
        };

        // 自動備援機制 (3.5-flash -> 3.8-flash)
        const models = ['gemini-3.5-flash', 'gemini-3.8-flash'];
        let lastErrorData = null;

        for (const model of models) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }
            );

            const data = await response.json();

            if (response.ok) {
                return res.status(200).json(data);
            }

            lastErrorData = data;
            if (response.status !== 503) {
                return res.status(response.status).json(data);
            }
        }

        return res.status(503).json(lastErrorData);

    } catch (error) {
        return res.status(500).json({ error: error.message || 'Server Error' });
    }
}
