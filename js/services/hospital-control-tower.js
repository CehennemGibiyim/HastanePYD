// ===== HASTANE OPERASYON KONTROL KULESİ VERİ SERVİSİ =====
import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'hospital_control_tower_v1';
const ACTOR = 'CehennemGibiyim';
export const STREAMS = [
  { id: 'operations', labelKey: 'control_tower.stream.operations' },
  { id: 'alerts', labelKey: 'control_tower.stream.alerts' },
  { id: 'integration', labelKey: 'control_tower.stream.integration' },
  { id: 'data', labelKey: 'control_tower.stream.data' },
  { id: 'devices', labelKey: 'control_tower.stream.devices' },
  { id: 'workforce', labelKey: 'control_tower.stream.workforce' },
  { id: 'finance', labelKey: 'control_tower.stream.finance' },
  { id: 'evidence', labelKey: 'control_tower.stream.evidence' },
  { id: 'continuity', labelKey: 'control_tower.stream.continuity' },
  { id: 'decisions', labelKey: 'control_tower.stream.decisions' },
];
const seed = [
  { id: 'tower-op-1', stream: 'operations', title: 'Acil servis bekleme süresi', owner: 'Acil Servis', status: 'watch', priority: 'high', due: '2026-10-15', metric: '%82', note: 'Triyaj sonrası ortalama bekleme hedefin üzerinde.' },
  { id: 'tower-op-2', stream: 'operations', title: 'Yoğun bakım doluluk oranı', owner: 'Yoğun Bakım', status: 'open', priority: 'critical', due: '2026-10-14', metric: '%94', note: 'Yatak kapasitesi ve sevk planı birlikte izleniyor.' },
  { id: 'tower-al-1', stream: 'alerts', title: 'Kritik laboratuvar sonucu bildirimi', owner: 'Klinik Komuta', status: 'open', priority: 'critical', due: '2026-10-13', metric: '3', note: 'Okunmamış kritik sonuç için sorumlu klinisyen teyidi bekleniyor.' },
  { id: 'tower-al-2', stream: 'alerts', title: 'SLA eskalasyonu bekleyen kayıt', owner: 'Hasta İletişim', status: 'watch', priority: 'high', due: '2026-10-16', metric: '7', note: 'Yanıt süresi yaklaşan başvurular üst sorumluya bildirilecek.' },
  { id: 'tower-in-1', stream: 'integration', title: 'HL7/FHIR mesaj kuyruğu', owner: 'Entegrasyon Ekibi', status: 'watch', priority: 'high', due: '2026-10-17', metric: '%97.4', note: 'Başarısız mesajlar yeniden işleme kuyruğuna alındı.' },
  { id: 'tower-da-1', stream: 'data', title: 'Mükerrer hasta adayı', owner: 'Veri Kalitesi', status: 'open', priority: 'critical', due: '2026-10-14', metric: '12', note: 'Kimlik eşleştirme onayı olmadan kayıt birleştirilmemeli.' },
  { id: 'tower-de-1', stream: 'devices', title: 'Kalibrasyonu yaklaşan kritik cihazlar', owner: 'Biyomedikal', status: 'watch', priority: 'high', due: '2026-10-20', metric: '5', note: 'Kalibrasyon, bakım ve yedek cihaz planı aynı kayda bağlandı.' },
  { id: 'tower-de-2', stream: 'devices', title: 'Soğuk zincir sıcaklık alarmı', owner: 'Eczane', status: 'resolved', priority: 'critical', due: '2026-10-10', metric: '0', note: 'Alarm kaydı incelendi ve stok mutabakatı tamamlandı.' },
  { id: 'tower-wo-1', stream: 'workforce', title: 'Yetkinliksiz kritik görev ataması', owner: 'Başhekimlik', status: 'open', priority: 'critical', due: '2026-10-15', metric: '2', note: 'Vardiya yayımlanmadan önce sertifika ve yetki kontrolü yapılmalı.' },
  { id: 'tower-fi-1', stream: 'finance', title: 'Bütçe-gerçekleşen sapması', owner: 'Mali İşler', status: 'watch', priority: 'high', due: '2026-10-31', metric: '%8.6', note: 'Sarf ve fazla mesai maliyetleri birim bazında inceleniyor.' },
  { id: 'tower-ev-1', stream: 'evidence', title: 'Akreditasyon kanıt paketi', owner: 'Kalite Yönetimi', status: 'in_progress', priority: 'high', due: '2026-10-28', metric: '%71', note: 'Eksik kanıtlar sorumlulara otomatik görev olarak açıldı.' },
  { id: 'tower-co-1', stream: 'continuity', title: 'Kritik hizmet RTO/RPO doğrulaması', owner: 'İş Sürekliliği', status: 'open', priority: 'critical', due: '2026-10-22', metric: '4', note: 'Alternatif manuel süreçler ve son tatbikat sonuçları karşılaştırılıyor.' },
  { id: 'tower-co-2', stream: 'continuity', title: 'Tedarikçi kesintisi senaryosu', owner: 'Tedarik Zinciri', status: 'watch', priority: 'medium', due: '2026-11-05', metric: '%48', note: 'Tek kaynağa bağlı kritik ürünler için yedek tedarikçi aranıyor.' },
  { id: 'tower-di-1', stream: 'decisions', title: 'Komite kararlarının kapanış oranı', owner: 'Yönetim Kurulu', status: 'watch', priority: 'high', due: '2026-10-19', metric: '%76', note: 'Geciken kararlar sorumlu ve kanıt bağlantısıyla takip ediliyor.' },
];
function defaults() { return { version: 1, lastSync: new Date().toISOString(), records: seed, audit: [] }; }
function normalize(value) { const base = defaults(); const source = value && typeof value === 'object' ? value : {}; return { ...base, ...source, records: Array.isArray(source.records) ? source.records : base.records, audit: Array.isArray(source.audit) ? source.audit : [] }; }
async function save(state, action, detail) { const next = normalize({ ...state, lastSync: new Date().toISOString(), audit: [{ id: uid('tower-audit'), at: new Date().toISOString(), actor: ACTOR, action, detail }, ...state.audit].slice(0, 300) }); await writePlatform(KEY, next); return next; }
export async function loadControlTower() { return normalize(await readPlatform(KEY, defaults())); }
export async function addTowerRecord(state, data) { const record = { id: uid('tower'), stream: data.stream || 'operations', title: String(data.title || '').trim(), owner: String(data.owner || 'Atanmadı').trim(), status: 'open', priority: data.priority || 'medium', due: data.due || today(), metric: String(data.metric || '—').trim(), note: String(data.note || '').trim(), createdAt: new Date().toISOString() }; if (!record.title) throw new Error('required'); return save({ ...state, records: [record, ...state.records] }, 'record_created', record.title); }
export async function updateTowerRecord(state, id, patch) { return save({ ...state, records: state.records.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item) }, 'record_updated', id); }
export function summarize(state) { const active = state.records.filter(item => item.status !== 'resolved'); return { total: state.records.length, active: active.length, critical: active.filter(item => item.priority === 'critical').length, overdue: active.filter(item => item.due && item.due < today()).length, resolved: state.records.length - active.length, health: state.records.length ? Math.round(state.records.reduce((sum, item) => sum + (item.status === 'resolved' ? 100 : item.status === 'watch' ? 72 : item.status === 'in_progress' ? 58 : 35), 0) / state.records.length) : 0 }; }
export function streamSummary(state, stream) { const records = state.records.filter(item => item.stream === stream); const active = records.filter(item => item.status !== 'resolved'); return { total: records.length, active: active.length, critical: active.filter(item => item.priority === 'critical').length, health: records.length ? Math.round(records.reduce((sum, item) => sum + (item.status === 'resolved' ? 100 : item.status === 'watch' ? 72 : item.status === 'in_progress' ? 58 : 35), 0) / records.length) : 0 }; }
export function exportControlTower(state) { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), actor: ACTOR, purpose: 'hospital-control-tower-evidence', ...state }, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-kontrol-kulesi-${today()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
