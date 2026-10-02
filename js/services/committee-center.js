// ===== KOMİTE KARAR VE AKSİYON VERİ KATMANI =====
import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'committee_center_v1';
const ACTOR = 'CehennemGibiyim';

export const COMMITTEES = [
  { id: 'infection', nameKey: 'committee_center.committees.infection', chairKey: 'committee_center.chairs.quality', frequencyKey: 'committee_center.frequency.monthly', members: 8 },
  { id: 'safety', nameKey: 'committee_center.committees.safety', chairKey: 'committee_center.chairs.deputy', frequencyKey: 'committee_center.frequency.monthly', members: 10 },
  { id: 'quality', nameKey: 'committee_center.committees.quality', chairKey: 'committee_center.chairs.manager', frequencyKey: 'committee_center.frequency.biweekly', members: 6 },
  { id: 'medication', nameKey: 'committee_center.committees.medication', chairKey: 'committee_center.chairs.pharmacy', frequencyKey: 'committee_center.frequency.monthly', members: 7 },
  { id: 'education', nameKey: 'committee_center.committees.education', chairKey: 'committee_center.chairs.education', frequencyKey: 'committee_center.frequency.monthly', members: 5 },
  { id: 'accreditation', nameKey: 'committee_center.committees.accreditation', chairKey: 'committee_center.chairs.deputy', frequencyKey: 'committee_center.frequency.weekly', members: 12 },
];

const seedActions = [
  ['safety', 'committee_center.seed.identity_title', 'committee_center.seed.quality_owner', 78, 'high', 5],
  ['quality', 'committee_center.seed.audit_title', 'committee_center.seed.quality_owner', 54, 'critical', -3],
  ['infection', 'committee_center.seed.hand_hygiene_title', 'committee_center.seed.infection_owner', 92, 'medium', 12],
  ['accreditation', 'committee_center.seed.evidence_title', 'committee_center.seed.accreditation_owner', 36, 'high', 18],
];

const dateAfter = days => { const value = new Date(); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); };
const defaultState = () => ({ version: 1, actions: seedActions.map(([committee, titleKey, ownerKey, progress, priority, dueOffset], index) => ({ id: `committee-seed-${index + 1}`, committee, titleKey, ownerKey, progress, priority, status: progress >= 100 ? 'resolved' : progress ? 'in_progress' : 'open', due: dateAfter(dueOffset), noteKey: 'committee_center.seed.default_note', createdAt: new Date().toISOString() })), audit: [] });
const normalize = value => { const base = defaultState(); const source = value && typeof value === 'object' ? value : {}; return { ...base, ...source, actions: Array.isArray(source.actions) ? source.actions : base.actions, audit: Array.isArray(source.audit) ? source.audit : [] }; };
async function save(state, action, detail) { const next = normalize({ ...state, audit: [{ id: uid('committee-audit'), at: new Date().toISOString(), actor: ACTOR, action, detail }, ...state.audit].slice(0, 200) }); await writePlatform(KEY, next); return next; }
export async function loadCommitteeCenter() { return normalize(await readPlatform(KEY, defaultState())); }
export async function addCommitteeAction(state, data) { const record = { id: uid('committee-action'), committee: data.committee || COMMITTEES[0].id, title: String(data.title || '').trim(), owner: String(data.owner || '').trim(), note: String(data.note || '').trim(), priority: data.priority || 'medium', progress: 0, status: 'open', due: data.due || today(), createdAt: new Date().toISOString() }; if (!record.title || !record.owner) throw new Error('required'); return save({ ...state, actions: [record, ...state.actions] }, 'action_created', record.title); }
export async function updateCommitteeAction(state, id, patch) { return save({ ...state, actions: state.actions.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item) }, 'action_updated', id); }
export function summarizeCommittee(state) { const active = state.actions.filter(item => item.status !== 'resolved'); return { total: state.actions.length, active: active.length, overdue: active.filter(item => item.due && item.due < today()).length, critical: active.filter(item => item.priority === 'critical').length, resolved: state.actions.filter(item => item.status === 'resolved').length }; }
export function exportCommitteeEvidence(state) { const payload = { exportedAt: new Date().toISOString(), actor: ACTOR, purpose: 'committee-decision-and-action-evidence', ...state }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `komite-karar-kanit-${today()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
