const STORAGE_KEY = 'training_center_records_v1';
const DAY = 86400000;
let cache = null;

function datePlus(days) {
  return new Date(Date.now() + days * DAY).toISOString().slice(0, 10);
}

function seed() {
  return [
    { id: 'TR-1001', staff: 'Hemşire Ayşe', department: 'Acil Servis', role: 'Hemşire', module: 'KPR ve defibrilatör kullanımı', type: 'simulation', status: 'completed', dueDate: datePlus(18), score: 92, instructor: 'Dr. Arslan', completedAt: datePlus(-12) },
    { id: 'TR-1002', staff: 'Hemşire Fatma', department: 'Kardiyoloji', role: 'Hemşire', module: 'EKG ritim tanıma', type: 'classroom', status: 'in-progress', dueDate: datePlus(7), score: 76, instructor: 'Dr. Kaya', completedAt: '' },
    { id: 'TR-1003', staff: 'Dr. Zeynep Yıldız', department: 'Yoğun Bakım', role: 'Uzman hekim', module: 'Ventilatör güvenliği', type: 'simulation', status: 'planned', dueDate: datePlus(3), score: 0, instructor: 'Dr. Çelik', completedAt: '' },
    { id: 'TR-1004', staff: 'Teknisyen Mehmet', department: 'Sterilizasyon', role: 'Teknisyen', module: 'Sterilizasyon kalite kontrolü', type: 'classroom', status: 'completed', dueDate: datePlus(-22), score: 84, instructor: 'Kalite Birimi', completedAt: datePlus(-30) },
    { id: 'TR-1005', staff: 'Hemşire Zeynep', department: 'Cerrahi Servis', role: 'Hemşire', module: 'Hasta transferi ve düşme önleme', type: 'simulation', status: 'planned', dueDate: datePlus(46), score: 0, instructor: 'Eğitim Hemşiresi', completedAt: '' }
  ];
}

function normalizeItem(item, index) {
  const allowedType = ['simulation', 'classroom'];
  const allowedStatus = ['planned', 'in-progress', 'completed'];
  return {
    id: String(item?.id || `TR-${Date.now()}-${index}`),
    staff: String(item?.staff || 'Belirtilmedi'),
    department: String(item?.department || 'Genel'),
    role: String(item?.role || 'Personel'),
    module: String(item?.module || 'Yeni eğitim'),
    type: allowedType.includes(item?.type) ? item.type : 'classroom',
    status: allowedStatus.includes(item?.status) ? item.status : 'planned',
    dueDate: String(item?.dueDate || datePlus(30)),
    score: Math.max(0, Math.min(100, Number(item?.score) || 0)),
    instructor: String(item?.instructor || 'Atanmadı'),
    completedAt: String(item?.completedAt || '')
  };
}

function normalize(value) {
  const source = Array.isArray(value) ? value : seed();
  return source.map(normalizeItem);
}

async function persist(records) {
  if (!window.miniappsAI?.storage) return;
  await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function loadTrainingRecords() {
  if (cache) return structuredClone(cache);
  const fallback = seed();
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    cache = normalize(raw ? JSON.parse(raw) : fallback);
  } catch (error) {
    console.warn('[Hastane PYS] Eğitim kayıtları okunamadı', error);
    cache = normalize(fallback);
  }
  try { await persist(cache); } catch (error) { console.warn('[Hastane PYS] Eğitim kayıtları saklanamadı', error); }
  return structuredClone(cache);
}

export async function saveTrainingRecords(records) {
  cache = normalize(records);
  await persist(cache);
  return structuredClone(cache);
}

export function resetTrainingCache() {
  cache = null;
}
