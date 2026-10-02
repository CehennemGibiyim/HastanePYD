const STORAGE_KEY = 'clinical_risk_center_v1';
let cache = null;

const seed = () => {
  const now = Date.now();
  return [
    { id: 'RISK-1001', patient: 'Osman Bey', room: '101-A', department: 'Dahiliye', updatedAt: now - 2 * 3600000, morseScore: 65, bradenScore: 11, owner: 'Hemşire Ayşe', fallPlan: '1:1 gözlem ve düşük yatak', skinPlan: 'İki saatte bir pozisyon değişimi', reviewed: false },
    { id: 'RISK-1002', patient: 'Ayşe Kaya', room: '205-B', department: 'Kardiyoloji', updatedAt: now - 5 * 3600000, morseScore: 20, bradenScore: 21, owner: 'Hemşire Fatma', fallPlan: 'Çağrı zili erişimde', skinPlan: 'Standart cilt izlemi', reviewed: true },
    { id: 'RISK-1003', patient: 'Mehmet Öz', room: '310-A', department: 'Ortopedi', updatedAt: now - 26 * 3600000, morseScore: 50, bradenScore: 14, owner: 'Hemşire Zeynep', fallPlan: 'Gece turu ve kaymaz terlik', skinPlan: 'Üç saatte bir pozisyon değişimi', reviewed: false },
    { id: 'RISK-1004', patient: 'Sema Yıldız', room: 'A-12', department: 'Yoğun Bakım', updatedAt: now - 31 * 3600000, morseScore: 80, bradenScore: 9, owner: 'Yoğun Bakım Ekibi', fallPlan: 'Yatak alarmı ve refakatçi', skinPlan: 'Basınç azaltıcı yatak', reviewed: false },
    { id: 'RISK-1005', patient: 'Kemal Arslan', room: '204-C', department: 'Genel Cerrahi', updatedAt: now - 8 * 3600000, morseScore: 35, bradenScore: 18, owner: 'Hemşire Elif', fallPlan: 'Mobilizasyon desteği', skinPlan: 'Her üç saatte cilt kontrolü', reviewed: true }
  ];
};

const levelForFall = (score) => score >= 51 ? 'high' : score >= 25 ? 'moderate' : 'low';
const levelForSkin = (score) => score <= 12 ? 'high' : score <= 18 ? 'moderate' : 'low';

function normalize(raw) {
  const source = Array.isArray(raw) ? raw : seed();
  return source.map((item, index) => {
    const morseScore = Math.max(0, Math.min(125, Number(item?.morseScore) || 0));
    const bradenScore = Math.max(6, Math.min(23, Number(item?.bradenScore) || 6));
    return {
      id: String(item?.id || `RISK-${Date.now()}-${index}`),
      patient: String(item?.patient || 'İsimsiz hasta'),
      room: String(item?.room || 'Belirtilmedi'),
      department: String(item?.department || 'Genel'),
      updatedAt: Number(item?.updatedAt) || Date.now(),
      morseScore,
      bradenScore,
      owner: String(item?.owner || 'Atanmadı'),
      fallPlan: String(item?.fallPlan || 'Plan belirtilmedi'),
      skinPlan: String(item?.skinPlan || 'Plan belirtilmedi'),
      reviewed: Boolean(item?.reviewed)
    };
  });
}

export async function loadClinicalRiskData() {
  if (cache) return structuredClone(cache);
  const fallback = seed();
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    cache = normalize(raw ? JSON.parse(raw) : fallback);
  } catch (error) {
    console.warn('[Hastane PYS] Klinik risk kayıtları okunamadı', error);
    cache = normalize(fallback);
  }
  try { if (window.miniappsAI?.storage) await persist(cache); } catch (error) { console.warn('[Hastane PYS] Klinik risk ilk kaydı saklanamadı', error); }
  return structuredClone(cache);
}

async function persist(data) {
  await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function saveClinicalRiskData(data) {
  cache = normalize(data);
  if (window.miniappsAI?.storage) await persist(cache);
  return structuredClone(cache);
}

export { levelForFall, levelForSkin };
