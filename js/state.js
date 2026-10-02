// ===== HASTANE PERSONEL YÖNETİM SİSTEMİ - STATE & DATA =====

export const SUPER_ADMIN_USERNAME = 'CehennemGibiyim';

const ADMIN_USER = {
  username: SUPER_ADMIN_USERNAME,
  password: '8Rtytubhaw?',
  role: 'admin',
  name: 'Sistem Yöneticisi',
  department: null,
};

export const ROLES = {
  admin: { label: 'Admin', desc: 'Tam yetki – tüm modülleri yönetir', permissions: ['read', 'write', 'manage_users', 'manage_all'] },
  supervisor: { label: 'Departman Sorumlusu', desc: 'Kendi departmanındaki personeli, nöbet ve puantajı yönetir', permissions: ['read', 'write', 'manage_department', 'manage_department_personnel', 'manage_department_schedule', 'manage_department_attendance', 'manage_department_contacts'] },
  viewer: { label: 'Okuyucu', desc: 'Sadece görüntüleme yapabilir', permissions: ['read'] },
};

export function getUserDepartment() {
  const u = getCurrentUser();
  return u?.department || null;
}

export function isDepartmentRestricted() {
  const u = getCurrentUser();
  return u?.role === 'supervisor' && !!u?.department;
}

export function canAccessDepartment(department) {
  if (!isDepartmentRestricted()) return true;
  return getUserDepartment() === department;
}

// ===== DİNAMİK DEPARTMAN & TÜR YÖNETİMİ =====

const SEED_DEPARTMENTS = [
  'Acil Servis', 'Dahiliye', 'Cerrahi', 'Çocuk Sağlığı',
  'Kadın Doğum', 'Göz', 'KBB', 'Ortopedi',
  'Hemşirelik', 'Temizlik', 'Güvenlik', 'Teknik Servis',
  'İdari', 'Mutfak', 'Laboratuvar', 'Eczane', 'Radyoloji',
  'Fizik Tedavi', 'Yoğun Bakım', 'Ameliyathane',
];

const SEED_TYPES = {
  worker:    { label: 'İşçi',           weeklyHours: 45, category: 'worker' },
  officer:   { label: 'Hizmetli/Memur',  weeklyHours: 40, category: 'officer' },
  nurse:     { label: 'Hemşire',         weeklyHours: 40, category: 'officer' },
  doctor:    { label: 'Doktor',          weeklyHours: 40, category: 'officer' },
  security:  { label: 'Güvenlik',        weeklyHours: 45, category: 'worker' },
  technical: { label: 'Teknik Personel', weeklyHours: 45, category: 'worker' },
};

let _departments = null;
let _types = null;

function ensureDepartments() {
  if (!_departments) {
    const stored = load('departments');
    _departments = Array.isArray(stored) && stored.length ? stored : [...SEED_DEPARTMENTS];
    if (!Array.isArray(stored) || !stored.length) save('departments', _departments);
  }
}

function ensureTypes() {
  if (!_types) {
    const stored = load('personnelTypes');
    if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
      _types = stored;
    } else {
      _types = {};
      Object.entries(SEED_TYPES).forEach(([k, v]) => _types[k] = { ...v });
    }
    if (!stored) save('personnelTypes', _types);
  }
}

function refreshExports() {
  ensureDepartments();
  ensureTypes();
  DEPARTMENTS.length = 0;
  _departments.forEach(d => DEPARTMENTS.push(d));
  Object.keys(PERSONNEL_TYPES).forEach(k => { if (!_types[k]) delete PERSONNEL_TYPES[k]; });
  Object.entries(_types).forEach(([k, v]) => PERSONNEL_TYPES[k] = v);
}

export function getDepartments() { ensureDepartments(); return [..._departments]; }

export function addDepartment(name) {
  ensureDepartments();
  const t = name.trim();
  if (!t || _departments.some(d => d.toLowerCase() === t.toLowerCase())) return false;
  _departments.push(t);
  save('departments', _departments);
  refreshExports();
  return true;
}

export function updateDepartment(oldName, newName) {
  ensureDepartments();
  const t = newName.trim();
  if (!t || oldName === t) return true;
  if (_departments.some(d => d.toLowerCase() === t.toLowerCase() && d !== oldName)) return false;
  const i = _departments.indexOf(oldName);
  if (i < 0) return false;
  _departments[i] = t;
  save('departments', _departments);
  personnel.filter(p => p.department === oldName).forEach(p => p.department = t);
  save('personnel', personnel);
  users.filter(u => u.department === oldName).forEach(u => u.department = t);
  save('users', users);
  refreshExports();
  return true;
}

export function deleteDepartment(name) {
  ensureDepartments();
  const count = personnel.filter(p => p.department === name && p.status === 'active').length;
  if (count > 0) return { ok: false, count };
  _departments = _departments.filter(d => d !== name);
  save('departments', _departments);
  refreshExports();
  return { ok: true };
}

export function getPersonnelTypes() { ensureTypes(); const copy = {}; Object.entries(_types).forEach(([k, v]) => copy[k] = { ...v }); return copy; }

export function addPersonnelType(key, data) {
  ensureTypes();
  const k = key.trim().toLowerCase().replace(/\s+/g, '_');
  if (!k || _types[k]) return false;
  _types[k] = { ...data };
  save('personnelTypes', _types);
  refreshExports();
  return true;
}

export function updatePersonnelType(key, data) {
  ensureTypes();
  if (!_types[key]) return false;
  _types[key] = { ..._types[key], ...data };
  save('personnelTypes', _types);
  refreshExports();
  return true;
}

export function deletePersonnelType(key) {
  ensureTypes();
  if (!_types[key]) return false;
  const count = personnel.filter(p => p.type === key && p.status === 'active').length;
  if (count > 0) return { ok: false, count };
  delete _types[key];
  save('personnelTypes', _types);
  refreshExports();
  return { ok: true };
}

// Backward-compatible exported arrays (refreshed on initState)
export let DEPARTMENTS = [...SEED_DEPARTMENTS];
export let PERSONNEL_TYPES = {};
Object.entries(SEED_TYPES).forEach(([k, v]) => PERSONNEL_TYPES[k] = { ...v });

