const STORAGE_KEY = 'clinical_command_center_v1';
const memory = [];
const inMinutes = (minutes) => new Date(Date.now() + minutes * 60000).toISOString();
const seed = () => [
  { id:'KRT-2401', patient:'Ayşe Demir', record:'P-24810', test:'Troponin I', value:'1.84', unit:'ng/mL', reference:'< 0.04', severity:'critical', ward:'Acil Servis · Gözlem 3', notifiedTo:'Dr. Selin Kaya', dueAt:inMinutes(-8), status:'new', note:'Akut koroner sendrom şüphesi' },
  { id:'KRT-2402', patient:'Mehmet Özkan', record:'P-24796', test:'Potasyum', value:'6.7', unit:'mmol/L', reference:'3.5–5.1', severity:'critical', ward:'Dahiliye · 304', notifiedTo:'Dr. Murat Arslan', dueAt:inMinutes(4), status:'notified', note:'EKG kontrolü ve tekrar örnek planlandı' },
  { id:'KRT-2403', patient:'Sibel Yıldız', record:'P-24772', test:'Hemoglobin', value:'6.8', unit:'g/dL', reference:'12–16', severity:'high', ward:'Hematoloji · 208', notifiedTo:'Dr. Ece Çelik', dueAt:inMinutes(-34), status:'acknowledged', note:'Transfüzyon değerlendirmesi bekleniyor' },
  { id:'KRT-2404', patient:'Hasan Koç', record:'P-24751', test:'Laktat', value:'4.9', unit:'mmol/L', reference:'0.5–2.2', severity:'high', ward:'Yoğun Bakım · YB-06', notifiedTo:'Dr. Ozan Yılmaz', dueAt:inMinutes(-75), status:'closed', note:'Tedavi yanıtı kontrol edildi' },
];
const normalize = (item) => ({ ...item, severity:item.severity || 'high', status:item.status || 'new', note:item.note || '', notifiedTo:item.notifiedTo || 'Nöbetçi hekim' });
export async function loadClinicalCommandData() {
  if (memory.length) return memory;
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : seed();
    const records = Array.isArray(parsed) ? parsed.map(normalize) : seed();
    memory.push(...records);
    if (!raw) await saveClinicalCommandData(records);
    return memory;
  } catch (error) {
    console.warn('[Klinik kritik değer] veriler okunamadı', error);
    const records = seed(); memory.push(...records); return memory;
  }
}
export async function saveClinicalCommandData(records) {
  memory.splice(0, memory.length, ...records);
  try { await window.miniappsAI?.storage?.setItem(STORAGE_KEY, JSON.stringify(records)); return true; } catch (error) { console.warn('[Klinik kritik değer] veriler kaydedilemedi', error); return false; }
}
export { inMinutes };