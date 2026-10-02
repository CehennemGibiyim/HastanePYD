// ===== KALİTE İYİLEŞTİRME VERİ KATMANI =====
const STORAGE_KEY = 'quality_improvement_center_v1';
const categories = ['patient-safety', 'clinical', 'process', 'document', 'environment'];
const priorities = ['critical', 'high', 'normal'];
const statuses = ['open', 'in-progress', 'verified', 'closed'];

const seedFindings = () => [
  { id: 'qi-2601', title: 'İlaç güvenliği çift kontrol uyumu', source: 'İç denetim', standard: 'SKS 5.1', category: 'patient-safety', priority: 'high', status: 'in-progress', department: 'Dahiliye', owner: 'Kalite Birimi', dueDate: '2026-10-08', finding: 'Akşam vardiyasında iki kayıtta çift kontrol imzası eksik.', action: 'Vardiya tesliminde elektronik çift kontrol hatırlatıcısı devreye alınacak.' },
  { id: 'qi-2602', title: 'Acil servis triyaj alanı işaretleri', source: 'SKS saha turu', standard: 'SKS 3.4', category: 'environment', priority: 'normal', status: 'open', department: 'Acil Servis', owner: 'Teknik Servis', dueDate: '2026-10-05', finding: 'Yönlendirme levhalarının ikisi görünürlük standardını karşılamıyor.', action: 'Levhalar yenilenecek ve saha turu ile doğrulanacak.' },
  { id: 'qi-2603', title: 'Taburculuk eğitim kayıtlarının bütünlüğü', source: 'Kalite göstergesi', standard: 'JCI PFE.2', category: 'process', priority: 'critical', status: 'open', department: 'Ortopedi', owner: 'Servis Sorumlu Hemşiresi', dueDate: '2026-09-29', finding: 'Son ay örnekleminde eğitim formu tamlık oranı %86 ölçüldü.', action: 'Taburculuk kontrol listesi revize edilip ekip eğitimi yapılacak.' },
  { id: 'qi-2604', title: 'El hijyeni gözlem formu revizyonu', source: 'Enfeksiyon kontrol', standard: 'SKS 4.7', category: 'clinical', priority: 'normal', status: 'verified', department: 'Yoğun Bakım', owner: 'Enfeksiyon Kontrol Komitesi', dueDate: '2026-09-22', finding: 'Gözlem formu yeni beş endikasyonu içermiyordu.', action: 'Güncel form yayımlandı, ilk izlem sonuçları doğrulandı.' }
];

function normalize(item, index = 0) {
  return {
    id: String(item?.id || `qi-${Date.now()}-${index}`),
    title: String(item?.title || 'Başlıksız kalite bulgusu'),
    source: String(item?.source || 'Manuel kayıt'),
    standard: String(item?.standard || 'Belirtilmedi'),
    category: categories.includes(item?.category) ? item.category : 'process',
    priority: priorities.includes(item?.priority) ? item.priority : 'normal',
    status: statuses.includes(item?.status) ? item.status : 'open',
    department: String(item?.department || 'Genel'),
    owner: String(item?.owner || 'Atanmadı'),
    dueDate: String(item?.dueDate || ''),
    finding: String(item?.finding || ''),
    action: String(item?.action || '')
  };
}

export async function loadQualityFindings() {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedFindings();
    if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('[Kalite İyileştirme] veriler okunamadı', error);
    return seedFindings();
  }
}

export async function saveQualityFindings(items) {
  const data = items.map(normalize);
  try {
    if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    throw new Error('Kalite iyileştirme kayıtları kaydedilemedi');
  }
}
