// ===== HASTA YONETIMI =====
import { getPersonnel, DEPARTMENTS } from '../state.js';
import { showToast } from '../notifications.js';

const save = (k, d) => localStorage.setItem('hospital_' + k, JSON.stringify(d));
const load = (k) => { try { return JSON.parse(localStorage.getItem('hospital_' + k)); } catch { return null; } };

const PATIENT_DEPTS = ['Acil Servis', 'Dahiliye', 'Cerrahi', 'Çocuk Sağlığı', 'Kadın Doğum', 'Yoğun Bakım'];
const STATUS_MAP = { active: { label: 'Aktif', color: 'text-green-400', bg: 'bg-green-500/10' }, discharged: { label: 'Taburcu', color: 'text-slate-400', bg: 'bg-slate-500/10' }, transferred: { label: 'Transfer', color: 'text-blue-400', bg: 'bg-blue-500/10' } };
const PRIORITY_MAP = { normal: { label: 'Normal', color: 'text-blue-300' }, urgent: { label: 'Acil', color: 'text-amber-300' }, critical: { label: 'Kritik', color: 'text-red-300' } };

function getPatients(f) {
  f = f || {};
  let list = load('patients') || [];
  if (f.department) list = list.filter(p => p.department === f.department);
  if (f.status) list = list.filter(p => p.status === f.status);
  return list;
}
function addPatient(data) { const list = load('patients') || []; const rec = { ...data, id: Date.now(), admissionDate: data.admissionDate || new Date().toISOString().split('T')[0], status: 'active' }; list.push(rec); save('patients', list); return rec; }
function updatePatient(id, data) { const list = load('patients') || []; const idx = list.findIndex(p => p.id === id); if (idx >= 0) { list[idx] = { ...list[idx], ...data }; save('patients', list); return list[idx]; } return null; }
function dischargePatient(id) { return updatePatient(id, { status: 'discharged', dischargeDate: new Date().toISOString().split('T')[0] }); }

function seedPatients() {
  if (load('patients')) return;
  save('patients', [
    { id: 1, name: 'Mehmet Yılmaz', tc: '90000000001', department: 'Acil Servis', room: 'AC-101', bed: 1, priority: 'urgent', diagnosis: 'Apandisit', assignedDoctor: 3, assignedNurse: 9, admissionDate: '2025-07-09', status: 'active', notes: 'Ameliyat planlandı' },
    { id: 2, name: 'Fatma Çelik', tc: '90000000002', department: 'Dahiliye', room: 'DH-205', bed: 2, priority: 'normal', diagnosis: 'Diyabet kontrol', assignedDoctor: 1, assignedNurse: 14, admissionDate: '2025-07-08', status: 'active', notes: 'İnsulin ayarlaması' },
    { id: 3, name: 'Ahmet Kaya', tc: '90000000003', department: 'Yoğun Bakım', room: 'YB-001', bed: 1, priority: 'critical', diagnosis: 'Myokard enfarktüsü', assignedDoctor: 3, assignedNurse: 10, admissionDate: '2025-07-10', status: 'active', notes: 'Monitörize, istirahat' },
    { id: 4, name: 'Zeliha Demir', tc: '90000000004', department: 'Kadın Doğum', room: 'KD-301', bed: 1, priority: 'normal', diagnosis: 'Doğum takibi', assignedDoctor: null, assignedNurse: 12, admissionDate: '2025-07-07', status: 'active', notes: '38. hafta' },
    { id: 5, name: 'Hasan Bulut', tc: '90000000005', department: 'Cerrahi', room: 'CR-102', bed: 3, priority: 'normal', diagnosis: 'Fıtık ameliyatı sonrası', assignedDoctor: 2, assignedNurse: 11, admissionDate: '2025-07-06', status: 'discharged', dischargeDate: '2025-07-10', notes: 'Taburcu edildi' },
  ]);
}

