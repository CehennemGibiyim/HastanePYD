// ===== VERİ KALİTESİ VE TUTARSIZLIK KONTROL SERVİSİ =====
import { getPersonnel, getPersonnelTypes, getUsers, getDepartments, getSchedules } from '../state.js';
import { getCentral, setCentral } from './central-storage-bridge.js';
import { appendEnterpriseAudit } from './enterprise-storage.js';

const KEY = 'data_quality_latest';
const HISTORY_KEY = 'data_quality_history';
const now = () => new Date().toISOString();
const text = value => String(value ?? '').trim();
const norm = value => text(value).toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ');
const hash = value => { let h = 2166136261; for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16); };
const issue = (entityType, entityId, category, severity, title, detail, recommendation, fingerprint) => ({ id: `dq_${hash(fingerprint)}`, entityType, entityId: String(entityId ?? ''), category, severity, title, detail, recommendation, fingerprint, status: 'open', firstSeenAt: now(), lastSeenAt: now(), occurrences: 1 });

function add(list, item) { const existing = list.find(value => value.fingerprint === item.fingerprint); if (existing) existing.occurrences += 1; else list.push(item); }
function duplicateGroups(records, selector) {
  const groups = new Map();
  records.forEach(record => { const key = selector(record); if (key) groups.set(key, [...(groups.get(key) || []), record]); });
  return [...groups.values()].filter(group => group.length > 1);
}

export async function runDataQualityScan(actor = 'system') {
  const personnel = getPersonnel();
  const users = getUsers();
  const schedules = getSchedules();
  const departments = new Set(getDepartments().map(norm));
  const types = new Set(Object.keys(getPersonnelTypes()));
  const findings = [];
  const required = ['name', 'surname', 'tc', 'department', 'type', 'status'];
  personnel.forEach(person => {
    required.forEach(field => { if (!text(person[field])) add(findings, issue('personnel', person.id, 'missing', 'high', 'Eksik zorunlu alan', `${person.name || person.id}: ${field}`, 'Personel kaydındaki zorunlu alanı tamamlayın.', `missing:${person.id}:${field}`)); });
    if (text(person.department) && !departments.has(norm(person.department))) add(findings, issue('personnel', person.id, 'invalid', 'medium', 'Tanımsız birim', `${person.name || person.id}: ${person.department}`, 'Birim sözlüğündeki geçerli bir değeri seçin.', `department:${person.id}:${norm(person.department)}`));
    if (text(person.type) && !types.has(person.type)) add(findings, issue('personnel', person.id, 'invalid', 'medium', 'Tanımsız personel türü', `${person.name || person.id}: ${person.type}`, 'Personel türünü tanımlı seçeneklerden biriyle eşleştirin.', `type:${person.id}:${person.type}`));
    if (!['active', 'inactive', 'on_leave'].includes(person.status)) add(findings, issue('personnel', person.id, 'invalid', 'medium', 'Geçersiz durum değeri', `${person.name || person.id}: ${person.status}`, 'Durum alanını geçerli bir değere dönüştürün.', `status:${person.id}:${person.status}`));
  });
  duplicateGroups(personnel, p => text(p.tc) && norm(p.tc)).forEach(group => add(findings, issue('personnel', group.map(p => p.id).join(','), 'duplicate', 'critical', 'Aynı kimlik numarası birden fazla kayıtta', group.map(p => p.name || p.id).join(' · '), 'Kimlik numarasını doğrulayın ve mükerrer kaydı birleştirin.', `tc:${group.map(p => p.id).sort().join('|')}`)));
  duplicateGroups(personnel, p => text(p.phone) && norm(p.phone)).forEach(group => add(findings, issue('personnel', group.map(p => p.id).join(','), 'duplicate', 'high', 'Aynı telefon birden fazla kayıtta', group.map(p => p.name || p.id).join(' · '), 'Telefon bilgisini doğrulayın; ortak birim telefonuysa not ekleyin.', `phone:${group.map(p => p.id).sort().join('|')}`)));
  duplicateGroups(personnel, p => `${norm(p.name)}|${norm(p.surname)}|${norm(p.department)}`).forEach(group => add(findings, issue('personnel', group.map(p => p.id).join(','), 'duplicate', 'high', 'Benzer personel kaydı', group.map(p => `${p.name || ''} ${p.surname || ''}`).join(' · '), 'Kimlik ve iletişim bilgilerini karşılaştırarak tek kayda indirin.', `name:${group.map(p => p.id).sort().join('|')}`)));
  const userNames = new Map();
  users.forEach(user => { const key = norm(user.username); if (!key) add(findings, issue('user', user.username, 'missing', 'critical', 'Kullanıcı adı eksik', 'Kimlik kaydında kullanıcı adı bulunmuyor.', 'Kullanıcı hesabını düzeltin veya pasifleştirin.', `user-name:${user.username}`)); else userNames.set(key, [...(userNames.get(key) || []), user]); });
  [...userNames.entries()].filter(([, group]) => group.length > 1).forEach(([key, group]) => add(findings, issue('user', key, 'duplicate', 'critical', 'Mükerrer kullanıcı hesabı', group.map(user => user.username).join(' · '), 'Tekil kullanıcı adı kuralını uygulayın ve gereksiz hesabı kapatın.', `user-duplicate:${key}`)));
  const personnelIds = new Set(personnel.map(person => String(person.id)));
  schedules.forEach(schedule => { if (!personnelIds.has(String(schedule.personnelId))) add(findings, issue('schedule', schedule.id, 'inconsistent', 'high', 'Sahipsiz vardiya kaydı', `Vardiya ${schedule.id} mevcut olmayan personel ${schedule.personnelId} kaydına bağlı.`, 'Vardiyayı silin veya doğru personele bağlayın.', `schedule:${schedule.id}:${schedule.personnelId}`)); });
  let open = 0;
  const previous = await getCentral(KEY, null);
  const previousByFingerprint = new Map((previous?.findings || []).map(item => [item.fingerprint, item]));
  findings.forEach(item => { const old = previousByFingerprint.get(item.fingerprint); if (old) { item.status = old.status === 'resolved' ? 'open' : old.status; item.firstSeenAt = old.firstSeenAt || item.firstSeenAt; item.occurrences += Number(old.occurrences || 0); } });
  open = findings.filter(item => item.status !== 'resolved').length;
  const snapshot = { schema: 'hospital-pys-data-quality-v1', scannedAt: now(), actor, counts: { records: personnel.length, users: users.length, schedules: schedules.length, findings: findings.length, critical: findings.filter(i => i.severity === 'critical').length, high: findings.filter(i => i.severity === 'high').length, medium: findings.filter(i => i.severity === 'medium').length, open }, findings };
  if (!await setCentral(KEY, snapshot)) throw new Error('data_quality_storage_failed');
  const history = await getCentral(HISTORY_KEY, []);
  await setCentral(HISTORY_KEY, [snapshot, ...(Array.isArray(history) ? history : [])].slice(0, 12));
  await appendEnterpriseAudit({ action: 'data_quality_scan', actor, resource: KEY, after: snapshot.counts });
  return snapshot;
}

