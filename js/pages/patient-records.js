// ===== HASTA KAYITLARI - TAM HASTA YONETIMI =====
import { getPersonnel } from '../state.js';

function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_patient_records') || '{"patients":[],"nextId":1001}'); } catch { return { patients: [], nextId: 1001 }; }
}
function setStorage(d) { localStorage.setItem('hospital_patient_records', JSON.stringify(d)); }

const WARD_TYPES = ['Genel', 'Cerrahi', 'Dahiliye', 'Kardiyoloji', 'Nöroloji', 'Pediatri', 'Kadın Doğum', 'Yoğun Bakım', 'Acil'];
const STATUS_MAP = {
  active: { label: 'Yatılı', color: 'emerald', icon: '🏥' },
  discharged: { label: 'Taburcu', color: 'slate', icon: '✅' },
  transferred: { label: 'Transfer', color: 'blue', icon: '🔄' },
  emergency: { label: 'Acil', color: 'red', icon: '🚨' },
};

function seedPatients() {
  const data = getStorage();
  if (data.patients.length > 0) return;
  const names = [
    { name: 'Ahmet', surname: 'Yılmaz', tc: '12345678901', age: 45, gender: 'E', ward: 'Genel', bed: 'A-101', diagnosis: 'Pnömoni', doctor: 'Dr. Arslan', nurse: 'Hem. Fatma', status: 'active', admitDate: '2025-07-01' },
    { name: 'Ayşe', surname: 'Demir', tc: '98765432109', age: 67, gender: 'K', ward: 'Kardiyoloji', bed: 'B-205', diagnosis: 'Kalp Yetmezliği', doctor: 'Dr. Mehmet', nurse: 'Hem. Zeynep', status: 'active', admitDate: '2025-06-28' },
    { name: 'Mehmet', surname: 'Kaya', tc: '56789012345', age: 34, gender: 'E', ward: 'Cerrahi', bed: 'C-310', diagnosis: 'Apandisit', doctor: 'Dr. Ali', nurse: 'Hem. Elif', status: 'active', admitDate: '2025-07-08' },
    { name: 'Fatma', surname: 'Çelik', tc: '34567890123', age: 28, gender: 'K', ward: 'Kadın Doğum', bed: 'D-102', diagnosis: 'Doğum Takibi', doctor: 'Dr. Ayşe', nurse: 'Hem. Merve', status: 'active', admitDate: '2025-07-05' },
    { name: 'Ali', surname: 'Öztürk', tc: '78901234567', age: 72, gender: 'E', ward: 'Yoğun Bakım', bed: 'YB-03', diagnosis: ' İnme', doctor: 'Dr. Can', nurse: 'Hem. Sultan', status: 'emergency', admitDate: '2025-07-09' },
  ];
  names.forEach(p => {
    data.patients.push({ id: data.nextId++, ...p, notes: [], treatments: [], vitals: [], createdAt: new Date().toISOString() });
  });
  setStorage(data);
}

