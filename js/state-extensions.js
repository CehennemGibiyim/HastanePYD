// ===== STATE EXTENSIONS — 18 NEW FEATURES =====
// All new feature state functions that extend state.js
// + 12 NEW FEATURES (Faz 4-5-6)
import { getPersonnel, getPersonnelById, updatePersonnel, getLeaveRecords, getMonthlyReport, getSalaryRates, getDepartments, PERSONNEL_TYPES } from './state.js';

const save = (key, data) => localStorage.setItem('hospital_' + key, JSON.stringify(data));
const load = (key) => { try { return JSON.parse(localStorage.getItem('hospital_' + key)); } catch { return null; } };

// ===== ACIL DURUM ILETISIM KISILERI =====
export function updateEmergencyContacts(personnelId, contacts) {
  const p = getPersonnelById(personnelId);
  if (!p) return false;
  updatePersonnel(personnelId, { emergencyContacts: contacts });
  return true;
}
export function getEmergencyContacts(personnelId) {
  const p = getPersonnelById(personnelId);
  return p?.emergencyContacts || [];
}

// ===== IZIN ONAY AKISI (2 ASAMALI) =====
export function approveLeaveSupervisor(id) {
  return updateLeaveStatusWithNote(id, 'supervisor_approved');
}
export function approveLeaveAdmin(id) {
  return updateLeaveStatusWithNote(id, 'approved', true);
}
export function rejectLeave(id, reason) {
  return updateLeaveStatusWithNote(id, 'rejected', false, reason);
}
function updateLeaveStatusWithNote(id, status, countUsage, reason) {
  const records = load('leaveRecords') || [];
  const idx = records.findIndex(r => r.id === id);
  if (idx < 0) return null;
  records[idx].status = status;
  if (reason) records[idx].rejectionReason = reason;
  records[idx].updatedAt = new Date().toISOString();
  save('leaveRecords', records);
  if (countUsage && status === 'approved') {
    const p = getPersonnelById(records[idx].personnelId);
    if (p) updatePersonnel(p.id, { leaveUsed: (p.leaveUsed || 0) + (records[idx].days || 0) });
  }
  return records[idx];
}

// ===== DOGUM GUNU & IS YILDONUMU =====
export function getUpcomingBirthdays(daysAhead) {
  daysAhead = daysAhead || 30;
  const today = new Date();
  return getPersonnel({ status: 'active' }).filter(p => p.birthDate).map(p => {
    const bd = new Date(p.birthDate);
    const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
    const diff = Math.ceil((thisYear - today) / 86400000);
    return diff <= daysAhead ? { personnelId: p.id, name: p.name, surname: p.surname, department: p.department, photo: p.photo, daysUntil: diff, birthDate: p.birthDate, isToday: diff === 0 } : null;
  }).filter(Boolean).sort((a, b) => a.daysUntil - b.daysUntil);
}
export function getUpcomingAnniversaries(daysAhead) {
  daysAhead = daysAhead || 30;
  const today = new Date();
  return getPersonnel({ status: 'active' }).filter(p => p.startDate).map(p => {
    const sd = new Date(p.startDate);
    const thisYear = new Date(today.getFullYear(), sd.getMonth(), sd.getDate());
    if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
    const diff = Math.ceil((thisYear - today) / 86400000);
    if (diff > daysAhead) return null;
    const years = today.getFullYear() - sd.getFullYear();
    return { personnelId: p.id, name: p.name, surname: p.surname, department: p.department, photo: p.photo, daysUntil: diff, years: years, startDate: p.startDate, isToday: diff === 0 };
  }).filter(Boolean).sort((a, b) => a.daysUntil - b.daysUntil);
}

// ===== DEPARTMAN BUTCESI =====
export function getDepartmentBudget(dept, month) {
  return load('deptBudget_' + dept + '_' + month) || { department: dept, month, overtimeLimit: 200, recruitmentBudget: 0, notes: '' };
}
export function saveDepartmentBudget(data) {
  save('deptBudget_' + data.department + '_' + data.month, data);
}
export function getDepartmentCosts(dept, month) {
  const report = getMonthlyReport(month).filter(r => r.department === dept);
  const rates = getSalaryRates();
  let totalSalary = 0, totalOvertime = 0;
  report.forEach(r => {
    const rate = rates[r.type] || rates.default || 50;
    totalSalary += r.totalHours * rate;
    totalOvertime += r.overtimeHours * rate * (rates.overtimeMultiplier || 1.5);
  });
  return { department: dept, month, personnelCount: report.length, totalSalary: Math.round(totalSalary), totalOvertimeCost: Math.round(totalOvertime), totalCost: Math.round(totalSalary + totalOvertime), overtimeHours: Math.round(report.reduce((s, r) => s + r.overtimeHours, 0) * 10) / 10 };
}

