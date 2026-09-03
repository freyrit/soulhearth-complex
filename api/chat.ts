import type { VercelRequest, VercelResponse } from '@vercel/node';

// MiniSo uses OpenRouter only. There is intentionally no OpenAI fallback.
const MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';
const BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_key_here') {
    return res.status(500).json({
      error: 'MiniSo is not configured for OpenRouter yet. Add OPENROUTER_API_KEY to the Vercel project Environment Variables, then redeploy.'
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
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://soulhearth-complex.vercel.app/',
        'X-Title': 'SOULHEARTH MiniSo'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 120,
        temperature: 0.85
      })
    });

    const raw = await response.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { /* non-JSON upstream response */ }

    if (!response.ok) {
      const upstreamMessage = data?.error?.message || data?.message || raw || `HTTP ${response.status}`;
      return res.status(response.status).json({
        error: `OpenRouter returned HTTP ${response.status}: ${upstreamMessage}`
      });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(502).json({ error: 'OpenRouter returned no message text.' });
    }

    return res.status(200).json({ text: text.trim() });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unexpected server error.';
    return res.status(500).json({
      error: `MiniSo could not contact OpenRouter: ${detail}`
    });
  }
}
