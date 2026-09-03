import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_key_here') {
    return res.status(500).json({
      error: 'MiniSo cloud AI is not configured yet. Add OPENAI_API_KEY to the Vercel project Environment Variables, then redeploy.'
    });
  }

  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (!messages.length) {
      return res.status(400).json({ error: 'No chat messages were provided.' });
    }

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages
      })
    });

    const raw = await response.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { /* non-JSON upstream response */ }

    if (!response.ok) {
      const upstreamMessage = data?.error?.message || data?.message || raw || `HTTP ${response.status}`;
      return res.status(response.status).json({
        error: `Cloud AI provider returned HTTP ${response.status}: ${upstreamMessage}`
      });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(502).json({ error: 'Cloud AI provider returned no message text.' });
    }

    return res.status(200).json({ text: text.trim() });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unexpected server error.';
    return res.status(500).json({
      error: `MiniSo could not contact the cloud AI provider: ${detail}`
    });
  }
}
