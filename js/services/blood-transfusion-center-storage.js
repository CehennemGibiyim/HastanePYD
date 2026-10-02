import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'blood_transfusion_center_v1';
const datePlus = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

function seed() {
  return {
    transfusions: [
      { id: 'TR-2601', patient: 'Fatma Yılmaz', protocol: 'Eritrosit süspansiyonu', blood: 'A Rh+', unit: 'ES-78421', ward: 'Dahiliye 3', clinician: 'Dr. Selin Aksoy', startedAt: '', status: 'ready', crossmatch: 'approved', note: 'Hb düşüklüğü', createdAt: today() },
      { id: 'TR-2602', patient: 'Murat Şahin', protocol: 'Trombosit aferezi', blood: '0 Rh+', unit: 'TA-11908', ward: 'Hematoloji', clinician: 'Dr. Emre Kaya', startedAt: '', status: 'pending', crossmatch: 'waiting', note: 'Trombositopeni', createdAt: today() },
      { id: 'TR-2603', patient: 'Zeynep Arslan', protocol: 'Taze donmuş plazma', blood: 'B Rh+', unit: 'FFP-55109', ward: 'Acil Servis', clinician: 'Dr. Burak Çetin', startedAt: '2026-07-12T09:15:00', status: 'in-progress', crossmatch: 'approved', note: 'Acil replasman', createdAt: today() },
      { id: 'TR-2604', patient: 'Ahmet Koç', protocol: 'Eritrosit süspansiyonu', blood: 'AB Rh+', unit: 'ES-78314', ward: 'Genel Cerrahi', clinician: 'Dr. Ece Demir', startedAt: '2026-07-12T07:40:00', status: 'reaction', crossmatch: 'approved', note: 'Kaşıntı ve ateş bildirildi', createdAt: today() }
    ],
    inventory: [
      { blood: 'A Rh+', component: 'Eritrosit', units: 18, minimum: 12, expiresAt: datePlus(11) },
      { blood: '0 Rh+', component: 'Eritrosit', units: 7, minimum: 10, expiresAt: datePlus(5) },
      { blood: 'B Rh+', component: 'Trombosit', units: 14, minimum: 8, expiresAt: datePlus(2) },
      { blood: 'AB Rh+', component: 'Plazma', units: 4, minimum: 6, expiresAt: datePlus(18) }
    ]
  };
}

const normalizeTransfusion = (item, index) => ({
  id: String(item?.id || uid(`TR-${index}`)), patient: String(item?.patient || 'Yeni hasta'), protocol: String(item?.protocol || 'Eritrosit süspansiyonu'), blood: String(item?.blood || 'A Rh+'), unit: String(item?.unit || 'Atanmadı'), ward: String(item?.ward || 'Birim belirtilmedi'), clinician: String(item?.clinician || 'Atanmadı'), startedAt: String(item?.startedAt || ''), status: ['pending', 'ready', 'in-progress', 'completed', 'reaction'].includes(item?.status) ? item.status : 'pending', crossmatch: ['waiting', 'approved'].includes(item?.crossmatch) ? item.crossmatch : 'waiting', note: String(item?.note || '—'), createdAt: String(item?.createdAt || today())
});
const normalizeInventory = (item, index) => ({ blood: String(item?.blood || `Grup ${index + 1}`), component: String(item?.component || 'Eritrosit'), units: Math.max(0, Number(item?.units) || 0), minimum: Math.max(1, Number(item?.minimum) || 1), expiresAt: String(item?.expiresAt || datePlus(7)) });
function normalize(value) { const fallback = seed(); return { transfusions: (Array.isArray(value?.transfusions) ? value.transfusions : fallback.transfusions).map(normalizeTransfusion), inventory: (Array.isArray(value?.inventory) ? value.inventory : fallback.inventory).map(normalizeInventory) }; }

export async function loadBloodTransfusionCenterData() {
  const fallback = normalize(seed());
  try { return normalize(await readPlatform(KEY, fallback)); } catch (error) { console.warn('[Hastane PYS] Transfüzyon verileri okunamadı', error); return fallback; }
}
export async function saveBloodTransfusionCenterData(data) { return writePlatform(KEY, normalize(data)); }
export { datePlus };