// ===== MESAI PROFİLLERİ (WORK PROFILES) =====
export const WORK_PROFILES = {
  'isci_standart': {
    name: 'Standart İşçi', desc: 'Temizlik, yemekhane, genel hizmet', icon: '🔧', weeklyHours: 45, category: 'worker',
    shifts: { 7.5: { label: 'Nöbet (7.5s)', breakMin: 0, record: 8 }, 8: { label: 'Normal Mesai (8s)', breakMin: 0, record: 8 }, 9: { label: '9 Saatlik Vardiya', breakMin: 60, record: 8 }, 12: { label: '12 Saatlik Vardiya', breakMin: 60, record: 11 } }
  },
  'memur_standart': {
    name: 'Standart Memur', desc: 'İdari, sekreterya, ofis çalışanları', icon: '📋', weeklyHours: 40, category: 'officer',
    shifts: { 7.5: { label: 'Nöbet (7.5s)', breakMin: 0, record: 8 }, 8: { label: 'Normal Mesai (8s)', breakMin: 0, record: 8 }, 9: { label: '9 Saatlik Vardiya', breakMin: 60, record: 8 }, 12: { label: '12 Saatlik Vardiya', breakMin: 60, record: 11 } }
  },
  'hemşire': {
    name: 'Hemşire', desc: 'Servis ve klinik hemşireleri (30dk mola)', icon: '👩‍⚕️', weeklyHours: 40, category: 'officer',
    shifts: { 7.5: { label: 'Nöbet (7.5s)', breakMin: 0, record: 8 }, 8: { label: 'Normal Mesai (8s)', breakMin: 30, record: 7.5 }, 9: { label: '9 Saatlik Vardiya', breakMin: 60, record: 8 }, 12: { label: '12 Saatlik Vardiya', breakMin: 60, record: 11 } }
  },
  'doktor': {
    name: 'Doktor', desc: 'Uzman ve pratisyen doktorlar (30dk mola)', icon: '🩺', weeklyHours: 40, category: 'officer',
    shifts: { 7.5: { label: 'Nöbet (7.5s)', breakMin: 0, record: 8 }, 8: { label: 'Normal Mesai (8s)', breakMin: 30, record: 7.5 }, 9: { label: '9 Saatlik Vardiya', breakMin: 60, record: 8 }, 12: { label: '12 Saatlik Vardiya', breakMin: 60, record: 11 } }
  },
  'guvenlik': {
    name: 'Güvenlik Görevlisi', desc: '7/24 vardiya sistemi', icon: '🛡️', weeklyHours: 45, category: 'worker',
    shifts: { 7.5: { label: 'Nöbet (7.5s)', breakMin: 0, record: 8 }, 8: { label: 'Normal Mesai (8s)', breakMin: 0, record: 8 }, 9: { label: '9 Saatlik Vardiya', breakMin: 60, record: 8 }, 12: { label: '12 Saatlik Vardiya', breakMin: 60, record: 11 } }
  },
  'teknik': {
    name: 'Teknik Personel', desc: 'Elektrik, tesisat, bilgi işlem', icon: '🔧', weeklyHours: 45, category: 'worker',
    shifts: { 7.5: { label: 'Nöbet (7.5s)', breakMin: 0, record: 8 }, 8: { label: 'Normal Mesai (8s)', breakMin: 0, record: 8 }, 9: { label: '9 Saatlik Vardiya', breakMin: 60, record: 8 }, 12: { label: '12 Saatlik Vardiya', breakMin: 60, record: 11 } }
  },
};

export function getDefaultProfileForType(type) {
  const map = { worker: 'isci_standart', officer: 'memur_standart', nurse: 'hemşire', doctor: 'doktor', security: 'guvenlik', technical: 'teknik' };
  return map[type] || 'isci_standart';
}

export function getProfileForPersonnel(personId) {
  const p = personnel.find(x => x.id === personId);
  if (!p) return WORK_PROFILES['isci_standart'];
  return WORK_PROFILES[p.workProfile] || WORK_PROFILES[getDefaultProfileForType(p.type)];
}

export function calculateShiftHours(profileId, durationHours) {
  const profile = WORK_PROFILES[profileId] || WORK_PROFILES['isci_standart'];
  const rule = profile.shifts[durationHours];
  return rule ? rule.record : durationHours;
}

export function getShiftDurationOptions(profileId) {
  const profile = WORK_PROFILES[profileId] || WORK_PROFILES['isci_standart'];
  return Object.entries(profile.shifts).map(([dur, rule]) => ({
    duration: parseFloat(dur), label: rule.label, breakMin: rule.breakMin, record: rule.record,
  }));
}

