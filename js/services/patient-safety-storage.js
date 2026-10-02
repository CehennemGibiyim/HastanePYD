const INCIDENTS_KEY = 'patient_safety_incidents_v1';
const CAPA_KEY = 'patient_safety_capa_v1';
let cache = null;

function seed() {
  const now = Date.now();
  return {
    incidents: [
      { id: 'PS-1001', createdAt: now - 2 * 86400000, type: 'İlaç hatası', severity: 'near-miss', department: 'Dahiliye', description: 'Yanlış doz hazırlığı uygulama öncesi fark edildi.', reporter: 'Hemşire Fatma', status: 'investigating', rootCause: 'İkinci kontrol adımı atlandı.' },
      { id: 'PS-1002', createdAt: now - 4 * 86400000, type: 'Hasta düşmesi', severity: 'minor', department: 'Ortopedi', description: 'Hasta yataktan kalkarken düştü; hafif morarma izlendi.', reporter: 'Hemşire Zeynep', status: 'action-taken', rootCause: 'Yan korkuluk açık unutuldu.' },
      { id: 'PS-1003', createdAt: now - 7 * 86400000, type: 'Kimlik doğrulama', severity: 'near-miss', department: 'Ameliyathane', description: 'Time-out sırasında kimlik uyumsuzluğu işlem öncesi düzeltildi.', reporter: 'Dr. Yıldız', status: 'closed', rootCause: 'Bileklik kontrolü gecikti.' },
      { id: 'PS-1004', createdAt: now - 10 * 86400000, type: 'Ekipman güvenliği', severity: 'moderate', department: 'Acil Servis', description: 'Defibrilatör kontrolünde arıza görüldü; yedek cihaz devreye alındı.', reporter: 'Dr. Arslan', status: 'reported', rootCause: '' }
    ],
    capa: [
      { id: 'CAPA-1001', incidentId: 'PS-1001', title: 'İlaç ikinci kontrol uyumunu artırma', source: 'PS-1001', severity: 'high', assignee: 'Başhemşirelik', dueDate: now + 12 * 86400000, status: 'in-progress', actions: 'İkinci kontrol eğitimi ve haftalık gözlem planlandı.', verification: '' },
      { id: 'CAPA-1002', incidentId: 'PS-1002', title: 'Düşme önleme turunu standardize etme', source: 'PS-1002', severity: 'medium', assignee: 'Kalite Birimi', dueDate: now + 20 * 86400000, status: 'planning', actions: 'Birim bazlı kontrol listesi hazırlanacak.', verification: '' },
      { id: 'CAPA-1003', incidentId: 'PS-1003', title: 'Ameliyathane kimlik kontrolünü güçlendirme', source: 'PS-1003', severity: 'low', assignee: 'Ameliyathane Sorumlusu', dueDate: now - 2 * 86400000, status: 'completed', actions: 'Time-out gözlem formu güncellendi.', verification: 'Son üç gözlem başarılı.' }
    ]
  };
}

function normalize(raw) {
  const base = seed();
  const incidents = Array.isArray(raw?.incidents) ? raw.incidents : base.incidents;
  const capa = Array.isArray(raw?.capa) ? raw.capa : base.capa;
  return { incidents: incidents.map((item, index) => ({ id: String(item?.id || `PS-${Date.now()}-${index}`), createdAt: Number(item?.createdAt) || Date.now(), type: String(item?.type || 'Diğer'), severity: ['near-miss', 'minor', 'moderate', 'severe'].includes(item?.severity) ? item.severity : 'minor', department: String(item?.department || 'Genel'), description: String(item?.description || ''), reporter: String(item?.reporter || 'Belirtilmedi'), status: ['reported', 'investigating', 'action-taken', 'closed'].includes(item?.status) ? item.status : 'reported', rootCause: String(item?.rootCause || '') })), capa: capa.map((item, index) => ({ id: String(item?.id || `CAPA-${Date.now()}-${index}`), incidentId: String(item?.incidentId || ''), title: String(item?.title || 'Yeni iyileştirme faaliyeti'), source: String(item?.source || 'Manuel kayıt'), severity: ['high', 'medium', 'low'].includes(item?.severity) ? item.severity : 'medium', assignee: String(item?.assignee || 'Atanmadı'), dueDate: Number(item?.dueDate) || Date.now() + 30 * 86400000, status: ['planning', 'in-progress', 'completed'].includes(item?.status) ? item.status : 'planning', actions: String(item?.actions || ''), verification: String(item?.verification || '') })) };
}

export async function loadSafetyData() {
  if (cache) return structuredClone(cache);
  const fallback = seed();
  try {
    const [incidentRaw, capaRaw] = await Promise.all([window.miniappsAI?.storage?.getItem(INCIDENTS_KEY), window.miniappsAI?.storage?.getItem(CAPA_KEY)]);
    cache = normalize({ incidents: incidentRaw ? JSON.parse(incidentRaw) : fallback.incidents, capa: capaRaw ? JSON.parse(capaRaw) : fallback.capa });
  } catch (error) { console.warn('[Hastane PYS] Hasta güvenliği kayıtları okunamadı', error); cache = normalize(fallback); }
  if (!window.miniappsAI?.storage) return structuredClone(cache);
  try { await persist(cache); } catch (error) { console.warn('[Hastane PYS] Hasta güvenliği kayıtları ilk kayıtta saklanamadı', error); }
  return structuredClone(cache);
}

async function persist(data) {
  await Promise.all([window.miniappsAI.storage.setItem(INCIDENTS_KEY, JSON.stringify(data.incidents)), window.miniappsAI.storage.setItem(CAPA_KEY, JSON.stringify(data.capa))]);
}

export async function saveSafetyData(data) {
  cache = normalize(data);
  if (window.miniappsAI?.storage) await persist(cache);
  return structuredClone(cache);
}
