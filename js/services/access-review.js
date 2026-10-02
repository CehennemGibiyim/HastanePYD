// ===== PERSONEL YETKİ VE ERİŞİM GÖZDEN GEÇİRME SERVİSİ =====
import { getUsers } from '../state.js';
import { readEnterprise, writeEnterprise, appendEnterpriseAudit, uid } from './enterprise-storage.js';

const REVIEW_KEY = 'access_review_records';
const CONFIG_KEY = 'access_review_config';
const DEFAULT_CONFIG = { cycleDays: 90, reminderDays: 14, owner: 'Bilgi Güvenliği', lastRunAt: null };
const DAY = 86400000;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function isoDate(value) { return new Date(value).toISOString(); }
function shiftDate(days) { return isoDate(Date.now() + days * DAY); }
function normalizeConfig(value) {
  const source = value && typeof value === 'object' ? value : {};
  return { ...DEFAULT_CONFIG, ...source, cycleDays: Math.max(30, Number(source.cycleDays) || DEFAULT_CONFIG.cycleDays), reminderDays: Math.max(1, Number(source.reminderDays) || DEFAULT_CONFIG.reminderDays), owner: String(source.owner || DEFAULT_CONFIG.owner).trim() || DEFAULT_CONFIG.owner };
}
function accountRisk(user) {
  if (user.role === 'admin') return 'critical';
  if (user.role === 'supervisor') return 'high';
  return 'standard';
}
function reasonFor(user) {
  if (user.role === 'admin') return 'Ayrıcalıklı yönetici hesabı';
  if (user.role === 'supervisor') return 'Birim ve personel yönetimi yetkisi';
  return 'Salt okunur erişim';
}
function normalizeRecord(item) {
  const source = item && typeof item === 'object' ? item : {};
  return { id: String(source.id || uid('access_review')), username: String(source.username || ''), name: String(source.name || source.username || 'Bilinmeyen kullanıcı'), role: String(source.role || 'viewer'), department: source.department || 'Genel', risk: source.risk || 'standard', reason: String(source.reason || ''), status: ['pending', 'approved', 'revoked', 'deferred'].includes(source.status) ? source.status : 'pending', lastReviewAt: source.lastReviewAt || null, dueAt: source.dueAt || shiftDate(0), reviewer: source.reviewer || null, reviewedAt: source.reviewedAt || null, note: String(source.note || ''), createdAt: source.createdAt || new Date().toISOString(), updatedAt: source.updatedAt || source.createdAt || new Date().toISOString() };
}

export async function readAccessReviewConfig() { return normalizeConfig(await readEnterprise(CONFIG_KEY, DEFAULT_CONFIG)); }
export async function listAccessReviews() {
  const users = getUsers().filter(user => user?.username);
  const stored = await readEnterprise(REVIEW_KEY, null);
  const existing = Array.isArray(stored) ? stored.map(normalizeRecord) : [];
  const byUsername = new Map(existing.map(item => [item.username, item]));
  const now = Date.now();
  let changed = false;
  users.forEach((user, index) => {
    const current = byUsername.get(user.username);
    if (current) {
      if (current.name !== user.name || current.role !== user.role || current.department !== (user.department || 'Genel')) { current.name = user.name || user.username; current.role = user.role || 'viewer'; current.department = user.department || 'Genel'; current.risk = accountRisk(user); current.reason = reasonFor(user); current.updatedAt = new Date().toISOString(); changed = true; }
      return;
    }
    const lastDaysAgo = index === 1 ? 120 : index === 2 ? 80 : index === 3 ? 18 : 40;
    const last = Date.now() - lastDaysAgo * DAY;
    byUsername.set(user.username, normalizeRecord({ id: uid('access_review'), username: user.username, name: user.name, role: user.role, department: user.department || 'Genel', risk: accountRisk(user), reason: reasonFor(user), status: index === 4 ? 'approved' : 'pending', lastReviewAt: new Date(last).toISOString(), dueAt: new Date(last + DEFAULT_CONFIG.cycleDays * DAY).toISOString(), reviewer: index === 4 ? 'system-seed' : null, reviewedAt: index === 4 ? new Date(last + 5 * DAY).toISOString() : null, note: '', createdAt: new Date(last).toISOString() }));
    changed = true;
  });
  const records = [...byUsername.values()].filter(item => users.some(user => user.username === item.username));
  if (changed || !stored) await writeEnterprise(REVIEW_KEY, records);
  return records;
}
export function getReviewState(record, config, now = Date.now()) {
  if (record.status === 'revoked') return 'revoked';
  if (record.status === 'approved' && record.dueAt && new Date(record.dueAt).getTime() > now) return 'approved';
  if (!record.dueAt || new Date(record.dueAt).getTime() <= now) return 'overdue';
  if (new Date(record.dueAt).getTime() - now <= config.reminderDays * DAY) return 'due_soon';
  return 'scheduled';
}
export async function saveAccessReviewConfig(input, actor = 'system') {
  const next = { ...normalizeConfig(input), lastRunAt: new Date().toISOString() };
  await writeEnterprise(CONFIG_KEY, next);
  await appendEnterpriseAudit({ action: 'access_review_policy_updated', actor, resource: CONFIG_KEY, after: next });
  return next;
}
export async function decideAccessReview(id, decision, note, actor = 'system') {
  const records = await listAccessReviews();
  const record = records.find(item => item.id === id);
  if (!record) throw new Error('access_review_not_found');
  const status = ['approved', 'revoked', 'deferred'].includes(decision) ? decision : 'pending';
  const config = await readAccessReviewConfig();
  const before = { status: record.status, dueAt: record.dueAt, reviewer: record.reviewer };
  record.status = status;
  record.reviewer = actor;
  record.reviewedAt = new Date().toISOString();
  record.lastReviewAt = status === 'approved' ? record.reviewedAt : record.lastReviewAt;
  record.dueAt = status === 'approved' ? shiftDate(config.cycleDays) : status === 'deferred' ? shiftDate(7) : record.dueAt;
  record.note = String(note || '').trim().slice(0, 500);
  record.updatedAt = new Date().toISOString();
  await writeEnterprise(REVIEW_KEY, records);
  await appendEnterpriseAudit({ action: `access_review_${status}`, actor, resource: record.username, reason: record.note || 'Periyodik erişim gözden geçirmesi', before, after: { status: record.status, dueAt: record.dueAt, reviewer: record.reviewer } });
  return record;
}
export async function exportAccessReviewEvidence(records, config, actor = 'system') {
  const payload = { schema: 'hospital-pys-access-review-v1', exportedAt: new Date().toISOString(), policy: config, records: records.map(({ password, ...safe }) => safe), actor };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-pys-erisim-gozdenirme-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  await appendEnterpriseAudit({ action: 'access_review_evidence_exported', actor, resource: 'access_review', after: { count: records.length } });
}
export { DEFAULT_CONFIG };
