// ===== İLAÇ UZLAŞTIRMA VE FARMAKOVİJİLANS VERİ KATMANI =====
const STORAGE_KEY = 'medication_reconciliation_v1';
const risks = ['critical', 'high', 'medium'];
const statuses = ['pending', 'reviewed', 'action', 'closed'];
const issueTypes = ['reconciliation', 'adverse', 'interaction', 'dose', 'allergy'];

const seedRecords = () => [
  { id: 'med-2601', patient: 'Nermin Koç', fileNo: 'HST-25108', unit: 'Kardiyoloji', medication: 'Warfarin 5 mg', issueType: 'interaction', risk: 'critical', status: 'action', owner: 'Ecz. Selin Ak', due: '2026-09-28', action: 'INR sonucu ve yeni antibiyotik etkileşimi hekimle değerlendirilecek.', note: 'Evde kullandığı ilaç listesi ile yatış orderı arasında uyumsuzluk saptandı.', reportedAt: '2026-09-26' },
  { id: 'med-2602', patient: 'Hasan Yıldız', fileNo: 'HST-25077', unit: 'Dahiliye', medication: 'Metformin 1000 mg', issueType: 'reconciliation', risk: 'high', status: 'pending', owner: 'Ecz. Murat Kaya', due: '2026-09-27', action: 'Taburculuk ilaç listesi hasta ile doğrulanacak.', note: 'Böbrek fonksiyonlarına göre doz kontrolü bekliyor.', reportedAt: '2026-09-26' },
  { id: 'med-2603', patient: 'Sevgi Acar', fileNo: 'HST-25031', unit: 'Genel Cerrahi', medication: 'Opioid analjezik', issueType: 'adverse', risk: 'high', status: 'reviewed', owner: 'Dr. Emre Şen', due: '2026-09-29', action: 'Yan etki izlem formu ve alternatif analjezi planı oluşturulacak.', note: 'Bulantı ve baş dönmesi bildirildi; vital bulgular stabil.', reportedAt: '2026-09-25' },
  { id: 'med-2604', patient: 'İbrahim Tunç', fileNo: 'HST-24988', unit: 'Yoğun Bakım', medication: 'Heparin infüzyonu', issueType: 'dose', risk: 'critical', status: 'closed', owner: 'Ecz. Selin Ak', due: '2026-09-25', action: 'Doz protokolü güncellendi ve çift kontrol tamamlandı.', note: 'aPTT hedef aralığı dışında sonuç nedeniyle doz yeniden düzenlendi.', reportedAt: '2026-09-24' },
  { id: 'med-2605', patient: 'Gülcan Er', fileNo: 'HST-24952', unit: 'Acil Servis', medication: 'Penisilin grubu', issueType: 'allergy', risk: 'medium', status: 'pending', owner: 'Atanmadı', due: '2026-09-30', action: 'Alerji bilekliği ve elektronik kayıt doğrulanacak.', note: 'Hasta beyanı ile eski dosya kaydı arasında farklılık var.', reportedAt: '2026-09-26' }
];

function normalize(item, index = 0) {
  return {
    id: String(item?.id || `med-${Date.now()}-${index}`), patient: String(item?.patient || 'Adsız hasta'), fileNo: String(item?.fileNo || 'Belirtilmedi'), unit: String(item?.unit || 'Genel'), medication: String(item?.medication || 'Belirtilmedi'), issueType: issueTypes.includes(item?.issueType) ? item.issueType : 'reconciliation', risk: risks.includes(item?.risk) ? item.risk : 'medium', status: statuses.includes(item?.status) ? item.status : 'pending', owner: String(item?.owner || 'Atanmadı'), due: String(item?.due || new Date().toISOString().slice(0, 10)), action: String(item?.action || ''), note: String(item?.note || ''), reportedAt: String(item?.reportedAt || new Date().toISOString().slice(0, 10))
  };
}

export async function loadMedicationRecords() {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords();
    if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('[İlaç Uzlaştırma] veriler okunamadı', error);
    return seedRecords();
  }
}

export async function saveMedicationRecords(items) {
  const data = items.map(normalize);
  try {
    if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    throw new Error('İlaç kayıtları kaydedilemedi');
  }
}