// ===== TRANSFER GECMISI =====
export function getTransfers(pid) {
  const all = load('transfers') || [];
  return pid ? all.filter(t => t.personnelId === pid) : all;
}
export function addTransfer(data) {
  const all = load('transfers') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
  all.push(rec);
  save('transfers', all);
  if (data.personnelId && data.newDepartment) {
    updatePersonnel(data.personnelId, { department: data.newDepartment, ...(data.newTitle ? { title: data.newTitle } : {}) });
  }
  return rec;
}
export function deleteTransfer(id) {
  save('transfers', (load('transfers') || []).filter(t => t.id !== id));
}

// ===== ZIMMET & EKIPMAN =====
const SEED_EQUIPMENT = [
  { id: 1, name: 'Dell Latitude 5540', category: 'Bilgisayar', serial: 'DL-2023-001', status: 'assigned', assignedTo: 29, assignedDate: '2023-03-15', condition: 'good' },
  { id: 2, name: 'iPhone 14', category: 'Telefon', serial: 'IP-2023-001', status: 'assigned', assignedTo: 21, assignedDate: '2023-06-01', condition: 'good' },
  { id: 3, name: 'Samsung Galaxy A54', category: 'Telefon', serial: 'SM-2023-001', status: 'assigned', assignedTo: 7, assignedDate: '2023-09-01', condition: 'good' },
  { id: 4, name: 'HP LaserJet Pro', category: 'Yazici', serial: 'HP-2022-001', status: 'available', assignedTo: null, condition: 'good' },
  { id: 5, name: 'Telsiz Motorola', category: 'Telsiz', serial: 'MT-2023-001', status: 'assigned', assignedTo: 24, assignedDate: '2023-01-10', condition: 'good' },
  { id: 6, name: 'Telsiz Motorola', category: 'Telsiz', serial: 'MT-2023-002', status: 'assigned', assignedTo: 25, assignedDate: '2023-01-10', condition: 'fair' },
  { id: 7, name: 'Stetoskop Littmann', category: 'Medikal', serial: 'LT-2022-001', status: 'assigned', assignedTo: 1, assignedDate: '2022-01-01', condition: 'good' },
  { id: 8, name: 'Tansiyon Aleti Omron', category: 'Medikal', serial: 'OM-2023-001', status: 'assigned', assignedTo: 3, assignedDate: '2023-04-01', condition: 'good' },
  { id: 9, name: 'Tablet Samsung Tab', category: 'Bilgisayar', serial: 'TB-2023-001', status: 'available', assignedTo: null, condition: 'good' },
  { id: 10, name: 'Uniforma Seti (M)', category: 'Uniforma', serial: 'UF-2024-001', status: 'assigned', assignedTo: 8, assignedDate: '2024-01-15', condition: 'good' },
  { id: 11, name: 'Uniforma Seti (L)', category: 'Uniforma', serial: 'UF-2024-002', status: 'assigned', assignedTo: 9, assignedDate: '2024-01-15', condition: 'good' },
  { id: 12, name: 'Guvenlik Yelegi', category: 'Guvenlik', serial: 'GV-2024-001', status: 'assigned', assignedTo: 26, assignedDate: '2024-02-01', condition: 'good' },
  { id: 13, name: 'Laptop Lenovo ThinkPad', category: 'Bilgisayar', serial: 'LV-2024-001', status: 'assigned', assignedTo: 32, assignedDate: '2024-03-01', condition: 'good' },
  { id: 14, name: 'Arac - Fiat Doblo', category: 'Arac', serial: '34 ABC 123', status: 'assigned', assignedTo: 27, assignedDate: '2023-06-01', condition: 'fair' },
  { id: 15, name: 'Oksijen Maskesi Seti', category: 'Medikal', serial: 'OX-2024-001', status: 'available', assignedTo: null, condition: 'good' },
];
export function getEquipment() { return load('equipment') || [...SEED_EQUIPMENT]; }
export function saveEquipment(list) { save('equipment', list); }
export function addEquipment(data) {
  const list = getEquipment(); const item = { ...data, id: Date.now() }; list.push(item); saveEquipment(list); return item;
}
export function updateEquipment(id, data) {
  const list = getEquipment(); const idx = list.findIndex(e => e.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; saveEquipment(list); return list[idx]; } return null;
}
export function deleteEquipment(id) { saveEquipment(getEquipment().filter(e => e.id !== id)); }
export function assignEquipment(eqId, pid) { return updateEquipment(eqId, { status: 'assigned', assignedTo: pid, assignedDate: new Date().toISOString().split('T')[0] }); }
export function returnEquipment(eqId) { return updateEquipment(eqId, { status: 'available', assignedTo: null }); }

// ===== SIKAYET & OLAY BILDIRIMI =====
export function getIncidents(f) {
  f = f || {};
  let list = load('incidents') || [];
  if (f.status) list = list.filter(i => i.status === f.status);
  if (f.severity) list = list.filter(i => i.severity === f.severity);
  return list;
}
export function addIncident(data) {
  const list = load('incidents') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString(), status: 'open' };
  list.push(rec); save('incidents', list); return rec;
}
export function updateIncident(id, data) {
  const list = load('incidents') || []; const idx = list.findIndex(i => i.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; save('incidents', list); return list[idx]; } return null;
}
export function deleteIncident(id) { save('incidents', (load('incidents') || []).filter(i => i.id !== id)); }

