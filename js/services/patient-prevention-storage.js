// ===== HASTA DÜŞME VE BASI YARASI ÖNLEME VERİ KATMANI =====
const STORAGE_KEY = 'patient_prevention_v1';
const types = ['fall', 'pressure'];
const risks = ['critical', 'high', 'medium', 'low'];
const statuses = ['screening', 'prevention', 'followup', 'resolved'];
const dateFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seedRecords = () => [
  { id:'prv-2801', patient:'M.Y.', patientNo:'P-12407', type:'fall', risk:'high', status:'prevention', unit:'Dahiliye 3', owner:'Servis Hemşireliği', score:'7', nextReview:dateFromNow(0), measures:'Refakatçi bilgilendirildi; yatak freni kontrol edildi', note:'Gece mobilizasyonunda destek gerekli.' },
  { id:'prv-2802', patient:'S.K.', patientNo:'P-12391', type:'pressure', risk:'critical', status:'followup', unit:'Yoğun Bakım', owner:'Yara Bakım Ekibi', score:'18', nextReview:dateFromNow(-1), measures:'2 saatte bir pozisyon; basınç azaltıcı yatak', note:'Sakrum bölgesinde evre 2 lezyon izleniyor.' },
  { id:'prv-2803', patient:'A.T.', patientNo:'P-12432', type:'fall', risk:'medium', status:'screening', unit:'Ortopedi 2', owner:'Ayşe Demir', score:'4', nextReview:dateFromNow(1), measures:'Kaymaz çorap ve çağrı butonu kontrolü', note:'Ameliyat sonrası ilk değerlendirme.' },
  { id:'prv-2804', patient:'H.B.', patientNo:'P-12188', type:'pressure', risk:'low', status:'resolved', unit:'Nöroloji', owner:'Servis Hemşireliği', score:'2', nextReview:dateFromNow(4), measures:'Günlük cilt kontrolü', note:'Cilt bütünlüğü korunuyor.' },
  { id:'prv-2805', patient:'E.Ç.', patientNo:'P-12276', type:'fall', risk:'critical', status:'prevention', unit:'Acil Gözlem', owner:'Acil Servis Ekibi', score:'9', nextReview:dateFromNow(0), measures:'Yakın gözlem; yatak kenarlıkları kaldırıldı', note:'Bilinç dalgalanması nedeniyle risk yüksek.' }
];
function normalize(item, index = 0) {
  return { id:String(item?.id || `prv-${Date.now()}-${index}`), patient:String(item?.patient || 'İsimsiz hasta'), patientNo:String(item?.patientNo || 'Belirtilmedi'), type:types.includes(item?.type) ? item.type : 'fall', risk:risks.includes(item?.risk) ? item.risk : 'medium', status:statuses.includes(item?.status) ? item.status : 'screening', unit:String(item?.unit || 'Belirtilmedi'), owner:String(item?.owner || 'Atanmadı'), score:String(item?.score ?? '0'), nextReview:String(item?.nextReview || dateFromNow(1)), measures:String(item?.measures || ''), note:String(item?.note || '') };
}
export async function loadPreventionRecords() {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords();
    if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) { console.warn('[Hasta Güvenliği] önleme kayıtları okunamadı', error); return seedRecords(); }
}
export async function savePreventionRecords(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Önleme kayıtları kaydedilemedi'); }
}
