// ===== MERKEZİ GÜVENLİ VERİ KATMANI =====
const PREFIX = 'hospital_secure_';

export async function readSecure(key, fallback = null) {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeSecure(key, value) {
  try {
    await window.miniappsAI?.storage?.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeSecure(key) {
  try {
    await window.miniappsAI?.storage?.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

export function legacyKeys() {
  try {
    return Object.keys(localStorage).filter(key => key.startsWith('hospital_') && key !== 'hospital_session');
  } catch {
    return [];
  }
}

export async function migrateLegacyStorage() {
  const keys = legacyKeys();
  let migrated = 0;
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) continue;
      const ok = await writeSecure(`legacy_${key.slice('hospital_'.length)}`, JSON.parse(raw));
      if (ok) migrated += 1;
    } catch { /* malformed legacy records stay untouched for recovery */ }
  }
  await writeSecure('migration_meta', { migrated, total: keys.length, at: new Date().toISOString() });
  return { migrated, total: keys.length };
}

export async function getSecureStatus() {
  const meta = await readSecure('migration_meta', null);
  return { sdkReady: Boolean(window.miniappsAI?.storage), legacyCount: legacyKeys().length, migration: meta };
}

export async function appendSecureAudit(entry) {
  const logs = await readSecure('audit_log', []);
  const next = [{ id: `audit_${Date.now()}`, at: new Date().toISOString(), ...entry }, ...(Array.isArray(logs) ? logs : [])].slice(0, 1000);
  await writeSecure('audit_log', next);
  return next[0];
}
