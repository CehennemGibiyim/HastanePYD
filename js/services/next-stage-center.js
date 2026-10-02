// ===== SIRADAKİ AŞAMALAR: OPERASYON, GÜVENLİK VE UYUM SERVİSİ =====
import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'next_stage_center_v1';
const ACTOR = 'CehennemGibiyim';
export const AREAS = [
  { id: 'cyber', labelKey: 'next_stage.area.cyber' },
  { id: 'integration', labelKey: 'next_stage.area.integration' },
  { id: 'procurement', labelKey: 'next_stage.area.procurement' },
  { id: 'data', labelKey: 'next_stage.area.data' },
  { id: 'credentialing', labelKey: 'next_stage.area.credentialing' },
  { id: 'finance', labelKey: 'next_stage.area.finance' },
  { id: 'patient_comms', labelKey: 'next_stage.area.patient_comms' },
  { id: 'ai_governance', labelKey: 'next_stage.area.ai_governance' },
  { id: 'evidence', labelKey: 'next_stage.area.evidence' },
  { id: 'dependency', labelKey: 'next_stage.area.dependency' },
];
const seed = [
  { id: 'nst-c1', area: 'cyber', title: 'Kritik CVE yama kampanyası', owner: 'Bilgi Güvenliği', priority: 'critical', status: 'in_progress', due: '2026-10-18', score: 72, note: 'Tıbbi cihaz ve sunucu envanteriyle eşleştirilmiş 14 açık zafiyet izleniyor.', evidence: 'CVE listesi, EDR alarmı, kapatma kanıtı' },
  { id: 'nst-c2', area: 'cyber', title: 'Şüpheli dışa aktarma olayı müdahalesi', owner: 'SOC Ekibi', priority: 'high', status: 'open', due: '2026-10-16', score: 45, note: 'Olay zaman çizelgesi ve delil bütünlüğü kaydı tamamlanmalı.', evidence: 'Olay zaman çizelgesi, hash, bildirim' },
  { id: 'nst-i1', area: 'integration', title: 'HL7 sonuç mesajı sağlık skoru', owner: 'Entegrasyon Ekibi', priority: 'high', status: 'in_progress', due: '2026-10-21', score: 68, note: 'LIS ve PACS mesajlarında gecikme, hata ve yeniden işleme oranı ölçülüyor.', evidence: 'Mesaj kuyruğu, hata raporu, FHIR doğrulaması' },
  { id: 'nst-p1', area: 'procurement', title: 'Kritik tedarikçi yaşam döngüsü', owner: 'Satın Alma', priority: 'high', status: 'open', due: '2026-10-25', score: 51, note: 'Talep, teklif, güvenlik değerlendirmesi, sipariş ve fatura eşleştirmesi.', evidence: 'Sözleşme, SLA, teklif, performans' },
  { id: 'nst-d1', area: 'data', title: 'Onaylı KPI sözlüğü ve veri soyu', owner: 'Veri Yönetişimi', priority: 'high', status: 'in_progress', due: '2026-10-30', score: 64, note: 'Yönetim göstergeleri kaynak, formül, sahip ve güncelleme tarihiyle bağlanıyor.', evidence: 'KPI tanımı, kaynak tablo, kalite skoru' },
  { id: 'nst-q1', area: 'credentialing', title: 'Klinik görev imtiyazlarının nöbetle eşleşmesi', owner: 'Başhekimlik', priority: 'critical', status: 'open', due: '2026-10-22', score: 38, note: 'Sertifika ve yetki süresi geçersiz personelin kritik görevlere atanması önlenmeli.', evidence: 'Sertifika, eğitim, yetki kararı' },
  { id: 'nst-f1', area: 'finance', title: 'Birim ve işlem bazlı maliyet görünümü', owner: 'Mali İşler', priority: 'medium', status: 'open', due: '2026-11-05', score: 34, note: 'Fazla mesai, sarf, cihaz ve hasta başı maliyetler ortak KPI setine bağlanacak.', evidence: 'Bütçe, gerçekleşen, maliyet dağıtımı' },
  { id: 'nst-pc1', area: 'patient_comms', title: 'Hasta iletişim SLA ve başvuru numarası', owner: 'Hasta İletişim', priority: 'high', status: 'in_progress', due: '2026-10-19', score: 61, note: 'Telefon, web ve yüz yüze başvurular tek takip zincirinde birleştiriliyor.', evidence: 'Başvuru, yanıt, memnuniyet' },
  { id: 'nst-a1', area: 'ai_governance', title: 'Klinik karar destek modeli envanteri', owner: 'Klinik Bilişim', priority: 'high', status: 'open', due: '2026-11-12', score: 29, note: 'Model sürümü, insan onayı, veri kaynağı ve itiraz kaydı zorunlu tutulacak.', evidence: 'Model kartı, test, insan onayı' },
  { id: 'nst-e1', area: 'evidence', title: 'Denetim kanıt paketlerinin otomatik hazırlanması', owner: 'Kalite Yönetimi', priority: 'medium', status: 'in_progress', due: '2026-10-28', score: 57, note: 'Audit, eğitim, imza, KPI ve aksiyon kapanış kanıtları tek pakette toplanıyor.', evidence: 'Audit zinciri, imza, rapor' },
  { id: 'nst-x1', area: 'dependency', title: 'Kritik hizmet dijital bağımlılık haritası', owner: 'İş Sürekliliği', priority: 'critical', status: 'open', due: '2026-10-24', score: 43, note: 'Klinik hizmet, sistem, cihaz, personel ve tedarikçi etkisi eşleştirilecek.', evidence: 'CMDB, RTO/RPO, alternatif süreç' },
];
function defaults() { return { version: 1, lastSync: new Date().toISOString(), records: seed, audit: [] }; }
function normalize(value) { const base = defaults(); const source = value && typeof value === 'object' ? value : {}; return { ...base, ...source, records: Array.isArray(source.records) ? source.records : base.records, audit: Array.isArray(source.audit) ? source.audit : [] }; }
async function save(state, action, detail) { const next = normalize({ ...state, lastSync: new Date().toISOString(), audit: [{ id: uid('nst-audit'), at: new Date().toISOString(), actor: ACTOR, action, detail }, ...state.audit].slice(0, 300) }); await writePlatform(KEY, next); return next; }
export async function loadNextStage() { return normalize(await readPlatform(KEY, defaults())); }
export async function addNextRecord(state, data) { const record = { id: uid('nst'), area: data.area || 'cyber', title: String(data.title || '').trim(), owner: String(data.owner || 'Atanmadı').trim(), priority: data.priority || 'medium', status: 'open', due: data.due || today(), score: Math.max(0, Math.min(100, Number(data.score || 0))), note: String(data.note || '').trim(), evidence: String(data.evidence || '').trim(), createdAt: new Date().toISOString() }; if (!record.title) throw new Error('required'); return save({ ...state, records: [record, ...state.records] }, 'record_created', record.title); }
export async function updateNextRecord(state, id, patch) { return save({ ...state, records: state.records.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item) }, 'record_updated', id); }
export function summarize(state) { const open = state.records.filter(item => item.status !== 'resolved'); return { total: state.records.length, open: open.length, critical: open.filter(item => item.priority === 'critical').length, overdue: open.filter(item => item.due && item.due < today()).length, average: state.records.length ? Math.round(state.records.reduce((sum, item) => sum + Number(item.score || 0), 0) / state.records.length) : 0, completed: state.records.filter(item => item.status === 'resolved').length }; }
export function exportNextStage(state) { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), actor: ACTOR, purpose: 'next-stage-evidence', ...state }, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `kurumsal-operasyon-kanit-${today()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
