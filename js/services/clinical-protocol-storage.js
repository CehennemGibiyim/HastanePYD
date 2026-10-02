// ===== KLİNİK PROTOKOL UYUM VERİ KATMANI =====
const STORAGE_KEY = 'clinical_protocol_compliance_v1';
const risks = ['critical', 'high', 'medium', 'low'];
const statuses = ['active', 'action', 'review', 'archived'];
const dateFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seedRecords = () => [
  { id: 'prt-2601', title: 'Sepsis erken tanı ve yönetim protokolü', code: 'SKS-HST-04', category: 'Hasta güvenliği', unit: 'Acil Servis', owner: 'Dr. Zeynep Arslan', risk: 'critical', status: 'action', nextReview: dateFromNow(-5), compliance: 68, note: 'İlk saat antibiyotik ve laktat kayıtlarında eksikler var.', action: 'Acil servis kayıt örneklemi ve ekip geri bildirimi' },
  { id: 'prt-2602', title: 'Cerrahi güvenlik kontrol listesi', code: 'JCI-IPSG-04', category: 'Cerrahi süreç', unit: 'Ameliyathane', owner: 'Ayşe Demir', risk: 'high', status: 'review', nextReview: dateFromNow(8), compliance: 84, note: 'Sign-in / time-out uyumu aylık örneklemle doğrulanıyor.', action: 'Yeni örneklem turunu tamamla' },
  { id: 'prt-2603', title: 'El hijyeni beş endikasyon uygulaması', code: 'SKS-ENF-12', category: 'Enfeksiyon kontrolü', unit: 'Tüm klinikler', owner: 'Enfeksiyon Kontrol Komitesi', risk: 'high', status: 'active', nextReview: dateFromNow(24), compliance: 93, note: 'Gözlem sonuçları hedefin üzerinde.', action: 'Aylık gözlemleri sürdür' },
  { id: 'prt-2604', title: 'Yüksek riskli ilaçların çift kontrolü', code: 'JCI-MMU-07', category: 'İlaç güvenliği', unit: 'Yoğun Bakım', owner: 'Eczane Sorumlusu', risk: 'critical', status: 'action', nextReview: dateFromNow(-2), compliance: 74, note: 'İki vardiyada ikinci imza kaydı eksik bulundu.', action: 'Vardiya tesliminde çift kontrol hatırlatıcısı' },
  { id: 'prt-2605', title: 'Hasta kimlik doğrulama protokolü', code: 'SKS-HST-01', category: 'Hasta güvenliği', unit: 'Dahiliye', owner: 'Kalite Birimi', risk: 'medium', status: 'active', nextReview: dateFromNow(41), compliance: 97, note: 'Son denetimde uygunsuzluk saptanmadı.', action: 'Periyodik izleme' }
];
function normalize(item, index = 0) {
  const value = Number(item?.compliance);
  return { id: String(item?.id || `prt-${Date.now()}-${index}`), title: String(item?.title || 'Adsız protokol'), code: String(item?.code || 'Belirtilmedi'), category: String(item?.category || 'Genel'), unit: String(item?.unit || 'Tüm klinikler'), owner: String(item?.owner || 'Atanmadı'), risk: risks.includes(item?.risk) ? item.risk : 'medium', status: statuses.includes(item?.status) ? item.status : 'active', nextReview: String(item?.nextReview || dateFromNow(30)), compliance: Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0, note: String(item?.note || ''), action: String(item?.action || '') };
}
export async function loadClinicalProtocols() {
  try { const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : null; const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords(); if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { console.warn('[Protokol Uyum] veriler okunamadı', error); return seedRecords(); }
}
export async function saveClinicalProtocols(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Protokol kayıtları kaydedilemedi'); }
}