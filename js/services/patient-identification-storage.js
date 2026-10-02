// ===== HASTA KİMLİK DOĞRULAMA VERİ KATMANI =====
const STORAGE_KEY = 'patient_identification_v1';
const methods = ['wristband', 'two-identifiers', 'biometric'];
const statuses = ['pending', 'verified', 'exception', 'escalated'];
const dateFromNow = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const seedRecords = () => [
  { id:'pid-2901', patient:'N.A.', patientNo:'P-12541', unit:'Acil Servis', method:'two-identifiers', status:'pending', verifiedBy:'Acil Servis Hemşireliği', checkedAt:dateFromNow(0), nextCheck:dateFromNow(0), exception:'Bileklik yazıcısı bekleniyor', note:'Triage sonrası yatış kararı bekleniyor.' },
  { id:'pid-2902', patient:'F.K.', patientNo:'P-12488', unit:'Yoğun Bakım', method:'wristband', status:'verified', verifiedBy:'Yoğun Bakım Ekibi', checkedAt:dateFromNow(-1), nextCheck:dateFromNow(1), exception:'', note:'Bileklik ve dosya eşleşmesi doğrulandı.' },
  { id:'pid-2903', patient:'S.D.', patientNo:'P-12507', unit:'Ameliyathane', method:'two-identifiers', status:'exception', verifiedBy:'Ameliyathane Sorumlusu', checkedAt:dateFromNow(-1), nextCheck:dateFromNow(0), exception:'Hasta yakını adı ile kayıt bilgisi uyuşmuyor', note:'İşlem öncesi sorumlu hekim bilgilendirildi.' },
  { id:'pid-2904', patient:'G.B.', patientNo:'P-12376', unit:'Dahiliye 2', method:'biometric', status:'verified', verifiedBy:'Servis Hemşireliği', checkedAt:dateFromNow(-2), nextCheck:dateFromNow(2), exception:'', note:'İki tanımlayıcı ve bileklik kontrolü tamamlandı.' },
  { id:'pid-2905', patient:'T.Y.', patientNo:'P-12462', unit:'Radyoloji', method:'wristband', status:'escalated', verifiedBy:'Radyoloji Birimi', checkedAt:dateFromNow(-2), nextCheck:dateFromNow(-1), exception:'Bileklik hasarlı, yeni bileklik gerekli', note:'Çekim öncesi kimlik doğrulama tekrarlanmalı.' }
];
function normalize(item, index = 0) {
  return { id:String(item?.id || `pid-${Date.now()}-${index}`), patient:String(item?.patient || 'İsimsiz hasta'), patientNo:String(item?.patientNo || 'Belirtilmedi'), unit:String(item?.unit || 'Belirtilmedi'), method:methods.includes(item?.method) ? item.method : 'two-identifiers', status:statuses.includes(item?.status) ? item.status : 'pending', verifiedBy:String(item?.verifiedBy || 'Atanmadı'), checkedAt:String(item?.checkedAt || dateFromNow(0)), nextCheck:String(item?.nextCheck || dateFromNow(0)), exception:String(item?.exception || ''), note:String(item?.note || '') };
}
export async function loadIdentificationRecords() {
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const data = Array.isArray(parsed) && parsed.length ? parsed.map(normalize) : seedRecords();
    if (!raw && window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) { console.warn('[Hasta Güvenliği] kimlik kayıtları okunamadı', error); return seedRecords(); }
}
export async function saveIdentificationRecords(items) {
  const data = items.map(normalize);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(data)); return data; }
  catch (error) { throw new Error('Kimlik kayıtları kaydedilemedi'); }
}