// ===== ANLIK RUH HALI (MOOD PULSE) =====
export function getMoodEntries(f) {
  f = f || {};
  let list = load('moodEntries') || [];
  if (f.date) list = list.filter(m => m.date === f.date);
  if (f.department) list = list.filter(m => m.department === f.department);
  return list;
}
export function addMoodEntry(data) {
  let list = load('moodEntries') || [];
  list = list.filter(m => !(m.personnelId === data.personnelId && m.date === data.date));
  const rec = { ...data, id: Date.now(), timestamp: new Date().toISOString() };
  list.push(rec); save('moodEntries', list); return rec;
}
export function getMoodStats(dept) {
  const today = new Date(); const dates = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); dates.push(d.toISOString().split('T')[0]); }
  let entries = load('moodEntries') || [];
  if (dept) entries = entries.filter(m => m.department === dept);
  return dates.map(date => {
    const dayE = entries.filter(m => m.date === date);
    return { date, avg: dayE.length ? Math.round(dayE.reduce((s, m) => s + m.score, 0) / dayE.length * 10) / 10 : 0, count: dayE.length };
  });
}

// ===== BILGI BANKASI (SOP) =====
export function getKnowledgeArticles(f) {
  f = f || {};
  let list = load('knowledgeArticles') || [];
  if (f.department) list = list.filter(a => a.department === f.department || a.department === 'Genel');
  if (f.category) list = list.filter(a => a.category === f.category);
  return list;
}
export function addKnowledgeArticle(data) {
  const list = load('knowledgeArticles') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString(), views: 0 };
  list.push(rec); save('knowledgeArticles', list); return rec;
}
export function updateKnowledgeArticle(id, data) {
  const list = load('knowledgeArticles') || []; const idx = list.findIndex(a => a.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; save('knowledgeArticles', list); return list[idx]; } return null;
}
export function deleteKnowledgeArticle(id) { save('knowledgeArticles', (load('knowledgeArticles') || []).filter(a => a.id !== id)); }

// ===== ISE ALIM PIPELINE =====
export function getCandidates(f) {
  f = f || {};
  let list = load('candidates') || [];
  if (f.stage) list = list.filter(c => c.stage === f.stage);
  return list;
}
export function addCandidate(data) {
  const list = load('candidates') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString(), stage: data.stage || 'application' };
  list.push(rec); save('candidates', list); return rec;
}
export function updateCandidate(id, data) {
  const list = load('candidates') || []; const idx = list.findIndex(c => c.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; save('candidates', list); return list[idx]; } return null;
}
export function deleteCandidate(id) { save('candidates', (load('candidates') || []).filter(c => c.id !== id)); }

// ===== EMEKLILIK SAYACI =====
export function getRetirementInfo(p) {
  if (!p || !p.birthDate || !p.startDate) return null;
  const today = new Date();
  const age = today.getFullYear() - new Date(p.birthDate).getFullYear();
  const serviceYears = (today - new Date(p.startDate)) / 31557600000;
  const isWorker = PERSONNEL_TYPES[p.type]?.category === 'worker';
  const retAge = isWorker ? 50 : 60;
  const retService = 25;
  const yearsLeft = Math.max(Math.max(0, retAge - age), Math.max(0, retService - serviceYears));
  return { age, serviceYears: Math.round(serviceYears * 10) / 10, retirementAge: retAge, retirementService: retService, yearsRemaining: Math.round(yearsLeft * 10) / 10, eligible: yearsLeft <= 0, isWorker };
}
export function getRetirementList() {
  return getPersonnel({ status: 'active' }).map(p => {
    const info = getRetirementInfo(p);
    return info ? { ...p, retirement: info } : null;
  }).filter(Boolean).sort((a, b) => a.retirement.yearsRemaining - b.retirement.yearsRemaining);
}

// ===== FAZLA MESAI BUTCE LIMITI =====
export function getOvertimeBudget(dept, month) {
  return load('overtimeBudget_' + dept + '_' + month) || { department: dept, month, limitHours: 200 };
}
export function saveOvertimeBudget(data) { save('overtimeBudget_' + data.department + '_' + data.month, data); }
export function checkOvertimeBudget(dept, month) {
  const budget = getOvertimeBudget(dept, month);
  const report = getMonthlyReport(month).filter(r => r.department === dept);
  const used = report.reduce((s, r) => s + r.overtimeHours, 0);
  return { ...budget, usedHours: Math.round(used * 10) / 10, percentUsed: budget.limitHours ? Math.round(used / budget.limitHours * 100) : 0, exceeded: used > budget.limitHours };
}

