// ===== HASTA TRANSFER VE DEVİR TESLİM VERİ KATMANI =====
const STORAGE_KEY = 'patient_transfer_v1';
const statuses = ['awaiting', 'prepared', 'in-transit', 'handed-off', 'closed'];
const risks = ['critical', 'high', 'medium', 'low'];
const dateFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seedRecords = () => [
  { id:'ptr-3001', patient:'M.Ç.', patientNo:'P-12604', fromUnit:'Acil Servis', toUnit:'Yoğun Bakım', transferType:'Yoğun bakım kabulü', owner:'Yoğun Bakım Ekibi', date:dateFromNow(0), risk:'critical', status:'prepared', identityCheck:true, sbar:true, escort:false, issue:'Monitörlü transfer için sedye bekleniyor', note:'Vazoaktif ilaç infüzyonu devam ediyor.' },
  { id:'ptr-3002', patient:'E.A.', patientNo:'P-12588', fromUnit:'Dahiliye 2', toUnit:'Radyoloji', transferType:'BT çekimi', owner:'Servis Hemşireliği', date:dateFromNow(0), risk:'medium', status:'in-transit', identityCheck:true, sbar:true, escort:true, issue:'', note:'Kontrast madde kontrolü tamamlandı.' },
  { id:'ptr-3003', patient:'H.S.', patientNo:'P-12497', fromUnit:'Ameliyathane', toUnit:'Cerrahi Servis', transferType:'Postoperatif devir', owner:'Anestezi Ekibi', date:dateFromNow(-1), risk:'high', status:'handed-off', identityCheck:true, sbar:true, escort:true, issue:'', note:'Ağrı ve dren izlemi teslim edildi.' },
  { id:'ptr-3004', patient:'Z.K.', patientNo:'P-12451', fromUnit:'Kadın Doğum', toUnit:'Yenidoğan Ünitesi', transferType:'Anne-bebek transferi', owner:'Kadın Doğum Ekibi', date:dateFromNow(1), risk:'high', status:'awaiting', identityCheck:false, sbar:false, escort:false, issue:'Bebek kimlik bandı ikinci kontrol bekliyor', note:'Transfer öncesi iki tanımlayıcı doğrulanmalı.' },
  { id:'ptr-3005', patient:'B.T.', patientNo:'P-12380', fromUnit:'Yoğun Bakım', toUnit:'Dahiliye 1', transferType:'Servis devri', owner:'Yoğun Bakım Ekibi', date:dateFromNow(-2), risk:'low', status:'closed', identityCheck:true, sbar:true, escort:true, issue:'', note:'Devir teslim ve kayıt kapatma tamamlandı.' }
];
function normalize(item, index = 0) {
  return { id:String(item?.id || `ptr-${Date.now()}-${index}`), patient:String(item?.patient || 'İsimsiz hasta'), patientNo:String(item?.patientNo || 'Belirtilmedi'), fromUnit:String(item?.fromUnit || 'Belirtilmedi'), toUnit:String(item?.toUnit || 'Belirtilmedi'), transferType:String(item?.transferType || 'Hasta transferi'), owner:String(item?.owner || 'Atanmadı'), date:String(item?.date || dateFromNow(0)), risk:risks.includes(item?.risk) ? item.risk : 'medium', status:statuses.includes(item?.status) ? item.status : 'awaiting', identityCheck:item?.identityCheck === true, sbar:item?.sbar === true, escort:item?.escort === true, issue:String(item?.issue || ''), note:String(item?.note || '') };
}
export async function loadTransferRecords() {
  try { const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : null; const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords(); if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { console.warn('[Hasta Transfer] veriler okunamadı', error); return seedRecords(); }
}
export async function saveTransferRecords(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Hasta transfer kayıtları kaydedilemedi'); }
}
