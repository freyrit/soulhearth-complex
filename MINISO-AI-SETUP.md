# MiniSo AI setup — Cloud only

MiniSo uses the cloud AI endpoint only. **Ollama and Qwen are not required.**

## Local development

The included `api/chat.ts` is a Vercel serverless function. A plain `npm run dev` starts Vite only, so `/api/chat` will not be available unless you use a compatible local server setup.

For Vercel deployment, set these environment variables:

- `OPENAI_API_KEY` = your API key
- `OPENAI_MODEL` = model name (default `gpt-5-mini`)
- optionally `OPENAI_BASE_URL` = an OpenAI-compatible API base URL

The API key is kept server-side and is never placed in `index.html` or `src/main.ts`.

## Important

Do not install Ollama or download Qwen3:4b for this version. MiniSo is cloud-only.
