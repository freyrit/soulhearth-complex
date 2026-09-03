# MiniSo — Cloud AI setup

MiniSo in this project is **cloud-AI only**. Ollama and Qwen are not required.

## Vercel (recommended)

1. Push this project to GitHub.
2. Import the repository into Vercel.
3. In **Vercel → Project → Settings → Environment Variables**, add:

   - `OPENAI_API_KEY` = your cloud provider API key
   - `OPENAI_MODEL` = `gpt-5-mini` (or another chat-completions-compatible model you use)

   `OPENAI_BASE_URL` is optional and should only be set when using an OpenAI-compatible provider other than the default OpenAI endpoint.

4. Make sure the variables are enabled for the environment you are deploying (usually **Production**; also enable **Preview** if you want previews to use MiniSo).
5. **Redeploy** after adding/changing the variables.

The API key is used only by `api/chat.ts` on the server. It is not placed in the browser code.

## Why localhost and the deployed site are different

`npm run dev` starts Vite, while `/api/chat` is a Vercel serverless function. For local MiniSo testing, use a Vercel-compatible dev server such as `vercel dev`, or deploy to Vercel.

## If MiniSo shows HTTP 500

The most common cause is that `OPENAI_API_KEY` has not been added to the Vercel project, or the deployment happened before the variable was added. Add/update the variable and **redeploy**.

If the key is configured but the provider rejects the request, MiniSo will now show the provider's returned HTTP status/message instead of hiding it behind a generic 500 message.

Never commit a real API key to GitHub.
