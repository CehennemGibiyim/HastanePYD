// ===== HASTA TABURCULUK VE GÜVENLİ GEÇİŞ VERİ KATMANI =====
const STORAGE_KEY = 'discharge_safety_v1';
const statuses = ['preparing', 'education', 'ready', 'discharged', 'cancelled'];
const risks = ['critical', 'high', 'medium', 'low'];

const shiftDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const seed = [
  { id: 'dsc-1', patient: 'A. Y.', patientNo: 'HST-20481', unit: 'Dahiliye Servisi', destination: 'home', owner: 'Hemşirelik ve sosyal hizmet', risk: 'high', date: shiftDate(0), status: 'education', reason: 'Kalp yetmezliği sonrası izlem', issue: 'Evde ilaç saatleri tekrar anlatılmalı', note: 'Yakını eğitim görüşmesine katıldı.', checks: { identity: true, medication: false, education: false, appointment: true, transport: true } },
  { id: 'dsc-2', patient: 'M. K.', patientNo: 'HST-19326', unit: 'Ortopedi Servisi', destination: 'home', owner: 'Ortopedi ekibi', risk: 'medium', date: shiftDate(1), status: 'preparing', reason: 'Diz protezi ameliyatı', issue: 'Fizik tedavi randevusu bekleniyor', note: 'Yürüteç teslimi planlandı.', checks: { identity: true, medication: true, education: false, appointment: false, transport: true } },
  { id: 'dsc-3', patient: 'S. T.', patientNo: 'HST-18704', unit: 'Yoğun Bakım', destination: 'Evde bakım', owner: 'Yoğun bakım ve palyatif ekip', risk: 'critical', date: shiftDate(-1), status: 'ready', reason: 'Uzun süreli bakım planı', issue: 'Evde oksijen teyidi bekleniyor', note: 'Aileye acil başvuru belirtileri aktarıldı.', checks: { identity: true, medication: true, education: true, appointment: true, transport: false } },
  { id: 'dsc-4', patient: 'N. E.', patientNo: 'HST-17652', unit: 'Kadın Doğum', destination: 'home', owner: 'Kadın doğum hemşiresi', risk: 'low', date: shiftDate(-2), status: 'discharged', reason: 'Doğum sonrası takip', issue: '', note: 'Kontrol tarihi ve emzirme eğitimi tamamlandı.', checks: { identity: true, medication: true, education: true, appointment: true, transport: true } },
];

const normalize = (item, index) => ({
  id: item?.id || `dsc-${Date.now()}-${index}`,
  patient: String(item?.patient || ''), patientNo: String(item?.patientNo || ''), unit: String(item?.unit || ''),
  destination: String(item?.destination || ''), owner: String(item?.owner || ''), risk: risks.includes(item?.risk) ? item.risk : 'medium',
  date: String(item?.date || shiftDate(0)), status: statuses.includes(item?.status) ? item.status : 'preparing',
  reason: String(item?.reason || ''), issue: String(item?.issue || ''), note: String(item?.note || ''),
  checks: { identity: Boolean(item?.checks?.identity), medication: Boolean(item?.checks?.medication), education: Boolean(item?.checks?.education), appointment: Boolean(item?.checks?.appointment), transport: Boolean(item?.checks?.transport) },
});

export async function loadDischargeRecords() {
  try {
    const raw = await window.miniappsAI.storage.getItem(STORAGE_KEY);
    if (!raw) return seed.map(normalize);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalize) : seed.map(normalize);
  } catch (error) {
    console.warn('[Taburculuk] Kayıtlar okunamadı', error);
    return seed.map(normalize);
  }
}

export async function saveDischargeRecords(records) {
  const safe = Array.isArray(records) ? records.map(normalize) : [];
  await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}
