// ===== CERRAHİ GÜVENLİK VERİ KATMANI =====
const STORAGE_KEY = 'surgical_safety_v1';
const statuses = ['planned', 'preop', 'timeout', 'postop', 'completed'];
const dateFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seedRecords = () => [
  { id:'sur-2701', patient:'A.K.', patientNo:'P-12041', procedure:'Laparoskopik kolesistektomi', room:'Ameliyathane 2', surgeon:'Doç. Dr. Murat Yıldız', date:dateFromNow(0), status:'timeout', consent:true, siteMarked:true, timeout:false, handoff:false, issue:'Taraf doğrulaması ekipçe yeniden yapılmalı', owner:'Ameliyathane Sorumlusu' },
  { id:'sur-2702', patient:'N.T.', patientNo:'P-11982', procedure:'Total diz protezi', room:'Ameliyathane 4', surgeon:'Dr. Elif Karaca', date:dateFromNow(0), status:'preop', consent:true, siteMarked:true, timeout:false, handoff:false, issue:'', owner:'Ortopedi Ekibi' },
  { id:'sur-2703', patient:'R.B.', patientNo:'P-11876', procedure:'Sezaryen', room:'Ameliyathane 1', surgeon:'Dr. Selin Kaya', date:dateFromNow(1), status:'planned', consent:true, siteMarked:false, timeout:false, handoff:false, issue:'', owner:'Kadın Doğum Ekibi' },
  { id:'sur-2704', patient:'S.D.', patientNo:'P-11604', procedure:'TUR-P', room:'Ameliyathane 3', surgeon:'Dr. Barış Acar', date:dateFromNow(-1), status:'completed', consent:true, siteMarked:true, timeout:true, handoff:true, issue:'', owner:'Üroloji Ekibi' },
  { id:'sur-2705', patient:'L.E.', patientNo:'P-12117', procedure:'Parsiyel hepatektomi', room:'Ameliyathane 5', surgeon:'Prof. Dr. Cem Özkan', date:dateFromNow(2), status:'postop', consent:true, siteMarked:true, timeout:true, handoff:false, issue:'Postoperatif devir teslim formu eksik', owner:'Genel Cerrahi Ekibi' }
];
function normalize(item, index = 0) {
  return { id:String(item?.id || `sur-${Date.now()}-${index}`), patient:String(item?.patient || 'İsimsiz hasta'), patientNo:String(item?.patientNo || 'Belirtilmedi'), procedure:String(item?.procedure || 'Belirtilmedi'), room:String(item?.room || 'Ameliyathane'), surgeon:String(item?.surgeon || 'Atanmadı'), date:String(item?.date || dateFromNow(0)), status:statuses.includes(item?.status) ? item.status : 'planned', consent:item?.consent === true, siteMarked:item?.siteMarked === true, timeout:item?.timeout === true, handoff:item?.handoff === true, issue:String(item?.issue || ''), owner:String(item?.owner || 'Atanmadı') };
}
export async function loadSurgicalRecords() {
  try { const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : null; const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords(); if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { console.warn('[Cerrahi Güvenlik] veriler okunamadı', error); return seedRecords(); }
}
export async function saveSurgicalRecords(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Cerrahi güvenlik kayıtları kaydedilemedi'); }
}
