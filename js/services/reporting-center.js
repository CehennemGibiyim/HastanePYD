// ===== KURUMSAL RAPORLAMA VE DENETİM KANIT VERİ KATMANI =====
import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'reporting_center_v1';
const ACTOR = 'CehennemGibiyim';
export const REPORT_TYPES = [
  { id: 'executive', labelKey: 'reporting_center.types.executive' },
  { id: 'compliance', labelKey: 'reporting_center.types.compliance' },
  { id: 'operations', labelKey: 'reporting_center.types.operations' },
  { id: 'finance', labelKey: 'reporting_center.types.finance' },
];
const seedReports = [
  { id: 'report-seed-1', titleKey: 'reporting_center.seed.morning_title', summaryKey: 'reporting_center.seed.morning_summary', type: 'executive', period: 'Son 24 saat', scope: 'Hastane geneli', status: 'published', createdAt: new Date(Date.now() - 86400000).toISOString(), snapshot: { activePersonnel: 86, shiftsToday: 24, openAlerts: 3, activeActions: 11, overdueActions: 2, departments: 9 } },
  { id: 'report-seed-2', titleKey: 'reporting_center.seed.audit_title', summaryKey: 'reporting_center.seed.audit_summary', type: 'compliance', period: '2026 / 3. çeyrek', scope: 'Kalite ve uyum', status: 'draft', createdAt: new Date(Date.now() - 172800000).toISOString(), snapshot: { activePersonnel: 86, shiftsToday: 24, openAlerts: 3, activeActions: 11, overdueActions: 2, departments: 9 } },
];
const defaultState = () => ({ version: 1, reports: seedReports, audit: [] });
const normalize = value => { const base = defaultState(); const source = value && typeof value === 'object' ? value : {}; return { ...base, ...source, reports: Array.isArray(source.reports) ? source.reports : base.reports, audit: Array.isArray(source.audit) ? source.audit : [] }; };
async function save(state, action, detail) { const next = normalize({ ...state, audit: [{ id: uid('report-audit'), at: new Date().toISOString(), actor: ACTOR, action, detail }, ...state.audit].slice(0, 200) }); await writePlatform(KEY, next); return next; }
export async function loadReportingCenter() { return normalize(await readPlatform(KEY, defaultState())); }
export async function createReport(state, data) { const record = { id: uid('report'), title: String(data.title || '').trim(), summary: String(data.summary || '').trim(), type: data.type || 'executive', period: String(data.period || '').trim(), scope: String(data.scope || '').trim(), status: 'draft', createdAt: new Date().toISOString(), snapshot: data.snapshot || {} }; if (!record.title || !record.period || !record.scope) throw new Error('required'); return save({ ...state, reports: [record, ...state.reports] }, 'report_created', record.title); }
export async function updateReport(state, id, patch) { const item = state.reports.find(report => report.id === id); if (!item) throw new Error('missing'); return save({ ...state, reports: state.reports.map(report => report.id === id ? { ...report, ...patch, updatedAt: new Date().toISOString() } : report) }, patch.status === 'published' ? 'report_published' : 'report_updated', item.title || item.id); }
export function summarizeReports(state) { return { total: state.reports.length, drafts: state.reports.filter(item => item.status === 'draft').length, published: state.reports.filter(item => item.status === 'published').length, evidence: state.audit.filter(item => item.action === 'evidence_exported').length }; }
export function exportReportEvidence(report, state) { const payload = { exportedAt: new Date().toISOString(), actor: ACTOR, purpose: 'hospital-reporting-and-audit-evidence', report, audit: state.audit.filter(item => item.detail === report.title || item.detail === report.id) }; download(JSON.stringify(payload, null, 2), `rapor-kanit-${today()}.json`, 'application/json'); }
export function exportAllReports(state) { const payload = { exportedAt: new Date().toISOString(), actor: ACTOR, purpose: 'hospital-reporting-register', reports: state.reports, audit: state.audit }; download(JSON.stringify(payload, null, 2), `rapor-kaydi-${today()}.json`, 'application/json'); }
function download(content, filename, type) { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
