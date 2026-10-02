// ===== ENFEKSİYON KONTROL VERİ KATMANI =====
const STORAGE_KEY = 'infection_command_center_v1';

const isoFromHours = (hours) => new Date(Date.now() + hours * 3600000).toISOString();

const seed = () => ({
  cases: [
    { id: 'ISO-2401', patient: 'Elif Şahin', record: 'P-24112', room: 'YBÜ 06', organism: 'MRSA', precaution: 'contact', status: 'active', owner: 'Enfeksiyon Hemşiresi', startedAt: isoFromHours(-30), reviewAt: isoFromHours(6), note: 'Temas izolasyonu ve günlük kültür takibi.' },
    { id: 'ISO-2402', patient: 'Kemal Bayrak', record: 'P-24088', room: 'YBÜ 03', organism: 'Pseudomonas', precaution: 'droplet', status: 'review', owner: 'Dr. Zeynep Arslan', startedAt: isoFromHours(-52), reviewAt: isoFromHours(-3), note: 'Solunum örneği sonucu bekleniyor.' },
    { id: 'ISO-2403', patient: 'Hasan Çelik', record: 'P-24070', room: 'Cerrahi 112', organism: 'E. coli', precaution: 'standard', status: 'active', owner: 'Servis Sorumlusu', startedAt: isoFromHours(-18), reviewAt: isoFromHours(18), note: 'Antibiyogram ile tedavi uyumu değerlendirilecek.' },
    { id: 'ISO-2404', patient: 'Zeynep Kara', record: 'P-24041', room: 'Dahiliye 218', organism: 'Klebsiella', precaution: 'closed', status: 'closed', owner: 'Enfeksiyon Komitesi', startedAt: isoFromHours(-120), reviewAt: isoFromHours(-72), note: 'İzolasyon sonlandırıldı.' }
  ],
  audits: [
    { id: 'AUD-801', department: 'Yoğun Bakım', compliance: 92, observations: 45, updatedAt: isoFromHours(-2) },
    { id: 'AUD-802', department: 'Dahiliye', compliance: 88, observations: 38, updatedAt: isoFromHours(-8) },
    { id: 'AUD-803', department: 'Cerrahi', compliance: 85, observations: 42, updatedAt: isoFromHours(-20) },
    { id: 'AUD-804', department: 'Kardiyoloji', compliance: 94, observations: 30, updatedAt: isoFromHours(-26) }
  ]
});

const normalize = (data) => ({
  cases: Array.isArray(data?.cases) ? data.cases.map((item, index) => ({
    id: String(item?.id || `ISO-${Date.now()}-${index}`), patient: String(item?.patient || 'İsimsiz hasta'), record: String(item?.record || '—'), room: String(item?.room || '—'), organism: String(item?.organism || 'Belirtilmemiş'), precaution: ['standard', 'contact', 'droplet', 'airborne'].includes(item?.precaution) ? item.precaution : 'standard', status: ['active', 'review', 'closed'].includes(item?.status) ? item.status : 'active', owner: String(item?.owner || 'Atanmadı'), startedAt: item?.startedAt || new Date().toISOString(), reviewAt: item?.reviewAt || new Date().toISOString(), note: String(item?.note || '')
  })) : [],
  audits: Array.isArray(data?.audits) ? data.audits.map((item, index) => ({ id: String(item?.id || `AUD-${Date.now()}-${index}`), department: String(item?.department || 'Genel'), compliance: Math.max(0, Math.min(100, Number(item?.compliance) || 0)), observations: Math.max(0, Number(item?.observations) || 0), updatedAt: item?.updatedAt || new Date().toISOString() })) : []
});

export async function loadInfectionCenterData() {
  const fallback = seed();
  try {
    const raw = await window.miniappsAI?.storage?.getItem(STORAGE_KEY);
    if (!raw) { await saveInfectionCenterData(fallback); return fallback; }
    const parsed = normalize(JSON.parse(raw));
    return parsed.cases.length || parsed.audits.length ? parsed : fallback;
  } catch (error) { console.warn('[Enfeksiyon merkezi] kayıtlar okunamadı', error); return fallback; }
}

export async function saveInfectionCenterData(data) {
  const normalized = normalize(data);
  try { if (window.miniappsAI?.storage) await window.miniappsAI.storage.setItem(STORAGE_KEY, JSON.stringify(normalized)); return true; }
  catch (error) { console.warn('[Enfeksiyon merkezi] kayıtlar kaydedilemedi', error); return false; }
}
