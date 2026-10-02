// ===== TIBBİ CİHAZ VE BİYOMEDİKAL GÜVENLİK VERİ KATMANI =====
const STORAGE_KEY = 'medical_device_center_v1';
const risks = ['critical', 'high', 'medium', 'low'];
const statuses = ['operational', 'maintenance', 'out-of-service', 'retired'];
const dateFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seedRecords = () => [
  { id: 'dev-2601', name: 'Yoğun bakım ventilatörü', inventoryNo: 'BM-YSB-014', type: 'Ventilatör', manufacturer: 'Dräger Evita V600', unit: 'Yoğun Bakım', risk: 'critical', status: 'operational', nextMaintenance: dateFromNow(-4), owner: 'Biyomedikal Birim', note: 'Koruyucu bakım tarihi geçti; kullanım öncesi fonksiyon kontrolü yapılmalı.' },
  { id: 'dev-2602', name: 'Acil servis defibrilatörü', inventoryNo: 'BM-ACİL-008', type: 'Defibrilatör', manufacturer: 'Mindray BeneHeart D3', unit: 'Acil Servis', risk: 'critical', status: 'maintenance', nextMaintenance: dateFromNow(2), owner: 'Teknik Servis', note: 'Batarya kapasitesi ve ped son kullanma tarihi kontrol ediliyor.' },
  { id: 'dev-2603', name: 'Ameliyathane anestezi cihazı', inventoryNo: 'BM-AMEL-021', type: 'Anestezi cihazı', manufacturer: 'GE Carestation 650', unit: 'Ameliyathane', risk: 'high', status: 'operational', nextMaintenance: dateFromNow(18), owner: 'Biyomedikal Birim', note: 'Gaz analizörü kalibrasyonu planlandı.' },
  { id: 'dev-2604', name: 'Hasta başı monitörü', inventoryNo: 'BM-KARD-033', type: 'Monitör', manufacturer: 'Philips IntelliVue MX450', unit: 'Kardiyoloji', risk: 'medium', status: 'out-of-service', nextMaintenance: dateFromNow(-2), owner: 'Teknik Servis', note: 'SpO2 sensör bağlantısı arızalı; yedek cihaz talebi açıldı.' },
  { id: 'dev-2605', name: 'İnfüzyon pompası', inventoryNo: 'BM-DAH-117', type: 'İnfüzyon pompası', manufacturer: 'B. Braun Infusomat', unit: 'Dahiliye', risk: 'medium', status: 'operational', nextMaintenance: dateFromNow(34), owner: 'Biyomedikal Birim', note: 'Yıllık elektriksel güvenlik testi planlandı.' }
];
function normalize(item, index = 0) {
  return { id: String(item?.id || `dev-${Date.now()}-${index}`), name: String(item?.name || 'Adsız cihaz'), inventoryNo: String(item?.inventoryNo || 'Belirtilmedi'), type: String(item?.type || 'Tıbbi cihaz'), manufacturer: String(item?.manufacturer || 'Belirtilmedi'), unit: String(item?.unit || 'Genel'), risk: risks.includes(item?.risk) ? item.risk : 'medium', status: statuses.includes(item?.status) ? item.status : 'operational', nextMaintenance: String(item?.nextMaintenance || dateFromNow(30)), owner: String(item?.owner || 'Atanmadı'), note: String(item?.note || '') };
}
export async function loadMedicalDevices() {
  try { const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : null; const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords(); if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { console.warn('[Biyomedikal] veriler okunamadı', error); return seedRecords(); }
}
export async function saveMedicalDevices(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Cihaz kayıtları kaydedilemedi'); }
}