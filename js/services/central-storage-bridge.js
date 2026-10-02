// ===== MERKEZİ DEPOLAMA KÖPRÜSÜ =====
// Legacy modüllerin senkron localStorage sözleşmesini korurken veriyi
// miniappsAI.storage üzerinde merkezi ve senkronize bir kopyaya taşır.
const NAMESPACE = 'central_v1_';
const INDEX_KEY = `${NAMESPACE}index`;
const META_KEY = `${NAMESPACE}meta`;
const SESSION_KEY = 'hospital_session';

let nativeStorage = null;
let nativeSetItem = null;
let nativeGetItem = null;
let nativeRemoveItem = null;
let knownKeys = new Set();
let writeQueue = Promise.resolve();
let pendingWrites = 0;
let status = { mode: 'local', migrated: 0, total: 0, lastError: null };

function getStorage() {
  try {
    const value = window.miniappsAI?.storage || null;
    return value && ['getItem', 'setItem', 'removeItem'].every(method => typeof value[method] === 'function') ? value : null;
  } catch { return null; }
}
function getBrowserStorage() {
  try {
    const value = window.localStorage;
    return value && typeof value.getItem === 'function' ? value : null;
  } catch { return null; }
}
function parse(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}
function eligible(key) {
  return typeof key === 'string' && key !== SESSION_KEY && !key.startsWith(NAMESPACE);
}
function centralKey(key) { return `${NAMESPACE}${encodeURIComponent(key)}`; }
function auditValue(value, key) {
  const text = String(value ?? '');
  const sensitive = /(pass|token|secret|health|patient|salary|medical|phone|email)/i.test(key);
  if (sensitive) return { redacted: true, size: text.length };
  try { const parsed = JSON.parse(text); return Array.isArray(parsed) ? { type: 'array', count: parsed.length } : { type: typeof parsed, keys: parsed && typeof parsed === 'object' ? Object.keys(parsed).slice(0, 20) : undefined }; } catch { return { type: 'text', size: text.length }; }
}
function auditStorageMutation(action, key, before, after) {
  import('./enterprise-storage.js').then(({ appendEnterpriseAudit }) => appendEnterpriseAudit({ action, actor: window.__enterpriseActor || 'system', resource: `storage:${key}`, before: auditValue(before, key), after: auditValue(after, key) })).catch(() => {});
}
function browserKeys() {
  if (!nativeStorage) return [];
  const result = [];
  for (let i = 0; i < nativeStorage.length; i += 1) {
    const key = nativeStorage.key(i);
    if (eligible(key)) result.push(key);
  }
  return result;
}
async function centralIndex(storage) {
  try {
    const raw = await storage.getItem(INDEX_KEY);
    const list = parse(raw, []);
    return new Set(Array.isArray(list) ? list.filter(eligible) : []);
  } catch { return new Set(); }
}
async function saveIndex(storage) {
  await storage.setItem(INDEX_KEY, JSON.stringify([...knownKeys].sort()));
}
function enqueue(task) {
  pendingWrites += 1;
  writeQueue = writeQueue.then(task).catch(error => {
    status.lastError = error?.message || 'write_failed';
    status.mode = 'degraded';
  }).finally(() => { pendingWrites = Math.max(0, pendingWrites - 1); });
  return writeQueue;
}
function patchBrowserStorage(storage) {
  if (!nativeStorage || !window.Storage?.prototype || nativeStorage.__centralStoragePatched) return;
  const proto = window.Storage.prototype;
  try {
    proto.setItem = function patchedSetItem(key, value) {
      const before = this === nativeStorage && eligible(key) ? nativeGetItem.call(this, key) : null;
      const result = nativeSetItem.call(this, key, value);
      if (this === nativeStorage && eligible(key)) {
        knownKeys.add(key);
        enqueue(async () => { await storage.setItem(centralKey(key), String(value)); await saveIndex(storage); });
        auditStorageMutation('storage_write', key, before, value);
      }
      return result;
    };
    proto.removeItem = function patchedRemoveItem(key) {
      const before = this === nativeStorage && eligible(key) ? nativeGetItem.call(this, key) : null;
      const result = nativeRemoveItem.call(this, key);
      if (this === nativeStorage && eligible(key)) {
        knownKeys.delete(key);
        enqueue(async () => { await storage.removeItem(centralKey(key)); await saveIndex(storage); });
        auditStorageMutation('storage_remove', key, before, null);
      }
      return result;
    };
    Object.defineProperty(nativeStorage, '__centralStoragePatched', { value: true, configurable: true });
  } catch (error) {
    status.mode = 'degraded';
    status.lastError = error?.message || 'patch_failed';
  }
}

export async function hydrateCentralStorage() {
  nativeStorage = getBrowserStorage();
  const storage = getStorage();
  if (!nativeStorage || !storage) {
    status = { ...status, mode: 'local', lastError: 'central_storage_unavailable' };
    window.__centralStorageStatus = status;
    return status;
  }
  nativeSetItem = Storage.prototype.setItem;
  nativeGetItem = Storage.prototype.getItem;
  nativeRemoveItem = Storage.prototype.removeItem;
  knownKeys = await centralIndex(storage);
  const localKeys = new Set(browserKeys());
  const allKeys = new Set([...knownKeys, ...localKeys]);
  let migrated = 0;
  for (const key of allKeys) {
    try {
      const remote = await storage.getItem(centralKey(key));
      const local = nativeGetItem.call(nativeStorage, key);
      if (remote === null || remote === undefined) {
        if (local !== null) {
          await storage.setItem(centralKey(key), local);
          migrated += 1;
        } else {
          knownKeys.delete(key);
          continue;
        }
      } else if (local !== remote) {
        nativeSetItem.call(nativeStorage, key, remote);
      }
      knownKeys.add(key);
    } catch (error) {
      status.lastError = error?.message || 'hydrate_failed';
    }
  }
  await saveIndex(storage).catch(error => { status.lastError = error?.message || 'index_failed'; });
  await storage.setItem(META_KEY, JSON.stringify({ version: 1, hydratedAt: new Date().toISOString(), keyCount: knownKeys.size })).catch(() => {});
  status = { mode: 'central', migrated, total: allKeys.size, lastError: status.lastError };
  patchBrowserStorage(storage);
  window.__centralStorageStatus = status;
  return status;
}

export function getCentralStorageStatus() { return { ...status, pending: pendingWrites > 0 }; }
export function flushCentralStorage() { return writeQueue; }
export async function getCentral(key, fallback = null) {
  const storage = getStorage();
  if (!storage) return fallback;
  try { const raw = await storage.getItem(centralKey(key)); return raw === null ? fallback : parse(raw, fallback); } catch { return fallback; }
}
export async function setCentral(key, value) {
  const storage = getStorage();
  if (!storage || !eligible(key)) return false;
  try { await storage.setItem(centralKey(key), JSON.stringify(value)); knownKeys.add(key); await saveIndex(storage); return true; } catch { return false; }
}
export async function removeCentral(key) {
  const storage = getStorage();
  if (!storage || !eligible(key)) return false;
  try { await storage.removeItem(centralKey(key)); knownKeys.delete(key); await saveIndex(storage); return true; } catch { return false; }
}
