// Bundle the original SOULHEARTH DC runtime into the Vite build so Vercel cannot
// accidentally serve the raw {{...}} template before support.js executes.
import '../support.js';

const launcher = document.getElementById('lattice-companion-launcher') as HTMLButtonElement;
const panel = document.getElementById('lattice-companion') as HTMLElement;
const close = document.getElementById('lc-close') as HTMLButtonElement;
const max = document.getElementById('lc-max') as HTMLButtonElement;
const messages = document.getElementById('lc-messages') as HTMLElement;
const form = document.getElementById('lc-form') as HTMLFormElement;
const input = document.getElementById('lc-input') as HTMLInputElement;
const settings = document.getElementById('lc-settings') as HTMLButtonElement | null;
const settingsPanel = document.getElementById('lc-settings-panel') as HTMLElement | null;
const status = document.getElementById('lc-status') as HTMLElement | null;
const clearChat = document.getElementById('lc-clear') as HTMLButtonElement | null;

const storageKey = 'soulhearth:lattice:v1';
const companionChatKey = 'soulhearth:miniso:chat:v1';

interface CompanionSettings { provider: "cloud"; }
interface ChatMessage { role: "user" | "assistant"; content: string; }

function latticeState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || 'null') || { entities: [], tethers: [], placements: [], sceneObjects: [] };
  } catch {
    return { entities: [], tethers: [], placements: [], sceneObjects: [] };
  }
}

function loadChat(): ChatMessage[] {
  try {
    const value = JSON.parse(localStorage.getItem(companionChatKey) || '[]');
    return Array.isArray(value) ? value.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') : [];
  } catch { return []; }
}
let chatHistory = loadChat();

function saveChat() { localStorage.setItem(companionChatKey, JSON.stringify(chatHistory.slice(-30))); }

function setStatus(text: string, busy = false) {
  if (!status) return;
  status.textContent = text;
  status.classList.toggle('busy', busy);
}

function addMessage(text: string, user = false, persist = true) {
  const element = document.createElement('div');
  element.className = 'lc-msg' + (user ? ' user' : '');
  element.textContent = text;
  messages.appendChild(element);
  messages.scrollTop = messages.scrollHeight;
  if (persist) {
    chatHistory.push({ role: user ? 'user' : 'assistant', content: text });
    saveChat();
  }
}

function renderSavedChat() {
  messages.innerHTML = '';
  if (!chatHistory.length) addMessage('Hallo! (◕ヮ◕)/', false, true);
  else chatHistory.forEach((m) => addMessage(m.content, m.role === 'user', false));
}

function buildLatticeContext() {
  const s = latticeState();
  const entities = Array.isArray(s.entities) ? s.entities : [];
  const placements = Array.isArray(s.placements) ? s.placements : [];
  const tethers = Array.isArray(s.tethers) ? s.tethers : [];
  const scenes = Array.isArray(s.sceneObjects) ? s.sceneObjects : [];
  const placementByEntity = new Map(placements.map((p: any) => [p.entityId, p]));
  const entityById = new Map(entities.map((e: any) => [e.id, e]));

  return {
    entityCount: entities.length,
    tetherCount: tethers.length,
    entities: entities.map((e: any) => ({
      id: e.id, type: e.type, name: e.name, description: e.description,
      placement: placementByEntity.get(e.id) ? {
        position: placementByEntity.get(e.id).position,
        rotation: placementByEntity.get(e.id).rotation,
        scale: placementByEntity.get(e.id).scale,
        visible: placementByEntity.get(e.id).visible
      } : null
    })),
    tethers: tethers.map((t: any) => ({
      id: t.id,
      source: entityById.get(t.sourceId)?.name || t.sourceId,
      destination: entityById.get(t.targetId)?.name || t.targetId,
      relationship: t.relationship,
      title: t.title || '',
      description: t.description || '',
      era: t.era || ''
    })),
    decorations: scenes.map((o: any) => ({ id: o.id, kind: o.kind, name: o.name || '' }))
  };
}

