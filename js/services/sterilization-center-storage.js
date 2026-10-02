import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'sterilization_center_v1';
const DAY = 86400000;

const datePlus = (days) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

function seed() {
  return {
    cycles: [
      { id: 'ST-2601', machine: 'Otoklav A', method: 'Buhar', startedAt: '2026-07-12T06:30:00', duration: 45, temperature: 134, operator: 'Ayşe Demir', load: 'Genel Cerrahi Seti', status: 'released', bowieDick: 'pass', biological: 'pass', chemical: 'pass' },
      { id: 'ST-2602', machine: 'Otoklav B', method: 'Buhar', startedAt: '2026-07-12T07:10:00', duration: 30, temperature: 121, operator: 'Mehmet Kaya', load: 'Jinekoloji Seti', status: 'released', bowieDick: 'pass', biological: 'pass', chemical: 'pass' },
      { id: 'ST-2603', machine: 'Plazma 1', method: 'Hidrojen peroksit', startedAt: '2026-07-12T08:05:00', duration: 55, temperature: 50, operator: 'Ayşe Demir', load: 'Endoskopi Seti', status: 'quarantine', bowieDick: 'pass', biological: 'pending', chemical: 'pass' },
      { id: 'ST-2604', machine: 'Otoklav A', method: 'Buhar', startedAt: '2026-07-11T18:20:00', duration: 45, temperature: 134, operator: 'Ali Şen', load: 'Ortopedi Seti', status: 'failed', bowieDick: 'fail', biological: 'fail', chemical: 'pass' }
    ],
    packs: [
      { id: 'PK-4101', setName: 'Laparoskopi Seti', location: 'OR-1 deposu', sterilizedAt: datePlus(-1), expiresAt: datePlus(6), status: 'available', cycleId: 'ST-2601' },
      { id: 'PK-4102', setName: 'Genel Cerrahi Seti', location: 'OR-2 deposu', sterilizedAt: datePlus(-1), expiresAt: datePlus(6), status: 'available', cycleId: 'ST-2602' },
      { id: 'PK-4103', setName: 'Ortopedi Seti', location: 'Karantina rafı', sterilizedAt: datePlus(-2), expiresAt: datePlus(5), status: 'quarantine', cycleId: 'ST-2604' },
      { id: 'PK-4104', setName: 'Acil Müdahale Seti', location: 'Acil servis', sterilizedAt: datePlus(-9), expiresAt: datePlus(-2), status: 'expired', cycleId: 'ST-2590' }
    ]
  };
}

const normalizeCycle = (item, index) => ({
  id: String(item?.id || uid(`ST-${index}`)), machine: String(item?.machine || 'Otoklav A'), method: String(item?.method || 'Buhar'),
  startedAt: String(item?.startedAt || new Date().toISOString()), duration: Math.max(1, Number(item?.duration) || 30), temperature: Math.max(0, Number(item?.temperature) || 121),
  operator: String(item?.operator || 'Atanmadı'), load: String(item?.load || 'Yeni yük'), status: ['released', 'quarantine', 'failed'].includes(item?.status) ? item.status : 'quarantine',
  bowieDick: ['pass', 'fail', 'pending'].includes(item?.bowieDick) ? item.bowieDick : 'pending', biological: ['pass', 'fail', 'pending'].includes(item?.biological) ? item.biological : 'pending', chemical: ['pass', 'fail', 'pending'].includes(item?.chemical) ? item.chemical : 'pending'
});
const normalizePack = (item, index) => ({
  id: String(item?.id || uid(`PK-${index}`)), setName: String(item?.setName || 'Yeni set'), location: String(item?.location || 'Steril depo'),
  sterilizedAt: String(item?.sterilizedAt || today()), expiresAt: String(item?.expiresAt || datePlus(7)), cycleId: String(item?.cycleId || '—'), status: ['available', 'quarantine', 'expired', 'in-use'].includes(item?.status) ? item.status : 'quarantine'
});

function normalize(value) { const fallback = seed(); return { cycles: (Array.isArray(value?.cycles) ? value.cycles : fallback.cycles).map(normalizeCycle), packs: (Array.isArray(value?.packs) ? value.packs : fallback.packs).map(normalizePack) }; }

export async function loadSterilizationCenterData() {
  const fallback = normalize(seed());
  try { return normalize(await readPlatform(KEY, fallback)); } catch (error) { console.warn('[Hastane PYS] Sterilizasyon verileri okunamadı', error); return fallback; }
}
export async function saveSterilizationCenterData(data) { return writePlatform(KEY, normalize(data)); }
export { datePlus, today };
