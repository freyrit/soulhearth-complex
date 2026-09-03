import * as BABYLON from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';

// Keep the original LATTICE renderer intact; Vite supplies Babylon locally instead of a CDN global.
(window as any).BABYLON = { ...BABYLON, GridMaterial };

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
  return `You are MiniSo, the time-traveler's sidekick inside the SOULHEARTH LATTICE.\n\n` +
    `Be conversational, helpful, curious, and concise. Actually answer the user's latest message. Never repeat a canned greeting as a fallback. You may discuss the LATTICE using the live state below. If the state does not contain something, say you do not currently see it rather than inventing it. You can explain how to use LATTICE features, but do not claim to have changed anything unless the application actually performed that action.\n\n` +
    `LIVE LATTICE STATE:\n${JSON.stringify(buildLatticeContext(), null, 2)}`;
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
    const hint = 'I couldn\'t reach the cloud AI endpoint. For local development, run the Vercel dev server (or deploy to Vercel) so /api/chat is available.';
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

// Start the original LATTICE 3D initializer after Babylon and its canvas are available.
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
