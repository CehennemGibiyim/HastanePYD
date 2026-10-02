// ===== HASTA HAKLARI VERİ KATMANI =====
const STORAGE_KEY = 'patient_rights_center_v1';
const categories = ['access', 'communication', 'care', 'rights', 'privacy', 'facility', 'billing', 'other'];
const priorities = ['high', 'medium', 'low'];
const statuses = ['received', 'in-review', 'action', 'resolved', 'closed'];
const channels = ['in-person', 'call', 'portal', 'written'];
const seedComplaints = () => [
  { id:'pr-2601', received:'2026-09-18', reference:'HST-38124', category:'access', priority:'high', status:'in-review', channel:'call', department:'Acil Servis', summary:'Bekleme süresi ve süreç hakkında bilgilendirme talebi.', owner:'Hasta Hakları Birimi', dueDate:'2026-09-21', action:'Acil servis bekleme akışı inceleniyor.' },
  { id:'pr-2602', received:'2026-09-16', reference:'HST-37988', category:'communication', priority:'medium', status:'action', channel:'portal', department:'Dahiliye', summary:'Taburculuk öncesi bilgilendirmenin yetersiz olduğu bildirildi.', owner:'Servis Sorumlu Hemşiresi', dueDate:'2026-09-23', action:'Eğitim ve bilgilendirme kontrol listesi güncellenecek.' },
  { id:'pr-2603', received:'2026-09-12', reference:'HST-37741', category:'rights', priority:'low', status:'resolved', channel:'written', department:'Ortopedi', summary:'Hasta dosyasına erişim ve başvuru yöntemi hakkında bilgi istendi.', owner:'Hasta Hakları Birimi', dueDate:'2026-09-19', action:'Başvuru kanalları yazılı olarak paylaşıldı.' }
];
function normalize(item, index = 0) {
  return { id:String(item?.id || `pr-${Date.now()}-${index}`), received:String(item?.received || ''), reference:String(item?.reference || 'Anonim başvuru'), category:categories.includes(item?.category) ? item.category : 'other', priority:priorities.includes(item?.priority) ? item.priority : 'medium', status:statuses.includes(item?.status) ? item.status : 'received', channel:channels.includes(item?.channel) ? item.channel : 'portal', department:String(item?.department || 'Belirtilmedi'), summary:String(item?.summary || ''), owner:String(item?.owner || ''), dueDate:String(item?.dueDate || ''), action:String(item?.action || '') };
}
export async function loadPatientRights() {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedComplaints();
    if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) { console.warn('[Hasta Hakları] veriler okunamadı', error); return seedComplaints(); }
}
export async function savePatientRights(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Hasta hakları kayıtları kaydedilemedi'); }
}
