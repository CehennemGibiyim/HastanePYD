// ===== KURUMSAL PLATFORM VERİ VE DENETİM KATMANI =====
const PREFIX = 'enterprise_v1_';
const memory = new Map();
let auditWriteQueue = Promise.resolve();

function storage() { return window.miniappsAI?.storage || null; }
function safeJson(value, fallback) { try { return JSON.parse(value); } catch { return fallback; } }
export async function readEnterprise(key, fallback) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = await storage()?.getItem(PREFIX + key);
    const value = raw ? safeJson(raw, fallback) : fallback;
    memory.set(key, value);
    if (!raw) await writeEnterprise(key, value);
    return value;
  } catch { memory.set(key, fallback); return fallback; }
}
export async function writeEnterprise(key, value) {
  memory.set(key, value);
  try { await storage()?.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch { return false; }
}
export function uid(prefix = 'ent') { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
export function today() { return new Date().toISOString().slice(0, 10); }
export function esc(value = '') { return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out; }, {});
  return value;
}
async function checksum(entry, previous = '') {
  const payload = JSON.stringify(stable({
    previous, id: entry.id, at: entry.at, actor: entry.actor, action: entry.action,
    resource: entry.resource, reason: entry.reason, before: entry.before, after: entry.after,
    context: entry.context
  }));
  try {
    if (window.crypto?.subtle) {
      const bytes = new TextEncoder().encode(payload);
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
  } catch { /* deterministic fallback below */ }
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) hash = Math.imul(hash ^ payload.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
function legacyChecksum(entry, previous = '') {
  const text = `${previous}|${entry.id}|${entry.at}|${entry.action}|${entry.actor}|${entry.resource || ''}`;
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
function normalizeAudit(entry, index = 0) {
  const item = entry && typeof entry === 'object' ? entry : {};
  return {
    id: String(item.id || `audit_legacy_${index}`), at: item.at || item.timestamp || new Date(0).toISOString(),
    actor: String(item.actor || item.userId || 'system'), action: String(item.action || 'unknown'),
    resource: String(item.resource || 'unspecified'), reason: item.reason ? String(item.reason) : '',
    before: item.before ?? null, after: item.after ?? null, context: item.context || {},
    previous: String(item.previous || ''), checksum: String(item.checksum || ''),
    algorithm: item.algorithm || (String(item.checksum || '').length === 64 ? 'sha256-v2' : 'legacy-fnv'),
  };
}
export async function getEnterpriseAudit() {
  const logs = await readEnterprise('audit_chain', []);
  return (Array.isArray(logs) ? logs : []).map(normalizeAudit);
}
export async function verifyEnterpriseAudit(logs = null) {
  const entries = (logs || await getEnterpriseAudit()).map(normalizeAudit).sort((a, b) => new Date(a.at) - new Date(b.at));
  let previous = 'GENESIS';
  const invalid = [];
  let legacyCount = 0;
  for (const entry of entries) {
    if (!entry.checksum) { invalid.push({ id: entry.id, reason: 'missing_checksum' }); continue; }
    const expected = entry.algorithm === 'legacy-fnv' ? legacyChecksum(entry, previous) : await checksum(entry, previous);
    if (entry.algorithm === 'legacy-fnv') legacyCount += 1;
    if (entry.previous !== previous || entry.checksum !== expected) invalid.push({ id: entry.id, reason: 'chain_mismatch' });
    previous = entry.checksum;
  }
  return { valid: invalid.length === 0, checked: entries.length, legacyCount, invalid, head: previous };
}
export async function appendEnterpriseAudit(entry = {}) {
  const task = async () => {
    const logs = await getEnterpriseAudit();
    const previous = logs.reduce((head, item) => new Date(item.at) > new Date(head.at || 0) ? item : head, { checksum: 'GENESIS' }).checksum || 'GENESIS';
    const item = normalizeAudit({
      id: uid('audit'), at: new Date().toISOString(), actor: 'system', action: 'unknown', resource: 'unspecified',
      reason: '', before: null, after: null, algorithm: 'sha256-v2',
      context: { sessionId: window.__hospitalAuditSession || 'browser-session', userAgent: navigator.userAgent.slice(0, 160), source: 'miniapp' },
      ...entry, previous,
    });
    item.checksum = await checksum(item, previous);
    const next = [item, ...logs].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 1000);
    if (!await writeEnterprise('audit_chain', next)) throw new Error('audit_write_failed');
    return item;
  };
  const result = auditWriteQueue.then(task);
  auditWriteQueue = result.catch(() => undefined);
  return result;
}
export function flushAuditWrites() { return auditWriteQueue; }
export function canManage() { return ['admin', 'supervisor'].includes(window.__enterpriseUserRole || 'admin'); }
export function canAccess(resource, action = 'read') {
  if (action === 'read') return true;
  return canManage() || Boolean(window.__enterpriseBreakGlass?.resource === resource);
}
export async function openBreakGlass({ resource, reason, actor }) {
  if (!canManage()) throw new Error('forbidden');
  const item = { id: uid('breakglass'), resource, reason, actor, openedAt: new Date().toISOString(), expiresAt: Date.now() + 30 * 60 * 1000, status: 'active' };
  await writeEnterprise('break_glass', item);
  window.__enterpriseBreakGlass = item;
  await appendEnterpriseAudit({ action: 'break_glass_open', actor, resource, reason });
  return item;
}
export async function closeBreakGlass(actor) {
  const current = await readEnterprise('break_glass', null);
  if (current) { current.status = 'closed'; current.closedAt = new Date().toISOString(); await writeEnterprise('break_glass', current); }
  window.__enterpriseBreakGlass = null;
  return appendEnterpriseAudit({ action: 'break_glass_close', actor, resource: current?.resource || 'unknown' });
}
export async function getActiveBreakGlass() {
  const item = await readEnterprise('break_glass', null);
  if (!item || item.status !== 'active' || item.expiresAt < Date.now()) { window.__enterpriseBreakGlass = null; return null; }
  window.__enterpriseBreakGlass = item;
  return item;
}
export async function migrateLegacyToEnterprise() {
  let keys = [];
  try { keys = Object.keys(localStorage).filter(key => key.startsWith('hospital_') && key !== 'hospital_session'); } catch { /* unavailable */ }
  let copied = 0;
  for (const key of keys) {
    try { const value = safeJson(localStorage.getItem(key), null); if (value !== null && await writeEnterprise(`legacy_${key.slice(8)}`, value)) copied += 1; } catch { /* keep source for recovery */ }
  }
  const result = { copied, total: keys.length, at: new Date().toISOString() };
  await writeEnterprise('legacy_migration', result);
  await appendEnterpriseAudit({ action: 'legacy_migration', actor: 'system', resource: 'storage', after: result });
  return result;
}
export async function exportEnterpriseSnapshot(snapshot) {
  const payload = { schema: 'enterprise-v1', generatedAt: new Date().toISOString(), ...snapshot, audit: await getEnterpriseAudit() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-pys-kurumsal-kanit-${today()}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  await appendEnterpriseAudit({ action: 'evidence_export', actor: snapshot.actor || 'system', resource: 'enterprise_snapshot' });
}
