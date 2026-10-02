// ===== HASTA DENEYİMİ GERİ BİLDİRİM VERİ KATMANI =====
const KEY = 'patient_feedback_center_v1';

const seed = () => [
  { id: 'fb-2601', channel: 'qr', patientRef: 'HST-24781', department: 'Acil Servis', category: 'care', rating: 5, comment: 'Hemşirelik ekibi hızlı ve açıklayıcıydı. Süreç boyunca kendimi güvende hissettim.', status: 'resolved', date: '2026-09-01', owner: 'Hasta Deneyimi Birimi', responseDue: '2026-09-03' },
  { id: 'fb-2602', channel: 'portal', patientRef: 'HST-24692', department: 'Dahiliye', category: 'communication', rating: 4, comment: 'Doktor bilgilendirmesi çok faydalıydı; taburculuk evrakları biraz gecikti.', status: 'in-review', date: '2026-09-02', owner: 'Kalite Koordinatörlüğü', responseDue: '2026-09-05' },
  { id: 'fb-2603', channel: 'call', patientRef: 'HST-24518', department: 'Radyoloji', category: 'access', rating: 2, comment: 'Randevu saatinde uzun süre bekledim. Bekleme süresi hakkında bilgilendirme yapılmadı.', status: 'open', date: '2026-09-02', owner: '', responseDue: '2026-09-04' },
  { id: 'fb-2604', channel: 'qr', patientRef: 'HST-24377', department: 'Ortopedi', category: 'facility', rating: 3, comment: 'Oda temizdi, ancak refakatçi koltuğu için destek gerekti.', status: 'in-review', date: '2026-08-29', owner: 'Otelcilik Hizmetleri', responseDue: '2026-09-01' },
  { id: 'fb-2605', channel: 'portal', patientRef: 'HST-24104', department: 'Çocuk Sağlığı', category: 'care', rating: 5, comment: 'Çocuğumuzla iletişimleri çok özenliydi. Tüm sorularımızı sabırla yanıtladılar.', status: 'resolved', date: '2026-08-27', owner: 'Çocuk Sağlığı Sorumlusu', responseDue: '2026-08-30' },
  { id: 'fb-2606', channel: 'call', patientRef: 'HST-23988', department: 'Kadın Doğum', category: 'communication', rating: 1, comment: 'Geri dönüş bekliyorum; başvurumun hangi aşamada olduğunu öğrenemedim.', status: 'open', date: '2026-08-25', owner: '', responseDue: '2026-08-28' }
];

const normalize = (item, index) => ({
  id: String(item?.id || `fb-${Date.now()}-${index}`),
  channel: ['qr', 'portal', 'call', 'survey'].includes(item?.channel) ? item.channel : 'survey',
  patientRef: String(item?.patientRef || 'Anonim'),
  department: String(item?.department || 'Genel'),
  category: ['care', 'communication', 'access', 'facility', 'other'].includes(item?.category) ? item.category : 'other',
  rating: Math.min(5, Math.max(1, Number(item?.rating) || 3)),
  comment: String(item?.comment || ''),
  status: ['open', 'in-review', 'resolved'].includes(item?.status) ? item.status : 'open',
  date: String(item?.date || new Date().toISOString().slice(0, 10)),
  owner: String(item?.owner || ''),
  responseDue: String(item?.responseDue || item?.date || '')
});

export async function loadFeedbackRecords() {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seed();
    if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('[Hasta deneyimi] geri bildirimler okunamadı', error);
    return seed();
  }
}

export async function saveFeedbackRecords(records) {
  const clean = (Array.isArray(records) ? records : []).map(normalize);
  try {
    if (!window.miniappsAI?.storage) throw new Error('storage');
    await window.miniappsAI.storage.setItem(KEY, JSON.stringify(clean));
    return clean;
  } catch (error) {
    throw new Error('Geri bildirimler kaydedilemedi');
  }
}
