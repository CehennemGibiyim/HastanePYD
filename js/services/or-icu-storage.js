import { readPlatform, writePlatform, uid, today } from './platform-storage.js';

const KEY = 'or_icu_command_v1';
const DAY = 86400000;

function datePlus(days) {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
}

function seed() {
  return {
    orCases: [
      { id: 'OR-2401', patient: 'Ahmet Yılmaz', procedure: 'Laparoskopik appendektomi', room: 'OR-1', surgeon: 'Dr. Çelik', start: '08:00', end: '09:30', status: 'completed', priority: 'routine' },
      { id: 'OR-2402', patient: 'Fatma Demir', procedure: 'Kolesistektomi', room: 'OR-2', surgeon: 'Dr. Arslan', start: '10:00', end: '12:00', status: 'in-progress', priority: 'urgent' },
      { id: 'OR-2403', patient: 'Mehmet Öz', procedure: 'Radius fiksasyonu', room: 'OR-3', surgeon: 'Dr. Kaya', start: '13:00', end: '15:00', status: 'scheduled', priority: 'routine' },
      { id: 'OR-2404', patient: 'Ayşe Kaya', procedure: 'Tiroid lobektomi', room: 'OR-1', surgeon: 'Dr. Çelik', start: '14:00', end: '16:00', status: 'scheduled', priority: 'urgent' }
    ],
    icuPatients: [
      { id: 'ICU-1101', patient: 'Osman Bey', bed: 'YB-01', diagnosis: 'Sepsis', status: 'critical', spo2: 88, hr: 110, gcs: 10, updated: '08:42' },
      { id: 'ICU-1102', patient: 'Hasan Kara', bed: 'YB-02', diagnosis: 'Kalp cerrahisi sonrası', status: 'stable', spo2: 96, hr: 82, gcs: 15, updated: '08:35' },
      { id: 'ICU-1103', patient: 'Zeynep Şahin', bed: 'YB-03', diagnosis: 'ARDS', status: 'critical', spo2: 91, hr: 95, gcs: 13, updated: '08:28' },
      { id: 'ICU-1104', patient: 'Murat Akın', bed: 'YB-04', diagnosis: 'Pnömoni', status: 'improving', spo2: 94, hr: 88, gcs: 14, updated: '08:16' }
    ]
  };
}

function normalizeCase(item, index) {
  return { id: String(item?.id || uid(`OR-${index}`)), patient: String(item?.patient || 'Belirtilmedi'), procedure: String(item?.procedure || 'Planlanmamış işlem'), room: String(item?.room || 'OR-1'), surgeon: String(item?.surgeon || 'Atanmadı'), start: String(item?.start || '08:00'), end: String(item?.end || '09:00'), status: ['scheduled', 'in-progress', 'completed', 'cancelled'].includes(item?.status) ? item.status : 'scheduled', priority: ['routine', 'urgent', 'emergency'].includes(item?.priority) ? item.priority : 'routine' };
}

function normalizePatient(item, index) {
  return { id: String(item?.id || uid(`ICU-${index}`)), patient: String(item?.patient || 'Belirtilmedi'), bed: String(item?.bed || 'YB-01'), diagnosis: String(item?.diagnosis || 'Tanı belirtilmedi'), status: ['critical', 'stable', 'improving'].includes(item?.status) ? item.status : 'stable', spo2: Math.max(0, Math.min(100, Number(item?.spo2) || 0)), hr: Math.max(0, Number(item?.hr) || 0), gcs: Math.max(3, Math.min(15, Number(item?.gcs) || 3)), updated: String(item?.updated || '—') };
}

function normalize(value) {
  const fallback = seed();
  return {
    orCases: (Array.isArray(value?.orCases) ? value.orCases : fallback.orCases).map(normalizeCase),
    icuPatients: (Array.isArray(value?.icuPatients) ? value.icuPatients : fallback.icuPatients).map(normalizePatient)
  };
}

export async function loadORICUData() {
  const fallback = normalize(seed());
  try {
    const data = await readPlatform(KEY, fallback);
    return normalize(data);
  } catch (error) {
    console.warn('[Hastane PYS] OR ve yoğun bakım verileri okunamadı', error);
    return fallback;
  }
}

export async function saveORICUData(data) {
  const normalized = normalize(data);
  await writePlatform(KEY, normalized);
  return normalized;
}

export { datePlus, today };