// ===== 35 GERÇEKÇİ PERSONEL =====
const SEED_PERSONNEL = [
  { id: 1,  name: 'Zeynep',   surname: 'Arslan',   tc: '10000000001', phone: '0532 111 00 01', email: 'zeynep.arslan@hastane.gov.tr',   address: 'Atatürk Mah. Cumhuriyet Cad. No:12 D:3, Merkez',   department: 'Dahiliye',       type: 'doctor',    title: 'Uzman Doktor',            startDate: '2016-08-15', status: 'active', education: 'Tıp Fakültesi', certificates: ['İç Hastalıkları Uzmanlık', 'Kardiyoloji Sertifikası'], leaveBalance: 14, leaveUsed: 3 },
  { id: 2,  name: 'Ali',      surname: 'Öztürk',    tc: '10000000002', phone: '0532 111 00 02', email: 'ali.ozturk@hastane.gov.tr',     address: 'İstiklal Mah. Millet Sok. No:8, Merkez',           department: 'Cerrahi',        type: 'doctor',    title: 'Başhekim Yardımcısı',     startDate: '2014-03-01', status: 'active', education: 'Tıp Fakültesi', certificates: ['Genel Cerrahi Uzmanlık'], leaveBalance: 14, leaveUsed: 7 },
  { id: 3,  name: 'Hüseyin',  surname: 'Korkmaz',   tc: '10000000003', phone: '0532 111 00 03', email: 'huseyin.korkmaz@hastane.gov.tr', address: 'Fatih Mah. Sağlık Sok. No:5, Merkez',             department: 'Acil Servis',    type: 'doctor',    title: 'Acil Tıp Uzmanı',         startDate: '2018-06-10', status: 'active', education: 'Tıp Fakültesi', certificates: ['Acil Tıp Uzmanlık', 'İlk Yardım Sertifikası'], leaveBalance: 14, leaveUsed: 5 },
  { id: 4,  name: 'Selin',    surname: 'Acar',      tc: '10000000004', phone: '0532 111 00 04', email: 'selin.acar@hastane.gov.tr',     address: 'Yıldız Mah. Güneş Cad. No:22, Merkez',            department: 'Çocuk Sağlığı',  type: 'doctor',    title: 'Çocuk Hastalıkları Uzm.',  startDate: '2019-01-15', status: 'active', education: 'Tıp Fakültesi', certificates: ['Pediatri Uzmanlık'], leaveBalance: 14, leaveUsed: 2 },
  { id: 5,  name: 'Murat',    surname: 'Balcı',     tc: '10000000005', phone: '0532 111 00 05', email: 'murat.balci@hastane.gov.tr',    address: 'Bahçelievler Mah. 10. Sok. No:15, Merkez',        department: 'Göz',            type: 'doctor',    title: 'Göz Hastalıkları Uzm.',   startDate: '2017-09-01', status: 'active', education: 'Tıp Fakültesi', certificates: ['Oftalmoloji Uzmanlık'], leaveBalance: 14, leaveUsed: 4 },
  { id: 6,  name: 'Deniz',    surname: 'Koç',       tc: '10000000006', phone: '0532 111 00 06', email: 'deniz.koc@hastane.gov.tr',      address: 'Çamlıca Mah. Hastane Cad. No:3, Merkez',          department: 'KBB',            type: 'doctor',    title: 'KBB Uzmanı',              startDate: '2020-02-20', status: 'active', education: 'Tıp Fakültesi', certificates: ['KBB Uzmanlık'], leaveBalance: 14, leaveUsed: 6 },
  { id: 7,  name: 'Ayşe',     surname: 'Demir',     tc: '20000000001', phone: '0535 222 00 01', email: 'ayse.demir@hastane.gov.tr',     address: 'Sağlık Mah. Hemşire Sok. No:4, Merkez',           department: 'Hemşirelik',     type: 'nurse',     title: 'Başhemşire',              startDate: '2015-04-01', status: 'active', education: 'Hemşirelik MYO', certificates: ['Başhemşirelik Sertifikası', 'İlk Yardım'], leaveBalance: 14, leaveUsed: 8 },
  { id: 8,  name: 'Emine',    surname: 'Özdemir',   tc: '20000000002', phone: '0535 222 00 02', email: 'emine.ozdemir@hastane.gov.tr',  address: 'Yeni Mah. 3. Cad. No:18, Merkez',                  department: 'Hemşirelik',     type: 'nurse',     title: 'Hemşire',                 startDate: '2020-09-01', status: 'active', education: 'Hemşirelik MYO', certificates: ['Hemşirelik Lisans'], leaveBalance: 14, leaveUsed: 2 },
  { id: 9,  name: 'Merve',    surname: 'Şahin',     tc: '20000000003', phone: '0535 222 00 03', email: 'merve.sahin@hastane.gov.tr',    address: 'Kurtuluş Mah. Hastane Cad. No:7, Merkez',         department: 'Acil Servis',    type: 'nurse',     title: 'Acil Hemşiresi',          startDate: '2019-03-15', status: 'active', education: 'Hemşirelik Fakültesi', certificates: ['Acil Bakım Sertifikası'], leaveBalance: 14, leaveUsed: 4 },
  { id: 10, name: 'Burcu',    surname: 'Yıldırım',  tc: '20000000004', phone: '0535 222 00 04', email: 'burcu.yildirim@hastane.gov.tr', address: 'Cumhuriyet Mah. 5. Sok. No:11, Merkez',           department: 'Yoğun Bakım',    type: 'nurse',     title: 'Yoğun Bakım Hemşiresi',   startDate: '2018-07-01', status: 'active', education: 'Hemşirelik Fakültesi', certificates: ['Yoğun Bakım Sertifikası', 'Mekanik Ventilasyon'], leaveBalance: 14, leaveUsed: 6 },
  { id: 11, name: 'Gülşah',   surname: 'Tanrıverdi',tc: '20000000005', phone: '0535 222 00 05', email: 'gulsah.tanriverdi@hastane.gov.tr', address: 'Özgürlük Mah. 2. Cad. No:9, Merkez',            department: 'Ameliyathane',   type: 'nurse',     title: 'Ameliyathane Hemşiresi',  startDate: '2021-01-10', status: 'active', education: 'Hemşirelik MYO', certificates: ['Ameliyathane Hemşireliği'], leaveBalance: 14, leaveUsed: 1 },
  { id: 12, name: 'Derya',    surname: 'Ersoy',     tc: '20000000006', phone: '0535 222 00 06', email: 'derya.ersoy@hastane.gov.tr',    address: 'Barış Mah. Sağlık Sok. No:14, Merkez',           department: 'Kadın Doğum',    type: 'nurse',     title: 'Ebe',                     startDate: '2017-11-20', status: 'active', education: 'Ebelik MYO', certificates: ['Ebelik Sertifikası', 'Doğuma Hazırlık'], leaveBalance: 14, leaveUsed: 5 },
  { id: 13, name: 'Pınar',    surname: 'Güneş',     tc: '20000000007', phone: '0535 222 00 07', email: 'pinar.gunes@hastane.gov.tr',    address: 'Yeşilyurt Mah. Fizik Cad. No:6, Merkez',         department: 'Fizik Tedavi',   type: 'nurse',     title: 'Fizyoterapi Teknikeri',   startDate: '2022-05-01', status: 'active', education: 'Fizik Tedavi MYO', certificates: ['Fizyoterapi Sertifikası'], leaveBalance: 14, leaveUsed: 3 },
  { id: 14, name: 'Cansu',    surname: 'Başaran',   tc: '20000000008', phone: '0535 222 00 08', email: 'cansu.basaran@hastane.gov.tr',  address: 'Güzelyurt Mah. 8. Sok. No:20, Merkez',           department: 'Dahiliye',       type: 'nurse',     title: 'Servis Hemşiresi',        startDate: '2023-02-15', status: 'active', education: 'Hemşirelik MYO', certificates: [], leaveBalance: 14, leaveUsed: 0 },
  { id: 15, name: 'Ahmet',    surname: 'Yılmaz',    tc: '30000000001', phone: '0542 333 00 01', email: '', address: 'Sanayi Mah. Temizlik Cad. No:2, Merkez',         department: 'Temizlik',       type: 'worker',    title: 'Temizlik Görevlisi',     startDate: '2020-03-15', status: 'active', education: 'Lise', certificates: ['Hijyen Sertifikası'], leaveBalance: 14, leaveUsed: 4 },
  { id: 16, name: 'İbrahim',  surname: 'Kılıç',     tc: '30000000002', phone: '0542 333 00 02', email: '', address: 'Esentepe Mah. 4. Sok. No:8, Merkez',              department: 'Temizlik',       type: 'worker',    title: 'Temizlik Görevlisi',     startDate: '2021-05-15', status: 'active', education: 'Lise', certificates: [], leaveBalance: 14, leaveUsed: 2 },
  { id: 17, name: 'Osman',    surname: 'Çetin',     tc: '30000000003', phone: '0542 333 00 03', email: '', address: 'Yenidoğan Mah. 6. Cad. No:15, Merkez',            department: 'Temizlik',       type: 'worker',    title: 'Temizlik Şefi',          startDate: '2018-01-10', status: 'active', education: 'Lise', certificates: ['Hijyen Sertifikası', 'İş Güvenliği'], leaveBalance: 14, leaveUsed: 6 },
  { id: 18, name: 'Ramazan',  surname: 'Polat',     tc: '30000000004', phone: '0542 333 00 04', email: '', address: 'Bahçelievler Mah. 2. Sok. No:9, Merkez',          department: 'Temizlik',       type: 'worker',    title: 'Temizlik Görevlisi',     startDate: '2022-08-01', status: 'active', education: 'Lise', certificates: [], leaveBalance: 14, leaveUsed: 1 },
  { id: 19, name: 'Kemal',    surname: 'Doğan',     tc: '30000000005', phone: '0542 333 00 05', email: '', address: 'Gazi Mah. 7. Cad. No:22, Merkez',                 department: 'Temizlik',       type: 'worker',    title: 'Temizlik Görevlisi',     startDate: '2023-04-20', status: 'active', education: 'Lise', certificates: [], leaveBalance: 14, leaveUsed: 0 },
  { id: 20, name: 'Fatma',    surname: 'Kaya',      tc: '40000000001', phone: '0544 444 00 01', email: 'fatma.kaya@hastane.gov.tr',     address: 'Yeni Mah. Hizmet Sok. No:5, Merkez',           department: 'Temizlik',       type: 'officer',   title: 'Hizmetli',               startDate: '2019-06-01', status: 'active', education: 'Lise', certificates: ['Hijyen Sertifikası'], leaveBalance: 14, leaveUsed: 3 },
  { id: 21, name: 'Elif',     surname: 'Yıldız',    tc: '40000000002', phone: '0544 444 00 02', email: 'elif.yildiz@hastane.gov.tr',    address: 'Atatürk Mah. İdari Cad. No:1, Merkez',         department: 'İdari',          type: 'officer',   title: 'Müdür Yardımcısı',       startDate: '2015-11-20', status: 'active', education: 'İktisat Fakültesi', certificates: ['Yönetim Sertifikası', 'KKP'], leaveBalance: 14, leaveUsed: 9 },
  { id: 22, name: 'Hatice',   surname: 'Erdoğan',   tc: '40000000003', phone: '0544 444 00 03', email: 'hatice.erdogan@hastane.gov.tr', address: 'Fatih Mah. Mutfak Sok. No:3, Merkez',          department: 'Mutfak',         type: 'officer',   title: 'Aşçıbaşı',               startDate: '2019-02-10', status: 'active', education: 'MYO Aşçılık', certificates: ['Aşçılık Sertifikası', 'Hijyen'], leaveBalance: 14, leaveUsed: 5 },
  { id: 23, name: 'Sibel',    surname: 'Avci',      tc: '40000000004', phone: '0544 444 00 04', email: 'sibel.avci@hastane.gov.tr',     address: 'İstiklal Mah. Sekreter Cad. No:8, Merkez',      department: 'İdari',          type: 'officer',   title: 'Sekreter',               startDate: '2021-07-01', status: 'active', education: 'Büro Yönetimi MYO', certificates: ['Bilgisayar Sertifikası'], leaveBalance: 14, leaveUsed: 2 },
  { id: 24, name: 'Mustafa',  surname: 'Şahin',     tc: '50000000001', phone: '0546 555 00 01', email: 'mustafa.sahin@hastane.gov.tr',  address: 'Güvenlik Mah. Koruma Cad. No:1, Merkez',        department: 'Güvenlik',       type: 'security',  title: 'Güvenlik Amiri',         startDate: '2019-01-05', status: 'active', education: 'MYO Güvenlik', certificates: ['Silahlı Güvenlik', 'KKP'], leaveBalance: 14, leaveUsed: 4 },
  { id: 25, name: 'Serkan',   surname: 'Uysal',     tc: '50000000002', phone: '0546 555 00 02', email: '', address: 'Kale Mah. Güvenlik Sok. No:7, Merkez',            department: 'Güvenlik',       type: 'security',  title: 'Güvenlik Görevlisi',     startDate: '2021-09-15', status: 'active', education: 'Lise', certificates: ['Silahsız Güvenlik'], leaveBalance: 14, leaveUsed: 2 },
  { id: 26, name: 'Emre',     surname: 'Taş',       tc: '50000000003', phone: '0546 555 00 03', email: '', address: 'Yıldırım Mah. 3. Cad. No:12, Merkez',             department: 'Güvenlik',       type: 'security',  title: 'Güvenlik Görevlisi',     startDate: '2022-11-01', status: 'active', education: 'Lise', certificates: ['Silahsız Güvenlik'], leaveBalance: 14, leaveUsed: 1 },
  { id: 27, name: 'Hasan',    surname: 'Aydın',     tc: '60000000001', phone: '0548 666 00 01', email: 'hasan.aydin@hastane.gov.tr',    address: 'Sanayi Mah. Teknik Cad. No:4, Merkez',          department: 'Teknik Servis',  type: 'technical', title: 'Teknik Şef',             startDate: '2017-07-10', status: 'active', education: 'MYO Elektrik', certificates: ['Elektrik Tesisat', 'İş Güvenliği'], leaveBalance: 14, leaveUsed: 7 },
  { id: 28, name: 'Yusuf',    surname: 'Karadağ',   tc: '60000000002', phone: '0548 666 00 02', email: '', address: 'Organize Sanayi Mah. No:8, Merkez',               department: 'Teknik Servis',  type: 'technical', title: 'Elektrik Teknisyeni',    startDate: '2020-03-01', status: 'active', education: 'MYO Elektrik', certificates: ['Elektrik Tesisat'], leaveBalance: 14, leaveUsed: 3 },
  { id: 29, name: 'Volkan',   surname: 'IŞIK',      tc: '60000000003', phone: '0548 666 00 03', email: 'volkan.isik@hastane.gov.tr',    address: 'Bilişim Mah. Yazılım Cad. No:6, Merkez',        department: 'Teknik Servis',  type: 'technical', title: 'Bilgi İşlem Teknisyeni', startDate: '2021-10-15', status: 'active', education: 'MYO Bilgisayar', certificates: ['A+', 'Network+'], leaveBalance: 14, leaveUsed: 1 },
  { id: 30, name: 'Gökhan',   surname: 'Eren',      tc: '60000000004', phone: '0548 666 00 04', email: '', address: 'Tesisat Mah. 5. Cad. No:11, Merkez',               department: 'Teknik Servis',  type: 'technical', title: 'Tesisat Teknisyeni',     startDate: '2022-06-01', status: 'active', education: 'MYO Makine', certificates: ['Tesisat Sertifikası'], leaveBalance: 14, leaveUsed: 2 },
  { id: 31, name: 'Nazlı',    surname: 'Birkan',    tc: '70000000001', phone: '0530 777 00 01', email: 'nazli.birkan@hastane.gov.tr',   address: 'Laboratuvar Mah. Bilim Cad. No:2, Merkez',      department: 'Laboratuvar',    type: 'officer',   title: 'Laborant',               startDate: '2018-04-01', status: 'active', education: 'MYO Laborant', certificates: ['Laboratuvar Güvenliği'], leaveBalance: 14, leaveUsed: 5 },
  { id: 32, name: 'Gizem',    surname: 'Sönmez',    tc: '70000000002', phone: '0530 777 00 02', email: 'gizem.sonmez@hastane.gov.tr',   address: 'Eczane Mah. İlaç Cad. No:4, Merkez',            department: 'Eczane',         type: 'officer',   title: 'Eczacı',                 startDate: '2019-08-15', status: 'active', education: 'Eczacılık Fakültesi', certificates: ['Eczacı Sertifikası'], leaveBalance: 14, leaveUsed: 3 },
  { id: 33, name: 'Büşra',    surname: 'Kaplan',    tc: '70000000003', phone: '0530 777 00 03', email: 'busra.kaplan@hastane.gov.tr',   address: 'Radyoloji Mah. Görüntü Cad. No:3, Merkez',      department: 'Radyoloji',      type: 'officer',   title: 'Radyoloji Teknikeri',    startDate: '2020-01-10', status: 'active', education: 'MYO Radyoloji', certificates: ['Radyoloji Güvenliği'], leaveBalance: 14, leaveUsed: 2 },
  { id: 34, name: 'Recep',    surname: 'Şimşek',    tc: '80000000001', phone: '0538 888 00 01', email: '', address: 'Mutfak Mah. Yemek Cad. No:1, Merkez',              department: 'Mutfak',         type: 'worker',    title: 'Aşçı',                   startDate: '2020-05-01', status: 'active', education: 'Aşçılık MYO', certificates: ['Hijyen Sertifikası', 'Aşçılık'], leaveBalance: 14, leaveUsed: 4 },
  { id: 35, name: 'Orhan',    surname: 'Güler',     tc: '80000000002', phone: '0538 888 00 02', email: '', address: 'Mutfak Mah. Yemek Sok. No:5, Merkez',              department: 'Mutfak',         type: 'worker',    title: 'Bulaşıkçı',              startDate: '2023-01-15', status: 'active', education: 'İlkokul', certificates: [], leaveBalance: 14, leaveUsed: 0 },
];

