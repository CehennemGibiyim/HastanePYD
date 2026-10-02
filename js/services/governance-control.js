// ===== KURUMSAL YÖNETİŞİM VE TEDARİKÇİ VERİ SERVİSİ =====
import { readPlatform, writePlatform, uid, today } from './platform-storage.js';
import { appendEnterpriseAudit } from './enterprise-storage.js';

const KEY = 'governance_control_center';
const now = () => new Date().toISOString();

export const GOVERNANCE_STAGES = [
  { id: 'third_party', labelKey: 'governance_center.stage.third_party', descKey: 'governance_center.stage_note.third_party' },
  { id: 'compliance', labelKey: 'governance_center.stage.compliance', descKey: 'governance_center.stage_note.compliance' },
  { id: 'data_governance', labelKey: 'governance_center.stage.data_governance', descKey: 'governance_center.stage_note.data_governance' },
  { id: 'committees', labelKey: 'governance_center.stage.committees', descKey: 'governance_center.stage_note.committees' },
  { id: 'emergency', labelKey: 'governance_center.stage.emergency', descKey: 'governance_center.stage_note.emergency' },
  { id: 'process_mining', labelKey: 'governance_center.stage.process_mining', descKey: 'governance_center.stage_note.process_mining' },
  { id: 'knowledge', labelKey: 'governance_center.stage.knowledge', descKey: 'governance_center.stage_note.knowledge' },
  { id: 'maturity', labelKey: 'governance_center.stage.maturity', descKey: 'governance_center.stage_note.maturity' },
];
const stageIds = GOVERNANCE_STAGES.map(stage => stage.id);
const seed = () => ({
  records: [
    { id: 'gov-1', stage: 'third_party', titleKey: 'governance_center.sample.vendor', owner: 'Satın Alma ve Bilgi Güvenliği', due: '2026-10-15', severity: 'high', status: 'in_progress', score: 72, noteKey: 'governance_center.sample.vendor_note' },
    { id: 'gov-2', stage: 'compliance', titleKey: 'governance_center.sample.audit', owner: 'Kalite Direktörlüğü', due: '2026-10-22', severity: 'critical', status: 'open', score: 61, noteKey: 'governance_center.sample.audit_note' },
    { id: 'gov-3', stage: 'data_governance', titleKey: 'governance_center.sample.lineage', owner: 'Veri Yönetimi', due: '2026-11-05', severity: 'medium', status: 'open', score: 68, noteKey: 'governance_center.sample.lineage_note' },
    { id: 'gov-4', stage: 'committees', titleKey: 'governance_center.sample.committee', owner: 'Başhekimlik', due: '2026-10-08', severity: 'medium', status: 'in_progress', score: 84, noteKey: 'governance_center.sample.committee_note' },
    { id: 'gov-5', stage: 'emergency', titleKey: 'governance_center.sample.command', owner: 'Acil Durum Komitesi', due: '2026-09-30', severity: 'high', status: 'open', score: 57, noteKey: 'governance_center.sample.command_note' },
    { id: 'gov-6', stage: 'process_mining', titleKey: 'governance_center.sample.flow', owner: 'Operasyon Yönetimi', due: '2026-11-12', severity: 'medium', status: 'in_progress', score: 76, noteKey: 'governance_center.sample.flow_note' },
    { id: 'gov-7', stage: 'knowledge', titleKey: 'governance_center.sample.policy', owner: 'Eğitim ve Kalite', due: '2026-10-28', severity: 'high', status: 'open', score: 64, noteKey: 'governance_center.sample.policy_note' },
    { id: 'gov-8', stage: 'maturity', titleKey: 'governance_center.sample.scorecard', owner: 'Yönetim Kurulu Sekretaryası', due: '2026-12-01', severity: 'medium', status: 'resolved', score: 91, noteKey: 'governance_center.sample.scorecard_note' },
  ],
  updatedAt: now(),
  schema: 'governance-control-v1',
});

function normalize(value) {
  const base = seed();
  const records = Array.isArray(value?.records) ? value.records : base.records;
  return { ...base, ...(value || {}), records: records.map(item => ({
    ...item,
    id: String(item.id || uid('gov')),
    stage: stageIds.includes(item.stage) ? item.stage : 'third_party',
    severity: ['critical', 'high', 'medium'].includes(item.severity) ? item.severity : 'medium',
    status: ['open', 'in_progress', 'resolved'].includes(item.status) ? item.status : 'open',
    owner: String(item.owner || 'Atanmadı'),
    due: item.due || today(),
    score: Math.max(0, Math.min(100, Number(item.score) || 0)),
    titleKey: item.titleKey || 'governance_center.custom_title',
    noteKey: item.noteKey || 'governance_center.empty_note',
  })) };
}

export async function loadGovernanceControl() { return normalize(await readPlatform(KEY, seed())); }
export async function updateGovernanceRecord(id, status, actor = 'system') {
  const state = await loadGovernanceControl();
  const record = state.records.find(item => item.id === id);
  if (!record) throw new Error('governance_record_not_found');
  const before = record.status;
  record.status = ['open', 'in_progress', 'resolved'].includes(status) ? status : before;
  state.updatedAt = now();
  await writePlatform(KEY, state);
  await appendEnterpriseAudit({ action: 'governance_record_updated', actor, resource: id, before: { status: before }, after: { status: record.status, stage: record.stage } });
  return state;
}
export async function addGovernanceRecord(input, actor = 'system') {
  const state = await loadGovernanceControl();
  const record = { id: uid('gov'), stage: input.stage, titleKey: 'governance_center.custom_title', title: input.title, owner: input.owner, due: input.due, severity: input.severity, status: 'open', score: Number(input.score) || 0, noteKey: 'governance_center.custom_note', note: input.note };
  state.records.unshift(record);
  state.updatedAt = now();
  await writePlatform(KEY, state);
  await appendEnterpriseAudit({ action: 'governance_record_created', actor, resource: record.id, after: { stage: record.stage, severity: record.severity, owner: record.owner } });
  return state;
}
export async function exportGovernanceControl(state, actor = 'system') {
  const payload = { schema: 'hospital-pys-governance-control-v1', exportedAt: now(), actor, ...state };
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  link.download = `hastane-pys-kurumsal-yonetisim-${today()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  await appendEnterpriseAudit({ action: 'governance_evidence_exported', actor, resource: 'governance-control-center', after: { records: state.records.length } });
}
export function governanceSummary(state) {
  const records = state.records || [];
  return { total: records.length, open: records.filter(item => item.status !== 'resolved').length, critical: records.filter(item => item.severity === 'critical' && item.status !== 'resolved').length, average: records.length ? Math.round(records.reduce((sum, item) => sum + item.score, 0) / records.length) : 0, overdue: records.filter(item => item.status !== 'resolved' && item.due < today()).length };
}