// ===== TOPLU IZIN PLANLAMA =====
export function getLeavePlan(dept, year) {
  let records = getLeaveRecords({ year });
  if (dept) {
    const ids = getPersonnel({ department: dept }).map(p => p.id);
    return records.filter(r => ids.includes(r.personnelId));
  }
  return records;
}
export function checkMinimumStaff(dept, date, minStaff) {
  minStaff = minStaff || 2;
  const onLeave = getLeaveRecords({}).filter(r => r.status === 'approved' && date >= r.startDate && date <= r.endDate);
  const deptP = getPersonnel({ department: dept, status: 'active' });
  const leaveIds = onLeave.filter(r => deptP.some(p => p.id === r.personnelId)).map(r => r.personnelId);
  const available = deptP.filter(p => !leaveIds.includes(p.id));
  return { department: dept, date, total: deptP.length, onLeave: leaveIds.length, available: available.length, sufficient: available.length >= minStaff, minRequired: minStaff };
}

// ===== HATIRLATMA SISTEMI =====
export function getActiveReminders() {
  const reminders = [];
  const today = new Date();
  getUpcomingBirthdays(7).forEach(b => {
    reminders.push({ type: 'birthday', severity: 'info', icon: '🎂', message: b.name + ' ' + b.surname + ': ' + (b.isToday ? 'Bugun dogum gunu!' : b.daysUntil + ' gun sonra'), daysUntil: b.daysUntil });
  });
  getUpcomingAnniversaries(7).forEach(a => {
    reminders.push({ type: 'anniversary', severity: 'info', icon: '🏢', message: a.name + ' ' + a.surname + ': ' + a.years + '. yil ' + (a.isToday ? 'Bugun!' : a.daysUntil + ' gun sonra'), daysUntil: a.daysUntil });
  });
  (load('leaveRecords') || []).forEach(r => {
    if (r.status === 'approved') {
      const diff = Math.ceil((new Date(r.endDate) - today) / 86400000);
      if (diff >= 0 && diff <= 3) {
        const p = getPersonnelById(r.personnelId);
        reminders.push({ type: 'leave', severity: diff === 0 ? 'warning' : 'info', icon: '🏖️', message: (p ? p.name + ' ' + p.surname : 'Personel') + ': Izin ' + (diff === 0 ? 'bugun bitiyor' : diff + ' gun sonra'), daysUntil: diff });
      }
    }
  });
  return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
}

// ===== YETENEK MATRISI =====
export function getSkillsMatrix(dept) {
  const allSkills = {};
  const list = getPersonnel({ status: 'active', ...(dept ? { department: dept } : {}) });
  list.forEach(p => {
    (p.certificates || []).forEach(c => { allSkills[c] = (allSkills[c] || 0) + 1; });
    if (p.education) allSkills[p.education] = (allSkills[p.education] || 0) + 1;
  });
  return { skills: Object.keys(allSkills).sort(), counts: allSkills, personnel: list.map(p => ({ id: p.id, name: p.name + ' ' + p.surname, department: p.department, title: p.title, type: p.type, skills: [...(p.certificates || []), ...(p.education ? [p.education] : [])] })) };
}

// ===== SEED NEW FEATURE DATA =====
(function seedNew() {
  if (!load('incidents')) save('incidents', [
    { id: 1, title: 'Hasta yakini sikayeti', description: 'Acil serviste bekleme suresi cok uzun', department: 'Acil Servis', severity: 'medium', status: 'resolved', reporter: 'Hasta Yakini', resolution: 'Bekleme alani genisletildi', createdAt: '2025-06-15T10:00:00Z' },
    { id: 2, title: 'Ilac envanteri eksik', description: 'Acil dolapta eksik ilaclar var', department: 'Eczane', severity: 'high', status: 'in_progress', reporter: 'Ayse Demir', resolution: '', createdAt: '2025-07-01T14:30:00Z' },
    { id: 3, title: 'Temizlik malzemesi yetersiz', description: '3. kat temizlik dolabi bos', department: 'Temizlik', severity: 'low', status: 'open', reporter: 'Osman Cetin', resolution: '', createdAt: '2025-07-05T09:00:00Z' },
  ]);
  if (!load('knowledgeArticles')) save('knowledgeArticles', [
    { id: 1, title: 'Hijyen Protokolu', content: 'Tum personel gunde en az 3 kez el yikamalidir.', category: 'Protokol', department: 'Genel', author: 'Sistem', createdAt: '2025-01-01T00:00:00Z', views: 45 },
    { id: 2, title: 'Acil Durum Proseduru', content: 'Kod Mavi: Kalp durmasi. Kod Kirmizi: Yangin.', category: 'Prosedur', department: 'Genel', author: 'Sistem', createdAt: '2025-01-01T00:00:00Z', views: 89 },
    { id: 3, title: 'SGK Islemleri Rehberi', content: 'Hasta kabulde SGK sorgulama adimlari.', category: 'Rehber', department: 'Idari', author: 'Elif Yildiz', createdAt: '2025-02-15T00:00:00Z', views: 23 },
  ]);
  if (!load('candidates')) save('candidates', [
    { id: 1, name: 'Aylin Kaya', phone: '0555 111 22 33', email: 'aylin.kaya@email.com', targetDepartment: 'Hemsirelik', targetTitle: 'Hemsire', stage: 'interview', notes: 'MYO mezunu, 3 yil deneyim', createdAt: '2025-06-20T00:00:00Z' },
    { id: 2, name: 'Berk Yilmaz', phone: '0555 222 33 44', email: 'berk.yilmaz@email.com', targetDepartment: 'Teknik Servis', targetTitle: 'Elektrik Teknisyeni', stage: 'application', notes: 'Teknik lise mezunu', createdAt: '2025-07-01T00:00:00Z' },
    { id: 3, name: 'Canan Ozdemir', phone: '0555 333 44 55', email: 'canan.ozdemir@email.com', targetDepartment: 'Dahiliye', targetTitle: 'Uzman Doktor', stage: 'offer', notes: 'Istanbul Tip Fakultesi mezunu', createdAt: '2025-05-10T00:00:00Z' },
  ]);
  if (!load('transfers')) save('transfers', [
    { id: 1, personnelId: 14, oldDepartment: 'Yogun Bakim', newDepartment: 'Dahiliye', oldTitle: 'Yogun Bakim Hemsiresi', newTitle: 'Servis Hemsiresi', reason: 'Personel ihtiyaci', date: '2023-02-01', createdAt: '2023-02-01T00:00:00Z' },
    { id: 2, personnelId: 27, oldDepartment: 'Cerrahi', newDepartment: 'Teknik Servis', oldTitle: 'Teknisyen', newTitle: 'Teknik Sef', reason: 'Terfi', date: '2023-06-01', createdAt: '2023-06-01T00:00:00Z' },
  ]);
  if (!load('moodEntries') || (load('moodEntries') || []).length === 0) {
    const md = []; const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(now); dd.setDate(dd.getDate() - i); const ds = dd.toISOString().split('T')[0];
      getPersonnel({ status: 'active' }).slice(0, 12).forEach(p => {
        if (Math.random() > 0.3) md.push({ id: Date.now() + Math.random() * 99999, personnelId: p.id, department: p.department, date: ds, score: Math.ceil(Math.random() * 5), emoji: ['😞','😕','😐','🙂','😊'][Math.floor(Math.random()*5)], note: '' });
      });
    }
    save('moodEntries', md);
  }
})();

