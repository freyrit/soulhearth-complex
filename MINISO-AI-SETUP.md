# MiniSo — OpenRouter Cloud AI setup

MiniSo in this project is **cloud-AI only** and uses **OpenRouter**. Ollama, Qwen, and an OpenAI API key are not required. The backend intentionally has **no OpenAI fallback**.

## Vercel (recommended)

1. Push this project to GitHub.
2. In **Vercel → Project → Settings → Environment Variables**, remove the old `OPENAI_API_KEY` variable if you no longer need it.
3. Add:

   - `OPENROUTER_API_KEY` = your OpenRouter key from https://openrouter.ai/workspaces/default/keys
   - `OPENROUTER_MODEL` = `openrouter/free`

   `OPENROUTER_BASE_URL` is optional and normally should be left unset because the project already defaults to `https://openrouter.ai/api/v1`.

4. Enable the variables for **Production** (and Preview if desired).
5. **Redeploy** after adding/changing the variables.

The API key is used only by `api/chat.ts` on the server. It is never placed in browser code or committed to GitHub.

## Local development

`npm run dev` starts Vite. For local MiniSo testing with the Vercel `/api/chat` function, use a Vercel-compatible dev server such as `vercel dev`, with the OpenRouter environment variables available locally.

## If MiniSo shows an error

The MiniSo error now reports OpenRouter's HTTP status and message. Common causes are an invalid/missing `OPENROUTER_API_KEY`, an unavailable model, or an OpenRouter account/provider limit.

Never commit a real API key to GitHub.
