import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server.' });

  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.7 })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Upstream AI request failed.' });
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return res.status(502).json({ error: 'Upstream AI returned no message.' });
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
}