export function renderPatientRecordsPage(el) {
  seedPatients();
  const data = getStorage();
  const tab = data._tab || 'list';
  const filter = data._filter || 'all';

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🏥 Hasta Kayıtları</h1>
          <p class="text-slate-400 text-sm mt-1">Hasta yatış, tedavi takibi ve taburcu yönetimi</p>
        </div>
        <button id="pr-add" class="btn-primary">➕ Yeni Hasta</button>
      </div>
    </div>

    <!-- KPI Kartları -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-5">
        <p class="text-sm text-emerald-300">🏥 Yatılı Hasta</p>
        <p class="text-3xl font-bold text-white">${data.patients.filter(p => p.status === 'active' || p.status === 'emergency').length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 p-5">
        <p class="text-sm text-red-300">🚨 Acil</p>
        <p class="text-3xl font-bold text-white">${data.patients.filter(p => p.status === 'emergency').length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 p-5">
        <p class="text-sm text-blue-300">✅ Bugün Taburcu</p>
        <p class="text-3xl font-bold text-white">${data.patients.filter(p => p.status === 'discharged').length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 p-5">
        <p class="text-sm text-purple-300">📊 Toplam Kayıt</p>
        <p class="text-3xl font-bold text-white">${data.patients.length}</p>
      </div>
    </div>

    <!-- Filtreler -->
    <div class="flex gap-2 mb-4 overflow-x-auto pb-2 fade-in">
      <button class="${filter === 'all' ? 'tab-active' : 'tab-inactive'}" data-filter="all">Tümü (${data.patients.length})</button>
      ${WARD_TYPES.map(w => {
        const count = data.patients.filter(p => p.ward === w && (p.status === 'active' || p.status === 'emergency')).length;
        return count > 0 ? `<button class="${filter === w ? 'tab-active' : 'tab-inactive'}" data-filter="${w}">${w} (${count})</button>` : '';
      }).join('')}
    </div>

    <!-- Hasta Listesi -->
    <div id="pr-list" class="space-y-3 fade-in"></div>

    <!-- Yeni Hasta Modal -->
    <div id="pr-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 class="text-xl font-bold text-white mb-4">➕ Yeni Hasta Kaydı</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Ad</label><input id="pr-name" class="input-field w-full" placeholder="Adı"></div>
            <div><label class="label">Soyad</label><input id="pr-surname" class="input-field w-full" placeholder="Soyadı"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">TC Kimlik</label><input id="pr-tc" class="input-field w-full" placeholder="11 haneli" maxlength="11"></div>
            <div><label class="label">Yaş</label><input id="pr-age" type="number" class="input-field w-full" placeholder="Yaş"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Cinsiyet</label>
              <select id="pr-gender" class="input-field w-full"><option value="E">Erkek</option><option value="K">Kadın</option></select>
            </div>
            <div>
              <label class="label">Servis</label>
              <select id="pr-ward" class="input-field w-full">${WARD_TYPES.map(w => `<option>${w}</option>`).join('')}</select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Yatak</label><input id="pr-bed" class="input-field w-full" placeholder="Örn: A-101"></div>
            <div><label class="label">Tanı</label><input id="pr-diagnosis" class="input-field w-full" placeholder="Tanı"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Sorumlu Doktor</label><input id="pr-doctor" class="input-field w-full" placeholder="Doktor"></div>
            <div><label class="label">Sorumlu Hemşire</label><input id="pr-nurse" class="input-field w-full" placeholder="Hemşire"></div>
          </div>
          <div><label class="label">Notlar</label><textarea id="pr-notes" class="input-field w-full" rows="2" placeholder="Ek notlar..."></textarea></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="pr-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="pr-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>
    </div>`;

  renderList(filter, data);

  el.querySelectorAll('[data-filter]').forEach(btn => {
    btn.onclick = () => { renderList(btn.dataset.filter, getStorage()); };
  });

  document.getElementById('pr-add')?.addEventListener('click', () => {
    document.getElementById('pr-modal').classList.remove('hidden');
  });
  document.getElementById('pr-cancel')?.addEventListener('click', () => {
    document.getElementById('pr-modal').classList.add('hidden');
  });
  document.getElementById('pr-save')?.addEventListener('click', () => {
    const name = document.getElementById('pr-name').value.trim();
    const surname = document.getElementById('pr-surname').value.trim();
    if (!name || !surname) { alert('Ad ve soyad zorunludur'); return; }
    const d = getStorage();
    d.patients.push({
      id: d.nextId++, name, surname,
      tc: document.getElementById('pr-tc').value,
      age: parseInt(document.getElementById('pr-age').value) || 0,
      gender: document.getElementById('pr-gender').value,
      ward: document.getElementById('pr-ward').value,
      bed: document.getElementById('pr-bed').value,
      diagnosis: document.getElementById('pr-diagnosis').value,
      doctor: document.getElementById('pr-doctor').value,
      nurse: document.getElementById('pr-nurse').value,
      notes: document.getElementById('pr-notes').value ? [{ text: document.getElementById('pr-notes').value, date: new Date().toISOString() }] : [],
      treatments: [], vitals: [],
      status: 'active', admitDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    });
    setStorage(d);
    document.getElementById('pr-modal').classList.add('hidden');
    renderPatientRecordsPage(document.getElementById('content'));
  });
}

function renderList(filter, data) {
  const container = document.getElementById('pr-list');
  if (!container) return;
  let patients = data.patients;
  if (filter !== 'all') patients = patients.filter(p => p.ward === filter);
  patients = patients.sort((a, b) => {
    if (a.status === 'emergency' && b.status !== 'emergency') return -1;
    if (b.status === 'emergency' && a.status !== 'emergency') return 1;
    return (b.status === 'active') - (a.status === 'active');
  });

  if (patients.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🏥</div><div class="title">Hasta bulunamadı</div></div>`;
    return;
  }

  container.innerHTML = patients.map(p => {
    const st = STATUS_MAP[p.status] || STATUS_MAP.active;
    const daysStayed = Math.ceil((new Date() - new Date(p.admitDate)) / 86400000);
    return `<div class="card cursor-pointer hover:bg-white/10 transition pr-detail" data-id="${p.id}">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-${st.color}-500/15 flex items-center justify-center text-2xl">${st.icon}</div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-base font-semibold text-white">${p.name} ${p.surname}</h3>
            <span class="badge bg-${st.color}-500/15 text-${st.color}-300">${st.label}</span>
          </div>
          <p class="text-xs text-slate-400">${p.ward} · ${p.bed} · ${p.diagnosis}</p>
          <p class="text-xs text-slate-500 mt-1">🩺 ${p.doctor} · 👩‍⚕️ ${p.nurse} · ${daysStayed} gün yatılı</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">Giriş</p>
          <p class="text-sm text-white">${p.admitDate}</p>
        </div>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.pr-detail').forEach(card => {
    card.onclick = () => showPatientDetail(parseInt(card.dataset.id), data);
  });
}

function showPatientDetail(id, data) {
  const p = data.patients.find(pt => pt.id === id);
  if (!p) return;
  const st = STATUS_MAP[p.status] || STATUS_MAP.active;
  const daysStayed = Math.ceil((new Date() - new Date(p.admitDate)) / 86400000);

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-14 h-14 rounded-xl bg-${st.color}-500/15 flex items-center justify-center text-2xl">${st.icon}</div>
          <div>
            <h2 class="text-xl font-bold text-white">${p.name} ${p.surname}</h2>
            <p class="text-sm text-slate-400">#${p.id} · ${p.age} yaşında · ${p.gender === 'E' ? 'Erkek' : 'Kadın'}</p>
          </div>
        </div>
        <button class="text-slate-400 hover:text-white text-2xl" id="pr-close">✕</button>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="rounded-xl bg-white/5 p-4">
          <p class="text-xs text-slate-400 mb-1">Tanı</p>
          <p class="text-sm text-white font-medium">${p.diagnosis}</p>
        </div>
        <div class="rounded-xl bg-white/5 p-4">
          <p class="text-xs text-slate-400 mb-1">Servis / Yatak</p>
          <p class="text-sm text-white font-medium">${p.ward} · ${p.bed}</p>
        </div>
        <div class="rounded-xl bg-white/5 p-4">
          <p class="text-xs text-slate-400 mb-1">Sorumlu Doktor</p>
          <p class="text-sm text-white font-medium">${p.doctor}</p>
        </div>
        <div class="rounded-xl bg-white/5 p-4">
          <p class="text-xs text-slate-400 mb-1">Sorumlu Hemşire</p>
          <p class="text-sm text-white font-medium">${p.nurse}</p>
        </div>
      </div>

      <div class="rounded-xl bg-white/5 p-4 mb-4">
        <p class="text-xs text-slate-400 mb-1">Yatış Tarihi</p>
        <p class="text-sm text-white">${p.admitDate} · <span class="text-cyan-300">${daysStayed} gündür yatılı</span></p>
      </div>

      ${p.notes.length > 0 ? `
      <div class="rounded-xl bg-white/5 p-4 mb-4">
        <p class="text-xs text-slate-400 mb-2">📝 Notlar</p>
        ${p.notes.map(n => `<p class="text-sm text-slate-300 mb-1">• ${n.text} <span class="text-xs text-slate-500">(${new Date(n.date).toLocaleDateString('tr-TR')})</span></p>`).join('')}
      </div>` : ''}

      <div class="flex gap-3">
        ${p.status === 'active' || p.status === 'emergency' ? `
          <button class="btn-primary flex-1" id="pr-discharge">✅ Taburcu Et</button>
          <button class="btn-secondary flex-1" id="pr-add-note">📝 Not Ekle</button>
        ` : ''}
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.getElementById('pr-close')?.addEventListener('click', () => modal.remove());
  document.getElementById('pr-discharge')?.addEventListener('click', () => {
    const d = getStorage();
    const pt = d.patients.find(pt => pt.id === id);
    if (pt) { pt.status = 'discharged'; pt.dischargeDate = new Date().toISOString().slice(0, 10); setStorage(d); }
    modal.remove();
    renderPatientRecordsPage(document.getElementById('content'));
  });
  document.getElementById('pr-add-note')?.addEventListener('click', () => {
    const note = prompt('Not girin:');
    if (!note) return;
    const d = getStorage();
    const pt = d.patients.find(pt => pt.id === id);
    if (pt) { pt.notes.push({ text: note, date: new Date().toISOString() }); setStorage(d); }
    modal.remove();
    showPatientDetail(id, getStorage());
  });
}