const SEED_USERS = [
  ADMIN_USER,
  { username: 'drarslan',     password: 'dr123',   role: 'supervisor', name: 'Dr. Zeynep Arslan',  department: 'Dahiliye' },
  { username: 'hemsireayse',  password: 'hem123',  role: 'supervisor', name: 'Ayşe Demir',         department: 'Hemşirelik' },
  { username: 'guvenlik24',   password: 'giv123',  role: 'supervisor', name: 'Mustafa Şahin',      department: 'Güvenlik' },
  { username: 'temizlik17',   password: 'tem123',  role: 'supervisor', name: 'Osman Çetin',        department: 'Temizlik' },
  { username: 'okuyucu1',     password: 'ok123',   role: 'viewer',     name: 'Misafir Kullanıcı',  department: null },
];

let currentUser = null;
let personnel = [];
let users = [];
let schedules = [];
let attendanceRecords = [];
let nextId = { p: 36, s: 1, a: 1 };

const save = (key, data) => {
  try { localStorage.setItem(`hospital_${key}`, JSON.stringify(data)); } catch (error) {
    console.error(`[Hastane PYS] ${key} kaydedilemedi`, error);
  }
};
const load = (key) => { try { return JSON.parse(localStorage.getItem(`hospital_${key}`)); } catch { return null; } };

