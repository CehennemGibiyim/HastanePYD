// ===== KURUMSAL GELİŞİM VE DÖNÜŞÜM MERKEZİ =====
import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'transformation_center_v1';
const ACTOR = 'CehennemGibiyim';

export const PHASES = [
  { id: 'executive', labelKey: 'transformation.phase.executive', route: 'executive-panels' },
  { id: 'early_warning', labelKey: 'transformation.phase.early_warning', route: 'operations-forecast' },
  { id: 'workforce', labelKey: 'transformation.phase.workforce', route: 'shift-optimizer' },
  { id: 'patient_flow', labelKey: 'transformation.phase.patient_flow', route: 'patient-flow' },
  { id: 'experience', labelKey: 'transformation.phase.experience', route: 'patient-experience-center' },
  { id: 'finance', labelKey: 'transformation.phase.finance', route: 'revenue-cycle' },
  { id: 'compliance', labelKey: 'transformation.phase.compliance', route: 'production-readiness' },
  { id: 'cyber', labelKey: 'transformation.phase.cyber', route: 'security-center' },
  { id: 'field', labelKey: 'transformation.phase.field', route: 'mobile-staff' },
  { id: 'decisions', labelKey: 'transformation.phase.decisions', route: 'committee' },
];

const seed = [
  ['executive', 'transformation.seed.executive.title', 'transformation.seed.executive.owner', 'transformation.seed.executive.note', 'critical', 76, 7],
  ['early_warning', 'transformation.seed.early_warning.title', 'transformation.seed.early_warning.owner', 'transformation.seed.early_warning.note', 'high', 58, 14],
  ['workforce', 'transformation.seed.workforce.title', 'transformation.seed.workforce.owner', 'transformation.seed.workforce.note', 'high', 64, 18],
  ['patient_flow', 'transformation.seed.patient_flow.title', 'transformation.seed.patient_flow.owner', 'transformation.seed.patient_flow.note', 'critical', 71, 10],
  ['experience', 'transformation.seed.experience.title', 'transformation.seed.experience.owner', 'transformation.seed.experience.note', 'medium', 49, 24],
  ['finance', 'transformation.seed.finance.title', 'transformation.seed.finance.owner', 'transformation.seed.finance.note', 'high', 43, 28],
  ['compliance', 'transformation.seed.compliance.title', 'transformation.seed.compliance.owner', 'transformation.seed.compliance.note', 'high', 67, 16],
  ['cyber', 'transformation.seed.cyber.title', 'transformation.seed.cyber.owner', 'transformation.seed.cyber.note', 'critical', 52, 12],
  ['field', 'transformation.seed.field.title', 'transformation.seed.field.owner', 'transformation.seed.field.note', 'medium', 38, 32],
  ['decisions', 'transformation.seed.decisions.title', 'transformation.seed.decisions.owner', 'transformation.seed.decisions.note', 'high', 61, 20],
];

function dateAfter(days) { const value = new Date(); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); }
function defaultState() { return { version: 1, records: seed.map(([phase, titleKey, ownerKey, noteKey, priority, score, days], index) => ({ id: `tr-seed-${index + 1}`, phase, titleKey, ownerKey, noteKey, priority, score, status: score >= 100 ? 'resolved' : score > 0 ? 'in_progress' : 'open', due: dateAfter(days), metric: Math.max(30, score - 4), evidenceKey: 'transformation.evidence_default', createdAt: new Date().toISOString() })), audit: [], lastSync: new Date().toISOString() }; }
function normalize(value) { const base = defaultState(); const source = value && typeof value === 'object' ? value : {}; return { ...base, ...source, records: Array.isArray(source.records) ? source.records : base.records, audit: Array.isArray(source.audit) ? source.audit : [] }; }
async function save(state, action, detail) { const next = normalize({ ...state, lastSync: new Date().toISOString(), audit: [{ id: uid('tr-audit'), at: new Date().toISOString(), actor: ACTOR, action, detail }, ...state.audit].slice(0, 300) }); await writePlatform(KEY, next); return next; }
export async function loadTransformation() { return normalize(await readPlatform(KEY, defaultState())); }
export async function addTransformation(state, data) { const record = { id: uid('tr'), phase: data.phase || 'executive', title: String(data.title || '').trim(), owner: String(data.owner || '').trim(), note: String(data.note || '').trim(), priority: data.priority || 'medium', score: Math.max(0, Math.min(100, Number(data.score || 0))), metric: Math.max(0, Math.min(100, Number(data.metric || data.score || 0))), status: 'open', due: data.due || today(), evidence: String(data.evidence || '').trim(), createdAt: new Date().toISOString() }; if (!record.title || !record.owner) throw new Error('required'); return save({ ...state, records: [record, ...state.records] }, 'initiative_created', record.title); }
export async function updateTransformation(state, id, patch) { return save({ ...state, records: state.records.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item) }, 'initiative_updated', id); }
export function summarize(state) { const active = state.records.filter(item => item.status !== 'resolved'); return { total: state.records.length, active: active.length, critical: active.filter(item => item.priority === 'critical').length, overdue: active.filter(item => item.due && item.due < today()).length, average: state.records.length ? Math.round(state.records.reduce((sum, item) => sum + Number(item.score || 0), 0) / state.records.length) : 0, done: state.records.filter(item => item.status === 'resolved').length }; }
export function exportTransformation(state) { const payload = { exportedAt: new Date().toISOString(), actor: ACTOR, purpose: 'institutional-transformation-evidence', ...state }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-donusum-kanit-${today()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