// ===== FAZ 4: DUYURU PANOSU =====
export function getAnnouncements(f) {
  f = f || {};
  let list = load('announcements') || [];
  if (f.pinned) list = list.filter(a => a.pinned);
  if (f.department) list = list.filter(a => a.department === 'Genel' || a.department === f.department);
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export function addAnnouncement(data) {
  const list = load('announcements') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString(), views: 0 };
  list.push(rec); save('announcements', list); return rec;
}
export function updateAnnouncement(id, data) {
  const list = load('announcements') || []; const idx = list.findIndex(a => a.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; save('announcements', list); return list[idx]; } return null;
}
export function deleteAnnouncement(id) { save('announcements', (load('announcements') || []).filter(a => a.id !== id)); }

// ===== FAZ 4: SOZLESME & BELGE TAKIBI =====
export function getContracts(pid) {
  const all = load('contracts') || [];
  return pid ? all.filter(c => c.personnelId === pid) : all;
}
export function addContract(data) {
  const all = load('contracts') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
  all.push(rec); save('contracts', all); return rec;
}
export function updateContract(id, data) {
  const all = load('contracts') || []; const idx = all.findIndex(c => c.id === id);
  if (idx >= 0) { all[idx] = { ...all[idx], ...data }; save('contracts', all); return all[idx]; } return null;
}
export function deleteContract(id) { save('contracts', (load('contracts') || []).filter(c => c.id !== id)); }
export function getExpiringContracts(days) {
  days = days || 30;
  const today = new Date();
  return (load('contracts') || []).filter(c => {
    if (!c.endDate) return false;
    const diff = Math.ceil((new Date(c.endDate) - today) / 86400000);
    return diff >= 0 && diff <= days;
  }).map(c => {
    const p = getPersonnelById(c.personnelId);
    return { ...c, personnelName: p ? p.name + ' ' + p.surname : 'Bilinmiyor', daysUntilExpiry: Math.ceil((new Date(c.endDate) - today) / 86400000) };
  }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

// ===== FAZ 4: HEDEFF & KPI YONETIMI =====
export function getGoals(dept) {
  let list = load('goals') || [];
  if (dept) list = list.filter(g => g.department === dept);
  return list;
}
export function addGoal(data) {
  const list = load('goals') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
  list.push(rec); save('goals', list); return rec;
}
export function updateGoal(id, data) {
  const list = load('goals') || []; const idx = list.findIndex(g => g.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; save('goals', list); return list[idx]; } return null;
}
export function deleteGoal(id) { save('goals', (load('goals') || []).filter(g => g.id !== id)); }

// ===== FAZ 4: EGITIM TAKVIMI =====
export function getEducationEvents(f) {
  f = f || {};
  let list = load('educationEvents') || [];
  if (f.department) list = list.filter(e => e.department === f.department || e.department === 'Genel');
  if (f.month) list = list.filter(e => e.date && e.date.startsWith(f.month));
  return list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}
export function addEducationEvent(data) {
  const list = load('educationEvents') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
  list.push(rec); save('educationEvents', list); return rec;
}
export function updateEducationEvent(id, data) {
  const list = load('educationEvents') || []; const idx = list.findIndex(e => e.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; save('educationEvents', list); return list[idx]; } return null;
}
export function deleteEducationEvent(id) { save('educationEvents', (load('educationEvents') || []).filter(e => e.id !== id)); }

// ===== FAZ 4: KISESEL HATIRLATMA & DEADLINE =====
export function getPersonalReminders(userId) {
  let list = load('personalReminders_' + (userId || 'default')) || [];
  return list.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
}
export function addPersonalReminder(data) {
  const key = 'personalReminders_' + (data.userId || 'default');
  const list = load(key) || [];
  const rec = { ...data, id: Date.now(), done: false, createdAt: new Date().toISOString() };
  list.push(rec); save(key, list); return rec;
}
export function updatePersonalReminder(id, data, userId) {
  const key = 'personalReminders_' + (userId || 'default');
  const list = load(key) || []; const idx = list.findIndex(r => r.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...data }; save(key, list); return list[idx]; } return null;
}
export function deletePersonalReminder(id, userId) {
  const key = 'personalReminders_' + (userId || 'default');
  save(key, (load(key) || []).filter(r => r.id !== id));
}

// ===== FAZ 5: DEPARTMAN VERIMLILIK RAPORU =====
export function getDepartmentProductivity(monthStr) {
  const report = getMonthlyReport(monthStr);
  const grouped = {};
  report.forEach(r => {
    if (!grouped[r.department]) grouped[r.department] = { total: 0, overtime: 0, count: 0, expected: 0 };
    grouped[r.department].total += r.totalHours;
    grouped[r.department].overtime += r.overtimeHours;
    grouped[r.department].expected += r.expectedHours;
    grouped[r.department].count++;
  });
  return Object.entries(grouped).map(([dept, d]) => ({
    department: dept, personnelCount: d.count, totalHours: Math.round(d.total * 10) / 10,
    expectedHours: Math.round(d.expected * 10) / 10, overtimeHours: Math.round(d.overtime * 10) / 10,
    utilization: d.expected ? Math.round(d.total / d.expected * 100) : 0,
    avgHours: d.count ? Math.round(d.total / d.count * 10) / 10 : 0,
    efficiency: d.expected ? Math.min(100, Math.round((d.expected / Math.max(d.total, 0.1)) * 100)) : 0,
  })).sort((a, b) => b.utilization - a.utilization);
}

// ===== FAZ 5: MAAS ZAM SIMULASYONU =====
export function simulateSalaryRaise(percentage, dept) {
  const rates = getSalaryRates();
  const now = new Date();
  const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const report = getMonthlyReport(monthStr).filter(r => dept ? r.department === dept : true);
  let currentTotal = 0, raisedTotal = 0;
  report.forEach(r => {
    const rate = rates[r.type] || rates.default || 50;
    const raised = rate * (1 + percentage / 100);
    currentTotal += r.totalHours * rate + r.overtimeHours * rate * (rates.overtimeMultiplier || 1.5);
    raisedTotal += r.totalHours * raised + r.overtimeHours * raised * (rates.overtimeMultiplier || 1.5);
  });
  return { percentage, department: dept || 'Tümü', personnelCount: report.length, currentCost: Math.round(currentTotal), raisedCost: Math.round(raisedTotal), increase: Math.round(raisedTotal - currentTotal), perPerson: report.length ? Math.round((raisedTotal - currentTotal) / report.length) : 0 };
}

// ===== FAZ 5: TURNOVER ANALIZI =====
export function getTurnoverData(months) {
  months = months || 6;
  const transfers = load('transfers') || [];
  const allP = getPersonnel({});
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const monthTransfers = transfers.filter(t => t.date && t.date.startsWith(mStr));
    const activeCount = allP.filter(p => p.status === 'active').length;
    result.push({ month: mStr, transfers: monthTransfers.length, totalPersonnel: activeCount, turnoverRate: activeCount ? Math.round(monthTransfers.length / activeCount * 1000) / 10 : 0 });
  }
  return result;
}

