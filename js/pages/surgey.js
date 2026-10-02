// ===== AMELIYATHANE PLANLAMA =====
import { getPersonnel } from '../state.js';

function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_surgery') || '{"surgeries":[],"rooms":[],"nextId":1}'); } catch { return { surgeries: [], rooms: [], nextId: 1 }; }
}
function setStorage(d) { localStorage.setItem('hospital_surgery', JSON.stringify(d)); }

const SURGERY_TYPES = [
  { id: 'general', label: 'Genel Cerrahi', icon: '🔪', avgDuration: 120 },
  { id: 'orthopedic', label: 'Ortopedi', icon: '🦴', avgDuration: 90 },
  { id: 'cardiac', label: 'Kardiyovasküler', icon: '❤️', avgDuration: 240 },
  { id: 'neuro', label: 'Nöroşirürji', icon: '🧠', avgDuration: 180 },
  { id: 'ophthalmology', label: 'Göz', icon: '👁️', avgDuration: 60 },
  { id: 'ent', label: 'KBB', icon: '👂', avgDuration: 45 },
  { id: 'urology', label: 'Üroloji', icon: '🫘', avgDuration: 90 },
  { id: 'obstetric', label: 'Kadın Doğum', icon: '👶', avgDuration: 60 },
  { id: 'emergency', label: 'Acil', icon: '🚨', avgDuration: 90 },
];

const PRIORITY_MAP = {
  elective: { label: 'Planlı', color: 'blue', icon: '📋' },
  urgent: { label: 'Acil', color: 'amber', icon: '⚠️' },
  emergency: { label: 'Acil Müdahale', color: 'red', icon: '🚨' },
};

const STATUS_MAP = {
  scheduled: { label: 'Planlandı', color: 'blue', icon: '📅' },
  in_progress: { label: 'Devam Ediyor', color: 'amber', icon: '⚕️' },
  completed: { label: 'Tamamlandı', color: 'emerald', icon: '✅' },
  cancelled: { label: 'İptal', color: 'red', icon: '❌' },
};

function seedData() {
  const data = getStorage();
  if (data.surgeries.length > 0) return;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const personnel = getPersonnel({}).filter(p => p.status === 'active');
  const doctors = personnel.filter(p => p.title?.toLowerCase().includes('dr') || p.title?.toLowerCase().includes('doktor'));
  const nurses = personnel.filter(p => p.title?.toLowerCase().includes('hemşire') || p.title?.toLowerCase().includes('hemsire'));

  data.surgeries = [
    { id: data.nextId++, patientName: 'Ahmet Yılmaz', patientAge: 45, diagnosis: 'Kolesistektomi', type: 'general', priority: 'elective', status: 'scheduled', date: today, startTime: '08:00', duration: 90, room: 'Ameliyathane 1', surgeon: doctors[0]?.name + ' ' + doctors[0]?.surname || 'Dr. Arslan', anesthesiologist: 'Dr. Anestezi', nurse: nurses[0]?.name + ' ' + nurses[0]?.surname || 'Hem. Fatma', notes: 'Laparoskopik yaklaşım planlandı', createdAt: new Date().toISOString() },
    { id: data.nextId++, patientName: 'Mehmet Kaya', patientAge: 34, diagnosis: 'Apandisit', type: 'general', priority: 'urgent', status: 'scheduled', date: today, startTime: '10:00', duration: 60, room: 'Ameliyathane 2', surgeon: doctors[1]?.name + ' ' + doctors[1]?.surname || 'Dr. Mehmet', anesthesiologist: 'Dr. Anestezi', nurse: nurses[1]?.name + ' ' + nurses[1]?.surname || 'Hem. Zeynep', notes: '', createdAt: new Date().toISOString() },
    { id: data.nextId++, patientName: 'Ayşe Demir', patientAge: 67, diagnosis: 'Koroner Baypas', type: 'cardiac', priority: 'urgent', status: 'scheduled', date: tomorrow, startTime: '07:00', duration: 240, room: 'Ameliyathane 3', surgeon: doctors[2]?.name + ' ' + doctors[2]?.surname || 'Dr. Can', anesthesiologist: 'Dr. Kardiyak Anestezi', nurse: nurses[2]?.name + ' ' + nurses[2]?.surname || 'Hem. Sultan', notes: 'EKG ve ekokardiografi tamamlandı', createdAt: new Date().toISOString() },
  ];
  setStorage(data);
}