export function renderPatientsPage(el) {
  seedPatients();
  const patients = getPatients();
  const active = patients.filter(p => p.status === 'active');
  const doctorList = getPersonnel({ type: 'doctor', status: 'active' });
  const nurseList = getPersonnel({ type: 'nurse', status: 'active' });
  const deptCounts = {};
  active.forEach(p => { deptCounts[p.department] = (deptCounts[p.department] || 0) + 1; });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">👥 Hasta Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">Hasta yatış, taburcu ve personel eşleştirme</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-2xl font-bold text-white">${active.length}</p><p class="text-xs text-slate-400">Aktif Hasta</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-red-300">${active.filter(p => p.priority === 'critical').length}</p><p class="text-xs text-slate-400">Kritik</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-amber-300">${active.filter(p => p.priority === 'urgent').length}</p><p class="text-xs text-slate-400">Acil</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-green-300">${patients.filter(p => p.status === 'discharged').length}</p><p class="text-xs text-slate-400">Taburcu</p></div>
    </div>
    <div class="flex flex-wrap gap-2 mb-4 fade-in">
      <button id="patient-add" class="btn-primary">➕ Hasta Yatış</button>
      <select id="patient-filter-dept" class="input-field text-sm"><option value="">Tüm Klinikler</option>${PATIENT_DEPTS.map(d => `<option value="${d}">${d} (${deptCounts[d] || 0})</option>`).join('')}</select>
      <select id="patient-filter-status" class="input-field text-sm"><option value="">Tüm Durumlar</option><option value="active">Aktif</option><option value="discharged">Taburcu</option></select>
    </div>
    <div id="patient-list" class="space-y-2 fade-in"></div>`;

  function renderList() {
    const dept = document.getElementById('patient-filter-dept').value;
    const status = document.getElementById('patient-filter-status').value;
    let filtered = getPatients({ department: dept || undefined, status: status || undefined });
    document.getElementById('patient-list').innerHTML = filtered.length === 0
      ? '<div class="empty-state"><div class="icon">👥</div><div class="title">Hasta bulunamadı</div></div>'
      : filtered.map(p => {
        const st = STATUS_MAP[p.status] || STATUS_MAP.active;
        const pr = PRIORITY_MAP[p.priority] || PRIORITY_MAP.normal;
        const doc = doctorList.find(d => d.id === p.assignedDoctor);
        const nurse = nurseList.find(n => n.id === p.assignedNurse);
        return `<div class="card ${p.priority === 'critical' ? 'border-red-500/30' : ''}">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="text-sm font-semibold text-white">${p.name}</p>
              <p class="text-xs text-slate-400">${p.department} · Oda: ${p.room} · Yatak: ${p.bed}</p>
            </div>
            <div class="flex gap-2">
              <span class="badge ${pr.color}">${pr.label}</span>
              <span class="badge ${st.bg} ${st.color}">${st.label}</span>
            </div>
          </div>
          <p class="text-xs text-slate-300 mb-2">🩺 ${p.diagnosis}</p>
          <div class="flex flex-wrap gap-3 text-xs text-slate-400">
            <span>👨‍⚕️ Dr: ${doc ? doc.name + ' ' + doc.surname : 'Atanmamış'}</span>
            <span>👩‍⚕️ Hmş: ${nurse ? nurse.name + ' ' + nurse.surname : 'Atanmamış'}</span>
            <span>📅 ${p.admissionDate}</span>
            ${p.dischargeDate ? '<span>📤 Taburcu: ' + p.dischargeDate + '</span>' : ''}
          </div>
          ${p.notes ? '<p class="text-xs text-slate-500 mt-2">📝 ' + p.notes + '</p>' : ''}
          ${p.status === 'active' ? `<div class="flex gap-2 mt-3"><button class="pat-discharge btn-secondary text-xs px-3 py-1" data-id="${p.id}">📤 Taburcu</button><button class="pat-edit btn-secondary text-xs px-3 py-1" data-id="${p.id}">✏️ Düzenle</button></div>` : ''}
        </div>`;
      }).join('');

    document.querySelectorAll('.pat-discharge').forEach(btn => {
      btn.onclick = () => { dischargePatient(parseInt(btn.dataset.id)); renderList(); showToast('Hasta taburcu edildi', 'success'); };
    });
  }

  renderList();
  document.getElementById('patient-filter-dept').onchange = renderList;
  document.getElementById('patient-filter-status').onchange = renderList;
  document.getElementById('patient-add').onclick = () => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <h3 class="text-xl font-bold text-white mb-4">👥 Hasta Yatış</h3>
        <div class="space-y-3">
          <div><label class="label">Ad Soyad</label><input id="p-name" class="input-field w-full" placeholder="Hasta adı"></div>
          <div><label class="label">TC Kimlik</label><input id="p-tc" class="input-field w-full" placeholder="TC No"></div>
          <div><label class="label">Klinik</label><select id="p-dept" class="input-field w-full">${PATIENT_DEPTS.map(d => `<option value="${d}">${d}</option>`).join('')}</select></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Oda</label><input id="p-room" class="input-field w-full" placeholder="Örn: AC-101"></div>
            <div><label class="label">Yatak</label><input id="p-bed" type="number" class="input-field w-full" placeholder="1" min="1"></div>
          </div>
          <div><label class="label">Öncelik</label><select id="p-priority" class="input-field w-full"><option value="normal">Normal</option><option value="urgent">Acil</option><option value="critical">Kritik</option></select></div>
          <div><label class="label">Tanı</label><input id="p-diag" class="input-field w-full" placeholder="Tanı bilgisi"></div>
          <div><label class="label">Sorumlu Doktor</label><select id="p-doc" class="input-field w-full"><option value="">Seçiniz</option>${doctorList.map(d => `<option value="${d.id}">${d.name} ${d.surname} (${d.department})</option>`).join('')}</select></div>
          <div><label class="label">Sorumlu Hemşire</label><select id="p-nurse" class="input-field w-full"><option value="">Seçiniz</option>${nurseList.map(n => `<option value="${n.id}">${n.name} ${n.surname} (${n.department})</option>`).join('')}</select></div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="p-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="p-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.getElementById('p-cancel').onclick = () => modal.remove();
    document.getElementById('p-save').onclick = () => {
      const name = document.getElementById('p-name').value.trim();
      if (!name) { showToast('Hasta adı gereklidir', 'error'); return; }
      addPatient({ name, tc: document.getElementById('p-tc').value, department: document.getElementById('p-dept').value, room: document.getElementById('p-room').value, bed: parseInt(document.getElementById('p-bed').value) || 1, priority: document.getElementById('p-priority').value, diagnosis: document.getElementById('p-diag').value, assignedDoctor: parseInt(document.getElementById('p-doc').value) || null, assignedNurse: parseInt(document.getElementById('p-nurse').value) || null, notes: '' });
      modal.remove(); showToast('Hasta yatış yapıldı', 'success'); renderList();
    };
  };
}
