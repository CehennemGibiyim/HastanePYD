// ===== HR SUITE STORAGE =====
// Cross-session state for the enterprise HR surfaces. Uses the Miniapps storage API.
const PREFIX = 'hr_suite_';
const memory = new Map();

function sdkStorage() {
  return window.miniappsAI?.storage || null;
}

export async function readRecord(key, fallback) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = await sdkStorage()?.getItem(PREFIX + key);
    const value = raw ? JSON.parse(raw) : fallback;
    memory.set(key, value);
    if (!raw) await writeRecord(key, value);
    return value;
  } catch {
    memory.set(key, fallback);
    return fallback;
  }
}

export async function writeRecord(key, value) {
  memory.set(key, value);
  try {
    await sdkStorage()?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // The UI remains usable in preview mode when storage is unavailable.
  }
  return value;
}

export function uid(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function dateOnly(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('tr-TR');
}

export function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}