export function initState() {
  const existingPersonnel = load('personnel');
  if (Array.isArray(existingPersonnel) && existingPersonnel.length >= 35) {
    personnel = existingPersonnel;
  } else {
    personnel = [...SEED_PERSONNEL];
    save('personnel', personnel);
  }
  let migrated = false;
  personnel.forEach(p => {
    if (!p.workProfile) { p.workProfile = getDefaultProfileForType(p.type); migrated = true; }
  });
  if (migrated) save('personnel', personnel);
  // Migration: add birthDate, bloodType, emergencyContacts, gender
  let fieldMigrated = false;
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];
  const femaleNames = ['Zeynep','Ayşe','Emine','Merve','Burcu','Gülşah','Derya','Pınar','Cansu','Fatma','Elif','Hatice','Sibel','Nazlı','Gizem','Büşra'];
  personnel.forEach(p => {
    if (!p.birthDate) {
      const baseYear = p.startDate ? parseInt(p.startDate.substring(0,4)) : 2020;
      const age = 25 + Math.floor(Math.random() * 20);
      const year = baseYear - age;
      p.birthDate = year + '-' + String(Math.floor(Math.random()*12)+1).padStart(2,'0') + '-' + String(Math.floor(Math.random()*28)+1).padStart(2,'0');
      fieldMigrated = true;
    }
    if (!p.bloodType) { p.bloodType = bloodTypes[Math.floor(Math.random()*bloodTypes.length)]; fieldMigrated = true; }
    if (!p.emergencyContacts) { p.emergencyContacts = []; fieldMigrated = true; }
    if (!p.gender) { p.gender = femaleNames.includes(p.name) ? 'female' : 'male'; fieldMigrated = true; }
  });
  if (fieldMigrated) save('personnel', personnel);
  // Seed emergency contacts for first 10 people if empty
  personnel.slice(0,10).forEach(p => {
    if (p.emergencyContacts && p.emergencyContacts.length === 0) {
      const relations = ['Eş','Anne','Baba','Kardeş','Çocuk'];
      p.emergencyContacts = [
        { name: p.name === 'Zeynep' ? 'Murat Arslan' : p.name + ' Yakını', relation: relations[Math.floor(Math.random()*3)], phone: '053'+String(Math.floor(Math.random()*9)+1)+' '+String(Math.floor(Math.random()*900)+100)+' '+String(Math.floor(Math.random()*90)+10)+' '+String(Math.floor(Math.random()*90)+10) },
      ];
      fieldMigrated = true;
    }
  });
  if (fieldMigrated) save('personnel', personnel);
  const storedUsers = load('users');
  users = Array.isArray(storedUsers) ? storedUsers : [...SEED_USERS];
  let usersMigrated = !Array.isArray(storedUsers);
  const protectedUser = users.find(user => user.username === SUPER_ADMIN_USERNAME);
  if (!protectedUser) { users.unshift({ ...ADMIN_USER }); usersMigrated = true; }
  users = users.map(user => {
    if (user.username === SUPER_ADMIN_USERNAME) {
      const normalized = { ...user, ...ADMIN_USER, permissions: ['read', 'write', 'manage_users', 'manage_all', 'manage_schedule', 'manage_leave', 'manage_attendance', 'manage_personnel', 'manage_settings', 'manage_security', 'manage_governance'] };
      if (JSON.stringify(normalized) !== JSON.stringify(user)) usersMigrated = true;
      return normalized;
    }
    if (user.role === 'admin') { usersMigrated = true; return { ...user, role: 'supervisor', department: user.department || 'İdari' }; }
    return user;
  });
  const storedSchedules = load('schedules');
  schedules = Array.isArray(storedSchedules) ? storedSchedules : [];
  const storedAttendance = load('attendance');
  attendanceRecords = Array.isArray(storedAttendance) ? storedAttendance : [];
  if (!Array.isArray(storedUsers) || usersMigrated) save('users', users);
  const storedSession = load('hospital_session');
  const sessionUser = storedSession?.username ? users.find(user => user.username === storedSession.username) : null;
  if (sessionUser) save('hospital_session', sessionUser);
  if (!Array.isArray(storedSchedules)) save('schedules', schedules);
  if (!Array.isArray(storedAttendance)) save('attendance', attendanceRecords);
  // Initialize dynamic departments/types from localStorage
  ensureDepartments();
  ensureTypes();
  refreshExports();
  generateSchedules();
}

