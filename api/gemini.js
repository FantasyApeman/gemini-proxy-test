export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY 未設定於 Vercel 環境變數中' });
    }

    try {
        const { prompt, systemInstruction, tools } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt 為必填欄位' });
        }

        const payload = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        if (systemInstruction) payload.systemInstruction = systemInstruction;
        if (tools) payload.tools = tools;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message || 'Server Error' });
    }
}