// ===== FAZ 5: MESAI TREND & ANOMALI =====
export function getOvertimeTrends(months) {
  months = months || 6;
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const report = getMonthlyReport(mStr);
    const totalOT = report.reduce((s, r) => s + r.overtimeHours, 0);
    const avgOT = report.length ? totalOT / report.length : 0;
    result.push({ month: mStr, totalOvertime: Math.round(totalOT * 10) / 10, avgOvertime: Math.round(avgOT * 10) / 10, personnelCount: report.length });
  }
  // Anomaly: if current month > 1.5x average of previous months
  if (result.length >= 3) {
    const prevAvg = result.slice(0, -1).reduce((s, r) => s + r.totalOvertime, 0) / (result.length - 1);
    result.forEach(r => { r.anomaly = r.totalOvertime > prevAvg * 1.5; });
  }
  return result;
}

// ===== FAZ 5: HASTA-PERSONEL ORANI =====
export function getPatientStaffRatio() {
  const depts = getDepartments();
  const patientDepts = ['Acil Servis', 'Dahiliye', 'Cerrahi', 'Yoğun Bakım', 'Çocuk Sağlığı', 'Kadın Doğum'];
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  return patientDepts.map(dept => {
    const staff = getPersonnel({ department: dept, status: 'active' }).length;
    const basePatients = { 'Acil Servis': 25, 'Dahiliye': 20, 'Cerrahi': 18, 'Yoğun Bakım': 12, 'Çocuk Sağlığı': 15, 'Kadın Doğum': 10 };
    const patients = (basePatients[dept] || 10) + Math.floor(Math.random() * 8) - 4;
    const ratio = staff ? Math.round(patients / staff * 10) / 10 : 0;
    const safeRatio = dept === 'Yoğun Bakım' ? 2 : dept === 'Acil Servis' ? 4 : 3;
    return { department: dept, staff, patients, ratio, safeRatio, status: ratio > safeRatio ? 'critical' : ratio > safeRatio * 0.8 ? 'warning' : 'ok' };
  });
}