function generateSchedules() {
  if (schedules.length > 0) return;
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = (d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const nurses = personnel.filter(p => p.type === 'nurse');
  const cleaners = personnel.filter(p => p.type === 'worker' || (p.type === 'officer' && p.department === 'Temizlik'));
  const security = personnel.filter(p => p.type === 'security');
  const doctors = personnel.filter(p => p.type === 'doctor');
  nurses.forEach((p, i) => { for (let d = 1; d <= days; d++) { if ((d + i) % 4 === 0) continue; schedules.push({ id: nextId.s++, personnelId: p.id, department: p.department, date: dateStr(d), shift: ['morning', 'evening', 'night'][(d + i) % 3], type: 'nurse', duration: 8 }); } });
  cleaners.forEach((p, i) => { for (let d = 1; d <= days; d++) { if ((d + i) % 6 === 0) continue; schedules.push({ id: nextId.s++, personnelId: p.id, department: 'Temizlik', date: dateStr(d), shift: (d + i) % 2 === 0 ? 'morning' : 'evening', type: 'cleaning', duration: 8 }); } });
  security.forEach((p, i) => { for (let d = 1; d <= days; d++) { schedules.push({ id: nextId.s++, personnelId: p.id, department: 'Güvenlik', date: dateStr(d), shift: ['morning', 'evening', 'night'][(d + i) % 3], type: 'security', duration: 8 }); } });
  doctors.forEach((p, i) => { for (let d = 1; d <= days; d++) { if ((d + i) % 5 === 0) continue; const shift = p.department === 'Acil Servis' ? ['morning', 'evening', 'night'][(d + i) % 3] : ((d + i) % 3 === 0 ? 'night' : 'morning'); schedules.push({ id: nextId.s++, personnelId: p.id, department: p.department, date: dateStr(d), shift, type: 'doctor', duration: 8 }); } });
  const activePersonnel = personnel.filter(p => p.status === 'active');
  activePersonnel.forEach((p, i) => { const weeklyH = PERSONNEL_TYPES[p.type]?.weeklyHours || 40; const dailyH = weeklyH / 5; for (let d = Math.max(1, days - 14); d <= days; d++) { const date = dateStr(d); const dayOfWeek = new Date(y, m, d).getDay(); if (dayOfWeek === 0 || dayOfWeek === 6) continue; const isOvertime = (i + d) % 7 === 0; const hours = isOvertime ? dailyH + 2 : dailyH; attendanceRecords.push({ id: nextId.a++, personnelId: p.id, date, hours: Math.round(hours * 10) / 10, note: isOvertime ? 'Fazla mesai' : 'Normal mesai' }); } });
  save('schedules', schedules);
  save('attendance', attendanceRecords);
}

// ===== AUTH =====
export function login(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (user) { currentUser = user; localStorage.setItem('hospital_session', JSON.stringify(user)); return { ok: true, user }; }
  return { ok: false, error: 'Kullanıcı adı veya şifre hatalı' };
}
export function logout() { currentUser = null; localStorage.removeItem('hospital_session'); }
export function getCurrentUser() {
  if (!currentUser) { const s = load('hospital_session'); if (s) currentUser = s; }
  return currentUser;
}
export function isSuperAdmin(user = getCurrentUser()) { return user?.username === SUPER_ADMIN_USERNAME && user?.role === 'admin'; }
export function hasPermission(perm) { const u = getCurrentUser(); if (!u) return false; if (isSuperAdmin(u)) return true; return Boolean(ROLES[u.role]?.permissions.includes(perm)); }

// ===== PERSONNEL CRUD =====
export function getPersonnel(f = {}) {
  let r = [...personnel];
  if (f.department) r = r.filter(p => p.department === f.department);
  if (f.type) r = r.filter(p => p.type === f.type);
  if (f.status) r = r.filter(p => p.status === f.status);
  if (f.search) { const s = f.search.toLowerCase(); r = r.filter(p => `${p.name} ${p.surname}`.toLowerCase().includes(s) || p.tc.includes(s) || p.phone.includes(s) || p.title.toLowerCase().includes(s)); }
  return r;
}
export function addPersonnel(d) { const p = { ...d, id: nextId.p++, status: 'active' }; personnel.push(p); save('personnel', personnel); return p; }
export function updatePersonnel(id, d) { const i = personnel.findIndex(p => p.id === id); if (i >= 0) { personnel[i] = { ...personnel[i], ...d }; save('personnel', personnel); return personnel[i]; } return null; }
export function deletePersonnel(id) { personnel = personnel.filter(p => p.id !== id); save('personnel', personnel); }

// ===== USERS =====
export function getUsers() { return [...users]; }
export function addUser(d) { users.push(d); save('users', users); }
export function deleteUser(u) { users = users.filter(x => x.username !== u); save('users', users); }
export function updateUser(username, data) {
  const idx = users.findIndex(u => u.username === username);
  if (idx < 0) return false;
  users[idx] = { ...users[idx], ...data };
  save('users', users);
  if (currentUser && currentUser.username === username) currentUser = users[idx];
  return true;
}

export function getDepartmentPersonnel(dept) {
  return personnel.filter(p => p.department === dept && p.status === 'active');
}

// ===== SCHEDULES =====
export function getSchedules(f = {}) {
  let r = [...schedules];
  if (f.type) r = r.filter(s => s.type === f.type);
  if (f.month) r = r.filter(s => s.date.startsWith(f.month));
  if (f.date) r = r.filter(s => s.date === f.date);
  if (f.personnelId) r = r.filter(s => s.personnelId === f.personnelId);
  return r;
}
export function addSchedule(d) {
  const duration = d.duration || 8;
  const person = personnel.find(p => p.id === d.personnelId);
  const profileId = person?.workProfile || getDefaultProfileForType(person?.type || 'worker');
  const puantajHours = calculateShiftHours(profileId, duration);
  const s = { ...d, id: nextId.s++, duration, puantajHours };
  schedules.push(s);
  save('schedules', schedules);
  return s;
}
export function getSchedulePuantaj(personnelId, month) {
  const monthSchedules = schedules.filter(s => s.personnelId === personnelId && s.date.startsWith(month));
  return monthSchedules.reduce((sum, s) => sum + (s.puantajHours || s.duration || 8), 0);
}
export function deleteSchedule(id) { schedules = schedules.filter(s => s.id !== id); save('schedules', schedules); }
export function getTodaySchedules() { return schedules.filter(s => s.date === new Date().toISOString().split('T')[0]); }

// ===== ATTENDANCE =====
export function getAttendance(f = {}) {
  let r = [...attendanceRecords];
  if (f.personnelId) r = r.filter(a => a.personnelId === f.personnelId);
  if (f.month) r = r.filter(a => a.date.startsWith(f.month));
  if (f.date) r = r.filter(a => a.date === f.date);
  return r;
}
export function addAttendance(d) { const a = { ...d, id: nextId.a++ }; attendanceRecords.push(a); save('attendance', attendanceRecords); return a; }
export function deleteAttendance(id) { attendanceRecords = attendanceRecords.filter(a => a.id !== id); save('attendance', attendanceRecords); }

// ===== STATS =====
export function getDepartmentStats() {
  const s = {}; DEPARTMENTS.forEach(d => { s[d] = personnel.filter(p => p.department === d && p.status === 'active').length; }); return s;
}
export function getTypeStats() {
  const s = {}; Object.entries(PERSONNEL_TYPES).forEach(([k, v]) => { s[v.label] = personnel.filter(p => p.type === k && p.status === 'active').length; }); return s;
}
export function getMonthlyReport(monthStr) {
  const all = getPersonnel().filter(p => p.status === 'active');
  return all.map(p => {
    const pa = getAttendance({ personnelId: p.id, month: monthStr });
    const totalH = pa.reduce((s, a) => s + (a.hours || 0), 0);
    const profile = WORK_PROFILES[p.workProfile] || WORK_PROFILES[getDefaultProfileForType(p.type)];
    const weeklyH = profile?.weeklyHours || PERSONNEL_TYPES[p.type]?.weeklyHours || 40;
    const dailyExpected = weeklyH / 5;
    const overtimeH = pa.filter(a => a.hours > dailyExpected).reduce((s, a) => s + Math.max(0, a.hours - dailyExpected), 0);
    const scheduleH = getSchedulePuantaj(p.id, monthStr);
    const monthlyExpected = weeklyH * 4.33;
    return { ...p, totalHours: Math.round(totalH * 10) / 10, overtimeHours: Math.round(Math.max(0, overtimeH) * 10) / 10, weeklyHours: weeklyH, expectedHours: Math.round(monthlyExpected * 10) / 10, scheduleHours: Math.round(scheduleH * 10) / 10, profileName: profile?.name || 'Standart', dailyExpected: Math.round(dailyExpected * 10) / 10, status: totalH === 0 ? 'no_data' : totalH > monthlyExpected ? 'overtime' : 'normal' };
  });
}

// ===== LEAVE MANAGEMENT =====
export function getLeaveRecords(f = {}) {
  let records = load('leaveRecords') || [];
  if (f.personnelId) records = records.filter(r => r.personnelId === f.personnelId);
  if (f.year) records = records.filter(r => r.startDate.startsWith(f.year));
  if (f.status) records = records.filter(r => r.status === f.status);
  return records;
}
export function addLeaveRecord(d) {
  const records = load('leaveRecords') || [];
  const record = { ...d, id: Date.now(), createdAt: new Date().toISOString() };
  records.push(record);
  save('leaveRecords', records);
  const person = personnel.find(p => p.id === d.personnelId);
  if (person && d.status === 'approved') { person.leaveUsed = (person.leaveUsed || 0) + (d.days || 0); save('personnel', personnel); }
  return record;
}
export function updateLeaveStatus(id, status) {
  const records = load('leaveRecords') || [];
  const idx = records.findIndex(r => r.id === id);
  if (idx >= 0) {
    records[idx].status = status;
    save('leaveRecords', records);
    if (status === 'approved') { const person = personnel.find(p => p.id === records[idx].personnelId); if (person) { person.leaveUsed = (person.leaveUsed || 0) + (records[idx].days || 0); save('personnel', personnel); } }
    return records[idx];
  }
  return null;
}

// ===== DUTY BOARD HELPERS =====
export const FLOOR_ASSIGNMENTS = {
  'Zemin Kat': ['Acil Servis', 'Laboratuvar', 'Eczane'],
  '1. Kat': ['Dahiliye', 'Radyoloji'],
  '2. Kat': ['Cerrahi', 'Ameliyathane'],
  '3. Kat': ['Çocuk Sağlığı', 'Kadın Doğum'],
  '4. Kat': ['Göz', 'KBB', 'Ortopedi'],
  '5. Kat': ['Yoğun Bakım', 'Fizik Tedavi'],
  'Genel Alan': ['Temizlik', 'Güvenlik', 'Teknik Servis', 'Mutfak', 'İdari'],
};
export const SECURITY_POINTS = [
  { name: 'Ana Giriş Kapısı', icon: '🚪', required: true },
  { name: 'Acil Servis Girişi', icon: '🚑', required: true },
  { name: 'Poliklinik Girişi', icon: '🏥', required: true },
  { name: 'Otopark', icon: '🅿️', required: false },
  { name: 'Yönetim Katı', icon: '🏢', required: false },
];
export function getDutyBoardData() {
  const today = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(s => s.date === today);
  const allActive = personnel.filter(p => p.status === 'active');
  return { date: today, schedules: todaySchedules, personnel: allActive, nurses: todaySchedules.filter(s => s.type === 'nurse'), cleaning: todaySchedules.filter(s => s.type === 'cleaning'), security: todaySchedules.filter(s => s.type === 'security'), doctors: todaySchedules.filter(s => s.type === 'doctor'), floors: FLOOR_ASSIGNMENTS, securityPoints: SECURITY_POINTS };
}
export function getPersonnelById(id) {
  if (id === undefined || id === null || id === '') return null;
  const wantedId = String(id);
  return personnel.find(p => p && p.id !== undefined && String(p.id) === wantedId) || null;
}
export function getScheduleStats() {
  const today = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(s => s.date === today);
  return { total: todaySchedules.length, nurses: todaySchedules.filter(s => s.type === 'nurse').length, cleaning: todaySchedules.filter(s => s.type === 'cleaning').length, security: todaySchedules.filter(s => s.type === 'security').length, doctors: todaySchedules.filter(s => s.type === 'doctor').length };
}

// ===== CONFLICT CHECKS =====

export function checkDutyConflict(personnelId, date, excludeScheduleId = null) {
  return schedules.filter(s =>
    s.personnelId === personnelId &&
    s.date === date &&
    (excludeScheduleId === null || s.id !== excludeScheduleId)
  );
}

export function checkLeaveConflict(personnelId, date) {
  const records = load('leaveRecords') || [];
  return records.filter(r =>
    r.personnelId === personnelId &&
    r.status === 'approved' &&
    date >= r.startDate &&
    date <= r.endDate
  );
}

// ===== PASSWORD CHANGE =====

export function changePassword(username, oldPass, newPass) {
  const idx = users.findIndex(u => u.username === username);
  if (idx < 0) return { ok: false, error: 'Kullanıcı bulunamadı' };
  if (users[idx].password !== oldPass) return { ok: false, error: 'Mevcut şifre hatalı' };
  if (!newPass || newPass.length < 4) return { ok: false, error: 'Yeni şifre en az 4 karakter olmalıdır' };
  users[idx].password = newPass;
  save('users', users);
  if (currentUser && currentUser.username === username) currentUser = users[idx];
  return { ok: true };
}

// ===== OVERTIME WARNINGS =====

export function getOvertimeWarnings(monthStr) {
  const report = getMonthlyReport(monthStr);
  const warnings = [];
  report.forEach(r => {
    const profile = WORK_PROFILES[r.workProfile] || WORK_PROFILES[getDefaultProfileForType(r.type)];
    const weeklyLimit = profile?.weeklyHours || r.weeklyHours || 40;
    const monthlyLimit = weeklyLimit * 4.33;
    if (r.totalHours > monthlyLimit * 1.2) {
      warnings.push({
        ...r,
        limit: Math.round(monthlyLimit),
        overBy: Math.round(r.totalHours - monthlyLimit),
        severity: 'critical',
        message: r.name + ' ' + r.surname + ': Aylık limiti ' + Math.round(r.totalHours - monthlyLimit) + 's aştı'
      });
    } else if (r.totalHours > monthlyLimit) {
      warnings.push({
        ...r,
        limit: Math.round(monthlyLimit),
        overBy: Math.round(r.totalHours - monthlyLimit),
        severity: 'warning',
        message: r.name + ' ' + r.surname + ': Aylık limite ' + Math.round(r.totalHours - monthlyLimit) + 's yaklaştı'
      });
    }
  });
  return warnings.sort((a, b) => b.overBy - a.overBy);
}

// ===== BULK OPERATIONS =====

export function bulkCreateSchedule(entries) {
  let created = 0;
  entries.forEach(d => {
    const duration = d.duration || 8;
    const person = personnel.find(p => p.id === d.personnelId);
    const profileId = person?.workProfile || getDefaultProfileForType(person?.type || 'worker');
    const puantajHours = calculateShiftHours(profileId, duration);
    schedules.push({ ...d, id: nextId.s++, duration, puantajHours });
    created++;
  });
  save('schedules', schedules);
  return created;
}

export function bulkCreateAttendance(entries) {
  let created = 0;
  entries.forEach(d => {
    attendanceRecords.push({ ...d, id: nextId.a++ });
    created++;
  });
  save('attendance', attendanceRecords);
  return created;
}

// ===== BACKUP / RESTORE =====

export function exportAllData() {
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    personnel: personnel,
    users: users.map(u => ({ ...u, password: '***' })),
    schedules: schedules,
    attendance: attendanceRecords,
    departments: getDepartments(),
    types: getPersonnelTypes(),
    leaveRecords: load('leaveRecords') || [],
    notifications: load('hospital_notifications') || [],
  };
}

