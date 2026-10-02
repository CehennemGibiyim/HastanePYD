// ===== YÖNETİM PLATFORMU VERİ KATMANI =====
const PREFIX = 'platform_suite_';
const memory = new Map();

export async function readPlatform(key, fallback) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = await window.miniappsAI?.storage?.getItem(PREFIX + key);
    const value = raw ? JSON.parse(raw) : fallback;
    memory.set(key, value);
    if (!raw) await writePlatform(key, value);
    return value;
  } catch {
    memory.set(key, fallback);
    return fallback;
  }
}

export async function writePlatform(key, value) {
  memory.set(key, value);
  try { await window.miniappsAI?.storage?.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* preview fallback */ }
  return value;
}

export function uid(prefix = 'record') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
export function today() { return new Date().toISOString().slice(0, 10); }
export function dateLabel(value) { return value ? new Date(value).toLocaleDateString('tr-TR') : '—'; }
export function esc(value = '') { return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
export function canWrite() { return Boolean(window.__platformCanWrite !== false && window.miniappsAI) || !window.miniappsAI; }
export function statusClass(value) { return value === 'critical' ? 'text-red-300' : value === 'watch' ? 'text-amber-300' : 'text-emerald-300'; }