export async function readDataQualitySnapshot() { return getCentral(KEY, null); }
export async function updateDataQualityFinding(id, status, actor = 'system') {
  const snapshot = await readDataQualitySnapshot();
  if (!snapshot?.findings?.length) throw new Error('data_quality_not_scanned');
  const finding = snapshot.findings.find(item => item.id === id);
  if (!finding) throw new Error('data_quality_finding_not_found');
  const nextStatus = ['open', 'acknowledged', 'resolved'].includes(status) ? status : 'open';
  finding.status = nextStatus; finding.updatedAt = now(); finding.updatedBy = actor;
  snapshot.updatedAt = now(); snapshot.actor = actor;
  if (!await setCentral(KEY, snapshot)) throw new Error('data_quality_storage_failed');
  await appendEnterpriseAudit({ action: `data_quality_${nextStatus}`, actor, resource: finding.entityId, before: { status: status === nextStatus ? 'open' : status }, after: { status: nextStatus, category: finding.category } });
  return snapshot;
}
export async function exportDataQualityEvidence(snapshot, actor = 'system') {
  const payload = { ...snapshot, exportedAt: now(), actor, findings: (snapshot?.findings || []).map(item => ({ ...item })) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-pys-veri-kalitesi-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  await appendEnterpriseAudit({ action: 'data_quality_evidence_exported', actor, resource: KEY, after: { findings: payload.findings.length } });
}