export function exportAllDataFull() {
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    personnel: personnel,
    users: users,
    schedules: schedules,
    attendance: attendanceRecords,
    departments: getDepartments(),
    types: getPersonnelTypes(),
    leaveRecords: load('leaveRecords') || [],
    notifications: load('hospital_notifications') || [],
  };
}

export function importAllData(data) {
  try {
    if (!data || !data.version) return { ok: false, error: 'Geçersiz yedek dosyası' };
    if (data.personnel) { personnel = data.personnel; save('personnel', personnel); }
    if (data.users) { users = data.users; save('users', users); }
    if (data.schedules) { schedules = data.schedules; save('schedules', schedules); }
    if (data.attendance) { attendanceRecords = data.attendance; save('attendance', attendanceRecords); }
    if (data.departments) { _departments = data.departments; save('departments', _departments); }
    if (data.types) { _types = data.types; save('personnelTypes', _types); }
    if (data.leaveRecords) save('leaveRecords', data.leaveRecords);
    if (data.notifications) save('hospital_notifications', data.notifications);
    refreshExports();
    const maxP = Math.max(...personnel.map(p => p.id), 0);
    const maxS = Math.max(...schedules.map(s => s.id), 0);
    const maxA = Math.max(...attendanceRecords.map(a => a.id), 0);
    nextId = { p: maxP + 1, s: maxS + 1, a: maxA + 1 };
    return { ok: true, counts: { personnel: personnel.length, users: users.length, schedules: schedules.length, attendance: attendanceRecords.length } };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ===== SALARY RATES =====

const DEFAULT_SALARY_RATES = {
  default: 50,
  worker: 45, officer: 50, nurse: 55, doctor: 80, security: 45, technical: 50,
  overtimeMultiplier: 1.5,
};

export function getSalaryRates() {
  return load('salaryRates') || { ...DEFAULT_SALARY_RATES };
}

export function saveSalaryRates(rates) {
  save('salaryRates', rates);
}

// ===== PERFORMANCE RECORDS =====

export function getPerformanceRecords() {
  return load('performanceRecords') || [];
}

export function savePerformanceRecords(records) {
  save('performanceRecords', records);
}

// ===== TASKS =====

export function getTasks() {
  return load('tasks') || [];
}

export function saveTasks(tasks) {
  save('tasks', tasks);
}

// ===== SURVEYS =====

export function getSurveys() {
  return load('surveys') || [];
}

export function saveSurveys(surveys) {
  save('surveys', surveys);
}

// ===== MESSAGES =====

export function getMessages() {
  return load('messages') || [];
}

export function saveMessages(messages) {
  save('messages', messages);
}

// ===== DEPARTMENT COMPARISON =====

export function getDepartmentComparison(monthStr) {
  const report = getMonthlyReport(monthStr);
  const comparison = {};
  report.forEach(r => {
    if (!comparison[r.department]) {
      comparison[r.department] = { total: 0, overtime: 0, count: 0, expected: 0, workerCount: 0, officerCount: 0 };
    }
    const d = comparison[r.department];
    d.total += r.totalHours;
    d.overtime += r.overtimeHours;
    d.expected += r.expectedHours;
    d.count++;
    if (PERSONNEL_TYPES[r.type]?.category === 'worker') d.workerCount++;
    else d.officerCount++;
  });
  Object.values(comparison).forEach(d => {
    d.avg = d.count ? Math.round((d.total / d.count) * 10) / 10 : 0;
    d.avgOvertime = d.count ? Math.round((d.overtime / d.count) * 10) / 10 : 0;
    d.utilization = d.expected ? Math.round((d.total / d.expected) * 100) : 0;
  });
  return comparison;
}

// ===== TEMPLATE-BASED SCHEDULE =====

export function generateTemplateSchedule(department, monthStr, templateType) {
  const deptPersonnel = personnel.filter(p => p.department === department && p.status === 'active');
  if (!deptPersonnel.length) return [];

  const [y, m] = monthStr.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const entries = [];

  deptPersonnel.forEach((p, i) => {
    const duration = templateType === '12h' ? 12 : templateType === '9h' ? 9 : 8;

    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m - 1, d);
      const dow = dt.getDay();
      if (dow === 0) continue;

      let shouldDuty = false;
      if (templateType === 'standard') shouldDuty = (d + i) % 5 !== 0;
      else if (templateType === 'rotation') shouldDuty = (d + i) % 4 !== 0;
      else if (templateType === '12h') shouldDuty = (d + i) % 3 !== 0;
      else if (templateType === '9h') shouldDuty = (d + i) % 5 !== 0;

      if (!shouldDuty) continue;

      const shift = templateType === '12h' ? ['morning', 'night'][(d + i) % 2] : ['morning', 'evening', 'night'][(d + i) % 3];

      entries.push({
        personnelId: p.id,
        department: p.department,
        date: monthStr + '-' + String(d).padStart(2, '0'),
        shift,
        type: p.type === 'doctor' ? 'doctor' : p.type === 'nurse' ? 'nurse' : p.type === 'security' ? 'security' : 'cleaning',
        duration,
      });
    }
  });

  return entries;
}