export function renderSurgeryPage(el) {
  seedData();
  const data = getStorage();
  const tab = data._tab || 'today';

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🏥 Ameliyathane Planlama</h1>
          <p class="text-slate-400 text-sm mt-1">Ameliyat programı, ekip atama ve oda yönetimi</p>
        </div>
        <button id="surg-add" class="btn-primary">➕ Yeni Ameliyat</button>
      </div>
    </div>

    <!-- KPI -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 p-5">
        <p class="text-sm text-blue-300">📅 Bugün Planlı</p>
        <p class="text-3xl font-bold text-white">${data.surgeries.filter(s => s.date === new Date().toISOString().slice(0, 10) && s.status === 'scheduled').length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5">
        <p class="text-sm text-amber-300">⚕️ Devam Eden</p>
        <p class="text-3xl font-bold text-white">${data.surgeries.filter(s => s.status === 'in_progress').length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-5">
        <p class="text-sm text-emerald-300">✅ Tamamlanan</p>
        <p class="text-3xl font-bold text-white">${data.surgeries.filter(s => s.status === 'completed').length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 p-5">
        <p class="text-sm text-red-300">🚨 Acil</p>
        <p class="text-3xl font-bold text-white">${data.surgeries.filter(s => s.priority === 'emergency' && s.status !== 'completed').length}</p>
      </div>
    </div>

    <!-- Tab -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 fade-in">
      <button class="${tab === 'today' ? 'tab-active' : 'tab-inactive'}" data-tab="today">📅 Bugünkü Program</button>
      <button class="${tab === 'upcoming' ? 'tab-active' : 'tab-inactive'}" data-tab="upcoming">📋 Yaklaşan</button>
      <button class="${tab === 'rooms' ? 'tab-active' : 'tab-inactive'}" data-tab="rooms">🏥 Ameliyathaneler</button>
      <button class="${tab === 'history' ? 'tab-active' : 'tab-inactive'}" data-tab="history">📊 Geçmiş</button>
    </div>

    <div id="surg-content" class="fade-in"></div>

    <!-- Modal -->
    <div id="surg-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 class="text-xl font-bold text-white mb-4">➕ Yeni Ameliyat Planla</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Hasta Adı</label><input id="surg-patient" class="input-field w-full" placeholder="Hasta adı"></div>
            <div><label class="label">Yaş</label><input id="surg-age" type="number" class="input-field w-full" placeholder="Yaş"></div>
          </div>
          <div><label class="label">Tanı</label><input id="surg-diagnosis" class="input-field w-full" placeholder="Tanı/ameliyat türü"></div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Ameliyat Türü</label>
              <select id="surg-type" class="input-field w-full">${SURGERY_TYPES.map(s => `<option value="${s.id}">${s.icon} ${s.label}</option>`).join('')}</select>
            </div>
            <div>
              <label class="label">Öncelik</label>
              <select id="surg-priority" class="input-field w-full">
                <option value="elective">📋 Planlı</option>
                <option value="urgent">⚠️ Acil</option>
                <option value="emergency">🚨 Acil Müdahale</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="label">Tarih</label><input id="surg-date" type="date" class="input-field w-full" value="${new Date().toISOString().slice(0,10)}"></div>
            <div><label class="label">Saat</label><input id="surg-time" type="time" class="input-field w-full" value="08:00"></div>
            <div><label class="label">Süre (dk)</label><input id="surg-duration" type="number" class="input-field w-full" value="90"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Başcerrah</label><input id="surg-surgeon" class="input-field w-full" placeholder="Cerrah adı"></div>
            <div><label class="label">Anestezi Uzmanı</label><input id="surg-anesthesia" class="input-field w-full" placeholder="Anestezi uzmanı"></div>
          </div>
          <div><label class="label">Notlar</label><textarea id="surg-notes" class="input-field w-full" rows="2" placeholder="Ameliyat notları..."></textarea></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="surg-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="surg-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>
    </div>`;

  renderSurgTab(tab, data);
  el.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => { const d = getStorage(); d._tab = btn.dataset.tab; setStorage(d); renderSurgeryPage(el); };
  });
  document.getElementById('surg-add')?.addEventListener('click', () => document.getElementById('surg-modal').classList.remove('hidden'));
  document.getElementById('surg-cancel')?.addEventListener('click', () => document.getElementById('surg-modal').classList.add('hidden'));
  document.getElementById('surg-save')?.addEventListener('click', () => {
    const patient = document.getElementById('surg-patient').value.trim();
    if (!patient) { alert('Hasta adı zorunludur'); return; }
    const d = getStorage();
    d.surgeries.push({
      id: d.nextId++, patientName: patient,
      patientAge: parseInt(document.getElementById('surg-age').value) || 0,
      diagnosis: document.getElementById('surg-diagnosis').value,
      type: document.getElementById('surg-type').value,
      priority: document.getElementById('surg-priority').value,
      status: 'scheduled',
      date: document.getElementById('surg-date').value,
      startTime: document.getElementById('surg-time').value,
      duration: parseInt(document.getElementById('surg-duration').value) || 90,
      room: 'Ameliyathane ' + (d.surgeries.length + 1),
      surgeon: document.getElementById('surg-surgeon').value,
      anesthesiologist: document.getElementById('surg-anesthesia').value,
      nurse: '',
      notes: document.getElementById('surg-notes').value,
      createdAt: new Date().toISOString(),
    });
    setStorage(d);
    document.getElementById('surg-modal').classList.add('hidden');
    renderSurgeryPage(document.getElementById('content'));
  });
}

function renderSurgTab(tab, data) {
  const container = document.getElementById('surg-content');
  if (!container) return;
  const today = new Date().toISOString().slice(0, 10);

  if (tab === 'today') {
    const todaySurgeries = data.surgeries.filter(s => s.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (todaySurgeries.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="icon">📅</div><div class="title">Bugün ameliyat planı yok</div></div>`;
      return;
    }
    container.innerHTML = `<div class="space-y-3">${todaySurgeries.map(s => surgeryCard(s, data)).join('')}</div>`;
  } else if (tab === 'upcoming') {
    const upcoming = data.surgeries.filter(s => s.date > today && s.status === 'scheduled').sort((a, b) => a.date.localeCompare(b.date));
    container.innerHTML = upcoming.length === 0
      ? `<div class="empty-state"><div class="icon">📋</div><div class="title">Yaklaşan ameliyat yok</div></div>`
      : `<div class="space-y-3">${upcoming.map(s => surgeryCard(s, data)).join('')}</div>`;
  } else if (tab === 'rooms') {
    const rooms = ['Ameliyathane 1', 'Ameliyathane 2', 'Ameliyathane 3', 'Ameliyathane 4'];
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${rooms.map(room => {
        const current = data.surgeries.find(s => s.room === room && s.status === 'in_progress');
        const nextSurgery = data.surgeries.filter(s => s.room === room && s.status === 'scheduled' && s.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0];
        const isOccupied = !!current;
        return `<div class="card ${isOccupied ? 'border-amber-500/30' : 'border-emerald-500/20'}">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">${isOccupied ? '🔴' : '🟢'}</span>
            <div>
              <h3 class="text-base font-semibold text-white">${room}</h3>
              <p class="text-xs ${isOccupied ? 'text-amber-300' : 'text-emerald-300'}">${isOccupied ? 'Meşgul' : 'Müsait'}</p>
            </div>
          </div>
          ${current ? `<p class="text-sm text-slate-300">Hasta: ${current.patientName}</p><p class="text-xs text-slate-400">${current.diagnosis} · ${current.surgeon}</p>` : ''}
          ${nextSurgery ? `<div class="mt-3 pt-3 border-t border-white/10"><p class="text-xs text-slate-400">Sıradaki: ${nextSurgery.date} ${nextSurgery.startTime}</p><p class="text-sm text-white">${nextSurgery.patientName} · ${nextSurgery.diagnosis}</p></div>` : ''}
        </div>`;
      }).join('')}
    </div>`;
  } else if (tab === 'history') {
    const completed = data.surgeries.filter(s => s.status === 'completed').sort((a, b) => b.date.localeCompare(a.date));
    container.innerHTML = completed.length === 0
      ? `<div class="empty-state"><div class="icon">📊</div><div class="title">Tamamlanan ameliyat yok</div></div>`
      : `<div class="space-y-3">${completed.map(s => surgeryCard(s, data)).join('')}</div>`;
  }

  // Action buttons
  container.querySelectorAll('.surg-start').forEach(btn => {
    btn.onclick = () => { const d = getStorage(); const s = d.surgeries.find(s => s.id === parseInt(btn.dataset.id)); if (s) { s.status = 'in_progress'; setStorage(d); renderSurgeryPage(document.getElementById('content')); } };
  });
  container.querySelectorAll('.surg-complete').forEach(btn => {
    btn.onclick = () => { const d = getStorage(); const s = d.surgeries.find(s => s.id === parseInt(btn.dataset.id)); if (s) { s.status = 'completed'; setStorage(d); renderSurgeryPage(document.getElementById('content')); } };
  });
  container.querySelectorAll('.surg-cancel').forEach(btn => {
    btn.onclick = () => { if (!confirm('Ameliyatı iptal etmek istediğinize emin misiniz?')) return; const d = getStorage(); const s = d.surgeries.find(s => s.id === parseInt(btn.dataset.id)); if (s) { s.status = 'cancelled'; setStorage(d); renderSurgeryPage(document.getElementById('content')); } };
  });
}

function surgeryCard(s, data) {
  const type = SURGERY_TYPES.find(t => t.id === s.type);
  const pri = PRIORITY_MAP[s.priority] || PRIORITY_MAP.elective;
  const st = STATUS_MAP[s.status] || STATUS_MAP.scheduled;
  const endTime = (() => {
    const [h, m] = s.startTime.split(':').map(Number);
    const end = new Date(2000, 0, 1, h, m + s.duration);
    return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  })();

  return `<div class="card ${s.status === 'in_progress' ? 'border-amber-500/30' : ''}">
    <div class="flex flex-col md:flex-row md:items-center gap-4">
      <div class="flex items-center gap-3 flex-1">
        <span class="text-3xl">${type?.icon || '🔪'}</span>
        <div>
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-base font-semibold text-white">${s.patientName} (${s.patientAge})</h3>
            <span class="badge bg-${pri.color}-500/15 text-${pri.color}-300">${pri.icon} ${pri.label}</span>
            <span class="badge bg-${st.color}-500/15 text-${st.color}-300">${st.icon} ${st.label}</span>
          </div>
          <p class="text-sm text-slate-300">${s.diagnosis}</p>
          <p class="text-xs text-slate-400 mt-1">🩺 ${s.surgeon} · 💉 ${s.anesthesiologist} · ${s.room}</p>
          ${s.notes ? `<p class="text-xs text-slate-500 mt-1">📝 ${s.notes}</p>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-center">
          <p class="text-lg font-bold text-white">${s.startTime} - ${endTime}</p>
          <p class="text-xs text-slate-400">${s.duration} dakika</p>
          <p class="text-xs text-slate-500">${s.date}</p>
        </div>
        <div class="flex gap-2">
          ${s.status === 'scheduled' ? `<button class="btn-primary text-xs px-3 py-2 surg-start" data-id="${s.id}">▶ Başlat</button>` : ''}
          ${s.status === 'in_progress' ? `<button class="btn-primary text-xs px-3 py-2 surg-complete" data-id="${s.id}">✅ Tamamla</button>` : ''}
          ${s.status === 'scheduled' ? `<button class="btn-secondary text-xs px-3 py-2 surg-cancel" data-id="${s.id}">❌</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}