// ===== FAZ 5: IS GUCU PLANLAMA =====
export function getWorkforcePlan() {
  const depts = getDepartments();
  const now = new Date();
  const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const report = getMonthlyReport(monthStr);
  return depts.map(dept => {
    const deptR = report.filter(r => r.department === dept);
    const active = getPersonnel({ department: dept, status: 'active' }).length;
    const avgUtil = deptR.length ? Math.round(deptR.reduce((s, r) => s + r.totalHours / (r.expectedHours || 1), 0) / deptR.length * 100) : 0;
    const need = avgUtil > 90 ? Math.ceil(active * 0.15) : avgUtil > 80 ? Math.ceil(active * 0.1) : 0;
    return { department: dept, currentStaff: active, utilization: avgUtil, neededStaff: need, status: avgUtil > 90 ? 'critical' : avgUtil > 80 ? 'warning' : 'ok' };
  }).filter(d => d.currentStaff > 0).sort((a, b) => b.utilization - a.utilization);
}

// ===== FAZ 6: MESAI SAAT TAKIBI (TIME CLOCK) =====
export function getTimeClockEntries(f) {
  f = f || {};
  let list = load('timeClock') || [];
  if (f.personnelId) list = list.filter(t => t.personnelId === f.personnelId);
  if (f.date) list = list.filter(t => t.date === f.date);
  if (f.month) list = list.filter(t => t.date && t.date.startsWith(f.month));
  return list;
}
export function clockIn(personnelId) {
  const list = load('timeClock') || [];
  const today = new Date().toISOString().split('T')[0];
  const existing = list.find(t => t.personnelId === personnelId && t.date === today && !t.clockOut);
  if (existing) return existing;
  const rec = { id: Date.now(), personnelId, date: today, clockIn: new Date().toISOString(), clockOut: null };
  list.push(rec); save('timeClock', list); return rec;
}
export function clockOut(personnelId) {
  const list = load('timeClock') || [];
  const today = new Date().toISOString().split('T')[0];
  const idx = list.findIndex(t => t.personnelId === personnelId && t.date === today && !t.clockOut);
  if (idx >= 0) {
    list[idx].clockOut = new Date().toISOString();
    const diff = new Date(list[idx].clockOut) - new Date(list[idx].clockIn);
    list[idx].hours = Math.round(diff / 3600000 * 10) / 10;
    save('timeClock', list); return list[idx];
  }
  return null;
}
export function getTodayTimeClock() {
  const today = new Date().toISOString().split('T')[0];
  return (load('timeClock') || []).filter(t => t.date === today);
}

// ===== FAZ 6: 360 DEGERLENDIRME =====
export function get360Evaluations(pid) {
  const all = load('evaluations360') || [];
  return pid ? all.filter(e => e.targetId === pid) : all;
}
export function add360Evaluation(data) {
  const all = load('evaluations360') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
  all.push(rec); save('evaluations360', all); return rec;
}
export function get360Summary(pid) {
  const evals = get360Evaluations(pid);
  if (!evals.length) return null;
  const cats = {};
  evals.forEach(e => {
    (e.ratings || []).forEach(r => {
      if (!cats[r.category]) cats[r.category] = { total: 0, count: 0 };
      cats[r.category].total += r.score;
      cats[r.category].count++;
    });
  });
  const summary = Object.entries(cats).map(([cat, d]) => ({ category: cat, avg: Math.round(d.total / d.count * 10) / 10, count: d.count }));
  const overall = summary.length ? Math.round(summary.reduce((s, c) => s + c.avg, 0) / summary.length * 10) / 10 : 0;
  return { categories: summary, overall, evaluatorCount: evals.length };
}

