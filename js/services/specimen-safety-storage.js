// ===== KLİNİK NUMUNE VE LABORATUVAR GÜVENLİĞİ VERİ KATMANI =====
const STORAGE_KEY = 'specimen_safety_v1';
const statuses = ['collected', 'labeled', 'in-transit', 'received', 'completed', 'rejected'];
const risks = ['critical', 'high', 'medium', 'low'];
const dateFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seedRecords = () => [
  { id:'ssp-3101', patient:'A.D.', patientNo:'P-12740', specimen:'Kan kültürü', source:'Acil Servis', destination:'Mikrobiyoloji', owner:'Acil Hemşireliği', date:dateFromNow(0), risk:'critical', status:'labeled', identityCheck:true, labelCheck:true, containerCheck:true, transportCheck:false, issue:'İkinci kültür seti alınmayı bekliyor', note:'Antibiyotik öncesi örnek kabulü kritik.' },
  { id:'ssp-3102', patient:'N.T.', patientNo:'P-12716', specimen:'Biyokimya tüpü', source:'Dahiliye 2', destination:'Merkez Laboratuvar', owner:'Servis Hemşireliği', date:dateFromNow(0), risk:'medium', status:'in-transit', identityCheck:true, labelCheck:true, containerCheck:true, transportCheck:true, issue:'', note:'Soğuk zincir taşıma kutusuyla gönderildi.' },
  { id:'ssp-3103', patient:'S.K.', patientNo:'P-12688', specimen:'Patoloji biyopsisi', source:'Ameliyathane', destination:'Patoloji', owner:'Ameliyathane Ekibi', date:dateFromNow(-1), risk:'high', status:'received', identityCheck:true, labelCheck:true, containerCheck:true, transportCheck:true, issue:'', note:'Formalin kabı ve istem formu birlikte teslim edildi.' },
  { id:'ssp-3104', patient:'B.Y.', patientNo:'P-12651', specimen:'İdrar kültürü', source:'Üroloji Servisi', destination:'Mikrobiyoloji', owner:'Servis Hemşireliği', date:dateFromNow(-1), risk:'high', status:'rejected', identityCheck:true, labelCheck:false, containerCheck:true, transportCheck:false, issue:'Etiket–istem formu eşleşmiyor', note:'Yeni numune alınması için birime bilgi verildi.' },
  { id:'ssp-3105', patient:'F.G.', patientNo:'P-12596', specimen:'Hemogram', source:'Dahiliye 1', destination:'Merkez Laboratuvar', owner:'Laboratuvar Kurye Ekibi', date:dateFromNow(1), risk:'low', status:'completed', identityCheck:true, labelCheck:true, containerCheck:true, transportCheck:true, issue:'', note:'Numune kabul ve analiz süreci tamamlandı.' }
];
function normalize(item, index = 0) {
  return { id:String(item?.id || `ssp-${Date.now()}-${index}`), patient:String(item?.patient || 'İsimsiz hasta'), patientNo:String(item?.patientNo || 'Belirtilmedi'), specimen:String(item?.specimen || 'Numune'), source:String(item?.source || 'Belirtilmedi'), destination:String(item?.destination || 'Belirtilmedi'), owner:String(item?.owner || 'Atanmadı'), date:String(item?.date || dateFromNow(0)), risk:risks.includes(item?.risk) ? item.risk : 'medium', status:statuses.includes(item?.status) ? item.status : 'collected', identityCheck:item?.identityCheck === true, labelCheck:item?.labelCheck === true, containerCheck:item?.containerCheck === true, transportCheck:item?.transportCheck === true, issue:String(item?.issue || ''), note:String(item?.note || '') };
}
export async function loadSpecimenRecords() {
  try { const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : null; const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords(); if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { console.warn('[Numune Güvenliği] veriler okunamadı', error); return seedRecords(); }
}
export async function saveSpecimenRecords(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Numune güvenliği kayıtları kaydedilemedi'); }
}
