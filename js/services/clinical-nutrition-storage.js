// ===== KLİNİK BESLENME VERİ KATMANI =====
const STORAGE_KEY = 'clinical_nutrition_center_v1';
const riskLevels = ['high', 'medium', 'low'];
const dietTypes = ['standard', 'diabetic', 'low-salt', 'soft', 'liquid', 'tube'];
const mealStatuses = ['planned', 'served', 'declined'];

const seedRecords = () => [
  { id: 'nut-2601', patient: 'Ayşe Yılmaz', fileNo: 'HST-24810', unit: 'Dahiliye', diet: 'diabetic', risk: 'high', calories: 1600, mealStatus: 'planned', allergy: 'Fındık', dietitian: 'Dyt. Elif Kaya', assessedAt: '2026-09-26', note: 'İştah azlığı ve son bir haftada kilo kaybı bildirildi.' },
  { id: 'nut-2602', patient: 'Mehmet Kaya', fileNo: 'HST-24792', unit: 'Ortopedi', diet: 'standard', risk: 'low', calories: 2200, mealStatus: 'served', allergy: 'Yok', dietitian: 'Dyt. Elif Kaya', assessedAt: '2026-09-26', note: 'Beslenme durumu stabil, taburculuk eğitimi planlandı.' },
  { id: 'nut-2603', patient: 'Fatma Demir', fileNo: 'HST-24761', unit: 'Yoğun Bakım', diet: 'tube', risk: 'high', calories: 1400, mealStatus: 'planned', allergy: 'Penisilin', dietitian: 'Dyt. Burak Şen', assessedAt: '2026-09-25', note: 'Enteral beslenme toleransı ve aspirasyon riski izleniyor.' },
  { id: 'nut-2604', patient: 'Ali Çetin', fileNo: 'HST-24745', unit: 'Genel Cerrahi', diet: 'soft', risk: 'medium', calories: 1800, mealStatus: 'declined', allergy: 'Süt ürünü', dietitian: 'Dyt. Burak Şen', assessedAt: '2026-09-25', note: 'Öğle öğünü reddedildi; hemşirelik ekibine bilgi verildi.' },
  { id: 'nut-2605', patient: 'Zehra Aydın', fileNo: 'HST-24718', unit: 'Onkoloji', diet: 'liquid', risk: 'medium', calories: 1200, mealStatus: 'planned', allergy: 'Yok', dietitian: 'Dyt. Elif Kaya', assessedAt: '2026-09-24', note: 'Bulantı kontrolü sonrası sıvı diyet kademeli artırılacak.' }
];

function normalize(item, index = 0) {
  return {
    id: String(item?.id || `nut-${Date.now()}-${index}`),
    patient: String(item?.patient || 'Adsız hasta'),
    fileNo: String(item?.fileNo || 'Belirtilmedi'),
    unit: String(item?.unit || 'Genel'),
    diet: dietTypes.includes(item?.diet) ? item.diet : 'standard',
    risk: riskLevels.includes(item?.risk) ? item.risk : 'medium',
    calories: Math.max(0, Number(item?.calories) || 0),
    mealStatus: mealStatuses.includes(item?.mealStatus) ? item.mealStatus : 'planned',
    allergy: String(item?.allergy || 'Yok'),
    dietitian: String(item?.dietitian || 'Atanmadı'),
    assessedAt: String(item?.assessedAt || new Date().toISOString().slice(0, 10)),
    note: String(item?.note || '')
  };
}

export async function loadNutritionRecords() {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords();
    if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('[Klinik Beslenme] veriler okunamadı', error);
    return seedRecords();
  }
}

export async function saveNutritionRecords(items) {
  const data = items.map(normalize);
  try {
    if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    throw new Error('Klinik beslenme kayıtları kaydedilemedi');
  }
}