// ===== SEED FAZ 4-5-6 DATA =====
(function seedFaz456() {
  if (!load('announcements')) save('announcements', [
    { id: 1, title: 'Yeni Yemekhane Saatleri', content: 'Pazartesi gununden itibaren oglen yemegi 12:00-13:30 arasi verilecektir.', department: 'Genel', author: 'Sistem', pinned: true, priority: 'high', createdAt: '2025-07-01T08:00:00Z', views: 45 },
    { id: 2, title: 'Bakim Calismasi', content: '2. katta elektrik bakimi yapilacak. Etkilenen bolumler: Cerrahi, Ameliyathane.', department: 'Teknik Servis', author: 'Hasan Aydin', pinned: false, priority: 'medium', createdAt: '2025-07-05T10:00:00Z', views: 12 },
    { id: 3, title: 'Saglik Haftasi Etkinligi', content: 'Tum personel saglik haftasi etkinliklerine davetlidir.', department: 'Genel', author: 'Elif Yildiz', pinned: false, priority: 'low', createdAt: '2025-07-08T14:00:00Z', views: 8 },
  ]);
  if (!load('contracts')) save('contracts', [
    { id: 1, personnelId: 1, type: 'Sabit Sureli', startDate: '2024-01-01', endDate: '2025-12-31', notes: 'Uzman doktor sozlesmesi', createdAt: '2024-01-01T00:00:00Z' },
    { id: 2, personnelId: 15, type: 'Belirsiz Sureli', startDate: '2020-03-15', endDate: null, notes: 'Kadrolu isci', createdAt: '2020-03-15T00:00:00Z' },
    { id: 3, personnelId: 25, type: 'Sabit Sureli', startDate: '2023-09-15', endDate: '2025-09-14', notes: 'Guvenlik sozlesmesi', createdAt: '2023-09-15T00:00:00Z' },
  ]);
  if (!load('goals')) save('goals', [
    { id: 1, department: 'Acil Servis', title: 'Hasta Memnuniyeti %90+', target: 90, current: 82, unit: '%', deadline: '2025-12-31', status: 'in_progress', createdAt: '2025-01-01T00:00:00Z' },
    { id: 2, department: 'Hemşirelik', title: 'Devamsızlık Orani <%3', target: 3, current: 4.5, unit: '%', deadline: '2025-12-31', status: 'in_progress', createdAt: '2025-01-01T00:00:00Z' },
    { id: 3, department: 'Temizlik', title: 'Hijyen Denetimi 95+', target: 95, current: 88, unit: 'puan', deadline: '2025-09-30', status: 'in_progress', createdAt: '2025-01-01T00:00:00Z' },
  ]);
  if (!load('educationEvents')) save('educationEvents', [
    { id: 1, title: 'Ilk Yardim Egitimi', department: 'Genel', date: '2025-07-20', time: '09:00', duration: 4, trainer: 'Dr. Huseyin Korkmaz', participants: [], maxParticipants: 30, location: 'Konferans Salonu', createdAt: '2025-07-01T00:00:00Z' },
    { id: 2, title: 'Hijyen ve Enfeksiyon Kontrolu', department: 'Hemşirelik', date: '2025-07-25', time: '14:00', duration: 2, trainer: 'Bashemsire Ayse Demir', participants: [], maxParticipants: 20, location: 'Egitim Odasi', createdAt: '2025-07-05T00:00:00Z' },
    { id: 3, title: 'Yangin Tatbikati', department: 'Genel', date: '2025-08-01', time: '10:00', duration: 3, trainer: 'Guvenlik Amiri', participants: [], maxParticipants: 100, location: 'Bahce', createdAt: '2025-07-10T00:00:00Z' },
  ]);
  if (!load('personalReminders_default')) save('personalReminders_default', [
    { id: 1, userId: 'default', title: 'Sertifika Yenileme', description: 'Hijyen sertifikasi suresi doluyor', dueDate: '2025-08-15', priority: 'high', done: false, createdAt: '2025-07-01T00:00:00Z' },
    { id: 2, userId: 'default', title: 'Performans Gorusmesi', description: 'Yillik degerlendirme hazirlik', dueDate: '2025-07-30', priority: 'medium', done: false, createdAt: '2025-07-05T00:00:00Z' },
  ]);
  if (!load('evaluations360')) save('evaluations360', [
    { id: 1, targetId: 1, evaluatorId: 2, evaluatorRole: 'manager', ratings: [{ category: 'İş Kalitesi', score: 4.5 }, { category: 'İletişim', score: 4 }, { category: 'Takım Çalışması', score: 4.5 }], comment: 'Cok basarili', createdAt: '2025-06-01T00:00:00Z' },
    { id: 2, targetId: 1, evaluatorId: 7, evaluatorRole: 'peer', ratings: [{ category: 'İş Kalitesi', score: 5 }, { category: 'İletişim', score: 4.5 }, { category: 'Takım Çalışması', score: 5 }], comment: 'Mukemmel isbirligi', createdAt: '2025-06-05T00:00:00Z' },
    { id: 3, targetId: 7, evaluatorId: 1, evaluatorRole: 'manager', ratings: [{ category: 'İş Kalitesi', score: 4 }, { category: 'İletişim', score: 4.5 }, { category: 'Takım Çalışması', score: 4 }], comment: 'Cok iyi', createdAt: '2025-06-01T00:00:00Z' },
  ]);
})();
