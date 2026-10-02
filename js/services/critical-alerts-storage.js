// ===== KRİTİK UYARI VERİ KATMANI =====
const STORAGE_KEY = 'critical_alerts_v1';
let memoryAlerts = null;

function seedAlerts() {
  const now = Date.now();
  return [
    { id: 'al-1001', title: 'Acil Servis personel açığı', source: 'Vardiya planı', severity: 'critical', status: 'open', owner: 'Ayşe Demir', department: 'Acil Servis', dueAt: now + 45 * 60000, lastActionAt: now - 12 * 60000, detail: '22:00 vardiyasında bir hemşire eksik görünüyor.', escalated: false },
    { id: 'al-1002', title: 'Yoğun bakım yatak kapasitesi', source: 'Yatak koordinasyonu', severity: 'critical', status: 'acknowledged', owner: 'Dr. Zeynep Arslan', department: 'Yoğun Bakım', dueAt: now + 90 * 60000, lastActionAt: now - 26 * 60000, detail: 'Dolu yatak oranı kritik eşik üzerinde.', escalated: false },
    { id: 'al-1003', title: 'Kritik laboratuvar sonucu bekliyor', source: 'Laboratuvar', severity: 'high', status: 'open', owner: 'Dr. Zeynep Arslan', department: 'Laboratuvar', dueAt: now + 30 * 60000, lastActionAt: now - 38 * 60000, detail: 'Sonucun sorumlu hekim tarafından teyit edilmesi gerekiyor.', escalated: false },
    { id: 'al-1004', title: 'Bası yarası değerlendirmesi gecikti', source: 'Hasta güvenliği', severity: 'high', status: 'open', owner: 'Ayşe Demir', department: 'Hemşirelik', dueAt: now - 25 * 60000, lastActionAt: now - 70 * 60000, detail: 'Oda 312 için planlanan değerlendirme süresi aşıldı.', escalated: true },
    { id: 'al-1005', title: 'Sertifika yenileme yaklaşımı', source: 'Yetkinlik matrisi', severity: 'medium', status: 'resolved', owner: 'İK Birimi', department: 'İnsan Kaynakları', dueAt: now + 4 * 86400000, lastActionAt: now - 2 * 3600000, detail: 'Üç çalışanın BLS sertifikası 30 gün içinde yenilenmeli.', escalated: false },
    { id: 'al-1006', title: 'Sterilizasyon çevrim kontrolü', source: 'Sterilizasyon', severity: 'medium', status: 'acknowledged', owner: 'Teknik Servis', department: 'Sterilizasyon', dueAt: now + 3 * 3600000, lastActionAt: now - 44 * 60000, detail: 'Akşam çevrimi için ikinci kontrol bekleniyor.', escalated: false }
  ];
}

function normalizeAlert(item, index) {
  const now = Date.now();
  return {
    id: item?.id || `al-${now}-${index}`,
    title: String(item?.title || 'Başlıksız uyarı'),
    source: String(item?.source || 'Manuel kayıt'),
    severity: ['critical', 'high', 'medium', 'low'].includes(item?.severity) ? item.severity : 'medium',
    status: ['open', 'acknowledged', 'resolved'].includes(item?.status) ? item.status : 'open',
    owner: String(item?.owner || 'Atanmadı'),
    department: String(item?.department || 'Genel'),
    dueAt: Number(item?.dueAt) || now + 86400000,
    lastActionAt: Number(item?.lastActionAt) || now,
    detail: String(item?.detail || ''),
    escalated: Boolean(item?.escalated)
  };
}

export async function loadCriticalAlerts() {
  if (memoryAlerts) return [...memoryAlerts];
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    memoryAlerts = Array.isArray(parsed) && parsed.length ? parsed.map(normalizeAlert) : seedAlerts();
  } catch (error) {
    console.warn('[Hastane PYS] Uyarılar okunamadı, örnek kayıtlar kullanılıyor', error);
    memoryAlerts = seedAlerts();
  }
  if (!window.miniappsAI?.storage) return [...memoryAlerts];
  if (!memoryAlerts.length) memoryAlerts = seedAlerts();
  try { await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(memoryAlerts)); } catch (error) { console.warn('[Hastane PYS] Uyarılar kaydedilemedi', error); }
  return [...memoryAlerts];
}

export async function saveCriticalAlerts(alerts) {
  memoryAlerts = alerts.map(normalizeAlert);
  try {
    if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(memoryAlerts));
  } catch (error) {
    throw new Error('Uyarılar kaydedilemedi');
  }
  return [...memoryAlerts];
}

export function getCriticalAlertSnapshot() {
  return memoryAlerts ? [...memoryAlerts] : seedAlerts();
}