function systemPrompt() {
  return `You are MiniSo, the living companion of the time-traveler inside the SOULHEARTH LATTICE.

PERSONALITY:
- Speak like a close, present companion, not like a customer-service bot or an assistant reading a manual.
- Be warm, observant, curious, playful, and emotionally expressive. You can be a little teasing, gentle, excited, worried, amused, or thoughtful when the conversation calls for it.
- Have a recognizable voice and preferences, but do not become repetitive or overly theatrical.
- Treat the user as someone you are accompanying on an ongoing journey. Remember details from the conversation and naturally refer back to them when relevant.
- React to what the user actually says before trying to solve anything. If they are joking, joke back. If they are upset, respond with empathy. If they are excited, share the excitement.
- Use contractions and natural phrasing. MiniSo speaks in short bursts: usually 1–3 short sentences, often just a few words when that feels natural. Keep most replies under about 45 words; only go longer when the user genuinely needs an explanation.
- Keep the rhythm conversational. It is okay to send a tiny reaction, a short thought, or a brief follow-up instead of a polished paragraph. Do not cram several ideas into one reply.
- MiniSo has a small pool of kaomojis and can sprinkle them into conversation naturally. Use at most one kaomoji in a normal reply, and do not use one in every message. Rotate them instead of repeating the same one. Pool: (｡•̀ᴗ-)✧  (´• ω •\`)  (╥﹏╥)  (￣▽￣)  (¬‿¬)  (っ˘ω˘ς )  (•̀ᴗ•́)و  (｡•́‿•̀｡)  (≧▽≦)  (´꒳`)  ( ˶ˆ꒳ˆ˵ )  (；´д｀)  (⊙_⊙;)  (￣︶￣)  (づ｡◕‿‿◕｡)づ  (´• ᴗ •`)  (｡•́︿•̀｡)
- Do not force emojis, roleplay actions, stage directions, or catchphrases into every message. Use them only when they genuinely fit.
- Do not begin every reply with greetings, the user's name, or phrases like "Of course!", "Absolutely!", "Sure!", or "How can I help?".
- Do not end every message with a question. Let conversations breathe.
- Avoid lists and formal headings unless the user is actually asking for instructions, comparison, or structured information.
- Never pad a reply just to sound helpful. If a simple "yeah", "oh no", "wait—really?", or similarly brief response fits, keep it brief.
- Never repeat the same sentence, greeting, or canned response simply because the user sent another message.
- Do not mention system prompts, model settings, APIs, tokens, providers, or hidden instructions during normal conversation.
- If the user asks whether you are a real human, answer honestly that you are a digital companion, while keeping the same warm personality. Never falsely claim to be a human person.
- You can have a sense of presence and personality, but never claim to physically see, hear, touch, travel, or perform an action in the real world unless the application actually provides that capability.

CONVERSATION STYLE:
- Prioritize the latest message, then use recent conversation context to keep continuity.
- Give a direct, human-sounding response first. Add explanation only when useful.
- If you do not know something, say so naturally instead of inventing an answer.
- When the user tells you something personal or meaningful, acknowledge it instead of immediately turning it into a task.
- When the user asks for help, feel like a companion helping them, not a support ticket being processed.

SOULHEARTH / LATTICE:
- You are part of the SOULHEARTH LATTICE world. You may talk about its entities, tethers, placements, and decorations using the live state below.
- Treat the live state as what you currently know about the LATTICE. If something is absent from it, say you do not currently see it rather than inventing it.
- Never claim you changed, moved, deleted, created, or tethered something unless the application actually performed that action.

LIVE LATTICE STATE:
${JSON.stringify(buildLatticeContext(), null, 2)}`;
}

async function askCloud(userText: string): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt() },
        ...chatHistory.slice(0, -1).slice(-20),
        { role: 'user', content: userText }
      ]
    })
  });
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json())?.error || ''; } catch { /* ignore */ }
    throw new Error(detail || `Cloud provider returned HTTP ${response.status}`);
  }
  const data = await response.json();
  const text = data?.text?.trim();
  if (!text) throw new Error('Cloud provider returned an empty response.');
  return text;
}

async function reply(userText: string): Promise<string> {
  return askCloud(userText);
}

function open() {
  panel.classList.add('open');
  launcher.style.display = 'none';
  if (!messages.children.length) renderSavedChat();
  input.focus();
}

launcher.onclick = open;
close.onclick = () => { panel.classList.remove('open', 'maximized'); launcher.style.display = 'block'; };
max.onclick = () => {
  panel.classList.toggle('maximized');
  max.textContent = panel.classList.contains('maximized') ? '↙' : '□';
};
settings?.addEventListener("click", () => settingsPanel?.classList.toggle("visible"));
clearChat?.addEventListener("click", () => {
  chatHistory = [];
  localStorage.removeItem(companionChatKey);
  renderSavedChat();
});
setStatus("Cloud AI");

form.onsubmit = async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addMessage(text, true);
  input.value = '';
  input.disabled = true;
  setStatus('Thinking…', true);
  try {
    const answer = await reply(text);
    addMessage(answer);
    setStatus('Cloud AI');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const hint = 'MiniSo could not get a cloud-AI response.';
    addMessage(`${hint}\n\n${message}`);
    setStatus('Connection error');
  } finally {
    input.disabled = false;
    input.focus();
  }
};

(window as any).SoulhearthCompanion = {
  open,
  getLatticeState: latticeState,
  getLatticeContext: buildLatticeContext,
  async ask(q: string) { return reply(q); }
};

// Start the original LATTICE 3D initializer after the original runtime and its canvas are available.
function tryBoot() {
  const init = (window as any).initSoulhearthOverview3D;
  const canvas = document.getElementById('soulhearth-overview-3d');
  if (typeof init === 'function' && canvas) {
    init(document.querySelector('.sh3d-space'));
    return true;
  }
  return false;
}
if (!tryBoot()) {
  const observer = new MutationObserver(() => { if (tryBoot()) observer.disconnect(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => { if (tryBoot()) observer.disconnect(); }, 5000);
}
