// ===== PAZAR KARŞILAŞTIRMASI VE HASTANE KONTROL KULESİ VERİ SERVİSİ =====
import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'market_command_center';
const ACTOR = 'CehennemGibiyim';

export const WORKSTREAMS = [
  { id: 'identity', labelKey: 'market_center.stream.identity', noteKey: 'market_center.stream.identity_note', tone: 'cyan' },
  { id: 'itsm', labelKey: 'market_center.stream.itsm', noteKey: 'market_center.stream.itsm_note', tone: 'blue' },
  { id: 'cyber', labelKey: 'market_center.stream.cyber', noteKey: 'market_center.stream.cyber_note', tone: 'red' },
  { id: 'integration', labelKey: 'market_center.stream.integration', noteKey: 'market_center.stream.integration_note', tone: 'violet' },
  { id: 'procurement', labelKey: 'market_center.stream.procurement', noteKey: 'market_center.stream.procurement_note', tone: 'amber' },
  { id: 'data', labelKey: 'market_center.stream.data', noteKey: 'market_center.stream.data_note', tone: 'teal' },
  { id: 'credentialing', labelKey: 'market_center.stream.credentialing', noteKey: 'market_center.stream.credentialing_note', tone: 'emerald' },
  { id: 'finance', labelKey: 'market_center.stream.finance', noteKey: 'market_center.stream.finance_note', tone: 'orange' },
  { id: 'patient_comms', labelKey: 'market_center.stream.patient_comms', noteKey: 'market_center.stream.patient_comms_note', tone: 'pink' },
  { id: 'ai_governance', labelKey: 'market_center.stream.ai_governance', noteKey: 'market_center.stream.ai_governance_note', tone: 'indigo' },
  { id: 'evidence', labelKey: 'market_center.stream.evidence', noteKey: 'market_center.stream.evidence_note', tone: 'lime' },
  { id: 'dependency', labelKey: 'market_center.stream.dependency', noteKey: 'market_center.stream.dependency_note', tone: 'slate' },
];

const seedRecords = [
  ['identity', 'MFA ve kritik işlem yeniden doğrulaması', 'Kimlik ekibi', 'critical', 'in_progress', 72, '2026-10-15'],
  ['itsm', 'CMDB kritik hizmet bağımlılıklarının tamamlanması', 'BT Operasyon', 'high', 'open', 48, '2026-10-22'],
  ['cyber', 'Tıbbi cihaz güvenlik açığı ve yama kampanyası', 'Siber Güvenlik', 'critical', 'in_progress', 61, '2026-10-10'],
  ['integration', 'HL7/FHIR entegrasyon sağlık skoru', 'Entegrasyon Ekibi', 'high', 'resolved', 86, '2026-09-30'],
  ['procurement', 'Kritik tedarikçi sözleşme ve SLA yenilemeleri', 'Satın Alma', 'high', 'open', 54, '2026-10-18'],
  ['data', 'Onaylı KPI sözlüğü ve veri soy kütüğü', 'Veri Yönetişimi', 'high', 'in_progress', 68, '2026-10-25'],
  ['credentialing', 'Klinik görev imtiyazlarının yetkinlik matrisiyle eşleştirilmesi', 'Başhekimlik', 'critical', 'open', 39, '2026-10-30'],
  ['finance', 'Birim bazlı maliyet ve fazla mesai görünümü', 'Mali Hizmetler', 'medium', 'in_progress', 57, '2026-11-05'],
  ['patient_comms', 'Hasta iletişim başvurusu SLA ve tekil kayıt akışı', 'Hasta Hakları', 'medium', 'open', 43, '2026-11-12'],
  ['ai_governance', 'Klinik yapay zekâ kullanım envanteri ve insan onayı', 'Dijital Sağlık', 'high', 'open', 31, '2026-11-20'],
  ['evidence', 'Denetim kanıt paketlerinin otomatik toplanması', 'Kalite Yönetimi', 'high', 'in_progress', 64, '2026-10-28'],
  ['dependency', 'Dijital ikiz ve hizmet bağımlılık haritası', 'Hastane Komuta', 'medium', 'open', 27, '2026-11-30'],
];

function defaultState() {
  return { version: 1, lastSync: new Date().toISOString(), records: seedRecords.map(([stream, title, owner, priority, status, progress, due], index) => ({ id: `market_seed_${index + 1}`, stream, title, owner, priority, status, progress, due, note: '', actor: ACTOR, createdAt: new Date().toISOString() })), audit: [] };
}
function normalize(value) { const source = value && typeof value === 'object' ? value : {}; return { ...defaultState(), ...source, records: Array.isArray(source.records) && source.records.length ? source.records : defaultState().records, audit: Array.isArray(source.audit) ? source.audit : [] }; }
async function save(state, action, detail) { const next = normalize({ ...state, lastSync: new Date().toISOString(), audit: [{ id: uid('market_audit'), at: new Date().toISOString(), actor: ACTOR, action, detail }, ...state.audit].slice(0, 300) }); await writePlatform(KEY, next); return next; }

export async function loadMarketCenter() { return normalize(await readPlatform(KEY, defaultState())); }
export async function updateMarketRecord(state, id, patch) { const records = state.records.map(record => record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record); return save({ ...state, records }, 'record_updated', id); }
export async function addMarketRecord(state, data) { const record = { id: uid('market'), stream: data.stream, title: String(data.title || '').trim(), owner: String(data.owner || '').trim(), priority: data.priority || 'medium', status: 'open', progress: Math.max(0, Math.min(100, Number(data.progress) || 0)), due: data.due || today(), note: String(data.note || '').trim(), actor: ACTOR, createdAt: new Date().toISOString() }; if (!record.title || !record.owner) throw new Error('required'); return save({ ...state, records: [record, ...state.records] }, 'record_created', record.title); }
export function summarize(state) { const records = Array.isArray(state.records) ? state.records : []; const open = records.filter(item => item.status !== 'resolved'); const overdue = open.filter(item => item.due && item.due < today()); const critical = open.filter(item => item.priority === 'critical'); const average = records.length ? Math.round(records.reduce((sum, item) => sum + Number(item.progress || 0), 0) / records.length) : 0; return { total: records.length, open: open.length, overdue: overdue.length, critical: critical.length, average, streams: new Set(records.map(item => item.stream)).size }; }
export function exportMarketCenter(state) { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), actor: ACTOR, ...state }, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-kontrol-kulesi-${today()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
