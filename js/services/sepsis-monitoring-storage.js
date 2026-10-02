// ===== ERKEN UYARI VE SEPSİS İZLEM VERİ KATMANI =====
const STORAGE_KEY = 'sepsis_monitoring_v1';
const risks = ['critical', 'high', 'medium', 'low'];
const statuses = ['monitoring', 'action', 'resolved'];
const dateFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seedRecords = () => [
  { id: 'ses-2601', patient: 'M.A.', patientNo: 'P-10482', unit: 'Acil Servis', score: 8, risk: 'critical', status: 'action', measuredAt: '18:42', nextCheck: dateFromNow(0), owner: 'Dr. Zeynep Arslan', trigger: 'Ateş 39.1°C · Nabız 124 · SKB 92', action: 'Sepsis protokolü, laktat ve kültür süreci başlatıldı', note: 'İlk saat hedefleri sorumlu hekim tarafından izleniyor.' },
  { id: 'ses-2602', patient: 'S.K.', patientNo: 'P-09817', unit: 'Dahiliye 2', score: 6, risk: 'high', status: 'monitoring', measuredAt: '18:15', nextCheck: dateFromNow(0), owner: 'Ayşe Demir', trigger: 'Solunum 25/dk · SpO₂ %91', action: '30 dakika içinde yeniden vital bulgu', note: 'Oksijen desteği sonrası trend aşağı yönlü.' },
  { id: 'ses-2603', patient: 'H.T.', patientNo: 'P-11106', unit: 'Yoğun Bakım', score: 11, risk: 'critical', status: 'action', measuredAt: '17:56', nextCheck: dateFromNow(-1), owner: 'Yoğun Bakım Ekibi', trigger: 'Bilinç değişikliği · Laktat 4.2 mmol/L', action: 'Yoğun bakım kıdemli değerlendirmesi bekleniyor', note: 'Geciken yeniden değerlendirme için sorumlu ekip uyarıldı.' },
  { id: 'ses-2604', patient: 'E.Y.', patientNo: 'P-10741', unit: 'Ortopedi', score: 3, risk: 'medium', status: 'monitoring', measuredAt: '16:30', nextCheck: dateFromNow(1), owner: 'Servis Hemşiresi', trigger: 'Ateş 38.0°C · Hafif taşikardi', action: '4 saatlik izlem planı', note: 'Klinik görünüm stabil.' },
  { id: 'ses-2605', patient: 'N.B.', patientNo: 'P-10229', unit: 'Kadın Doğum', score: 1, risk: 'low', status: 'resolved', measuredAt: '14:20', nextCheck: dateFromNow(2), owner: 'Dr. Selin Kaya', trigger: 'Geçici ateş yüksekliği', action: 'Rutin takip', note: 'Kontrol ölçümü normal sınırlarda.' }
];
function normalize(item, index = 0) {
  const score = Number(item?.score);
  return { id: String(item?.id || `ses-${Date.now()}-${index}`), patient: String(item?.patient || 'İsimsiz hasta'), patientNo: String(item?.patientNo || 'Belirtilmedi'), unit: String(item?.unit || 'Genel'), score: Number.isFinite(score) ? Math.min(20, Math.max(0, score)) : 0, risk: risks.includes(item?.risk) ? item.risk : 'medium', status: statuses.includes(item?.status) ? item.status : 'monitoring', measuredAt: String(item?.measuredAt || '--:--'), nextCheck: String(item?.nextCheck || dateFromNow(1)), owner: String(item?.owner || 'Atanmadı'), trigger: String(item?.trigger || ''), action: String(item?.action || ''), note: String(item?.note || '') };
}
export async function loadSepsisRecords() {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords();
    if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) { console.warn('[Erken Uyarı] veriler okunamadı', error); return seedRecords(); }
}
export async function saveSepsisRecords(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Erken uyarı kayıtları kaydedilemedi'); }
}
