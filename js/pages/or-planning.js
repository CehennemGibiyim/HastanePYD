// ===== AMELİYATHANE PLANLAMA (OR PLANNING) =====
const STORAGE_KEY = 'or_planning';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const today = new Date().toISOString().slice(0, 10);
  const d = [
    { id: 1, patientName: 'Ahmet Yılmaz', procedure: 'Appendektomi', surgeon: 'Dr. Çelik', anesthesiologist: 'Dr. Yıldız', orRoom: 'OR-1', date: today, startTime: '08:00', endTime: '09:30', duration: 90, status: 'completed', priority: 'elective', notes: 'Laparoskopik', team: ['Hemşire Ayşe', 'Teknisyen Mehmet'] },
    { id: 2, patientName: 'Fatma Demir', procedure: 'Kolesistektomi', surgeon: 'Dr. Arslan', anesthesiologist: 'Dr. Yıldız', orRoom: 'OR-2', date: today, startTime: '10:00', endTime: '12:00', duration: 120, status: 'in-progress', priority: 'urgent', notes: 'Açık yöntem', team: ['Hemşire Zeynep', 'Teknisyen Ali'] },
    { id: 3, patientName: 'Mehmet Öz', procedure: 'Redüksiyon + Fiksasyon', surgeon: 'Dr. Kaya', anesthesiologist: 'Dr. Aydın', orRoom: 'OR-3', date: today, startTime: '13:00', endTime: '15:00', duration: 120, status: 'scheduled', priority: 'elective', notes: 'Sol radius', team: ['Hemşire Fatma'] },
    { id: 4, patientName: 'Ayşe Kaya', procedure: 'Tiroid lobektomi', surgeon: 'Dr. Çelik', anesthesiologist: 'Dr. Yıldız', orRoom: 'OR-1', date: today, startTime: '14:00', endTime: '16:00', duration: 120, status: 'scheduled', priority: 'elective', notes: '', team: ['Hemşire Ayşe'] },
  ];
  saveData(d); return d;
}
const OR_ROOMS = ['OR-1', 'OR-2', 'OR-3', 'OR-4', 'OR-5'];
const STATUSES = { scheduled: { label: 'Planlandı', color: 'blue', icon: '📅' }, 'in-progress': { label: 'Devam Ediyor', color: 'amber', icon: '🔴' }, completed: { label: 'Tamamlandı', color: 'green', icon: '✅' }, cancelled: { label: 'İptal', color: 'red', icon: '❌' } };
const PRIORITIES = { emergency: { label: 'Acil', color: 'red' }, urgent: { label: 'Öncelikli', color: 'amber' }, elective: { label: 'Elektif', color: 'cyan' } };

export function renderORPlanningPage(el) {
  let data = getData();
  let filterDate = new Date().toISOString().slice(0, 10);
  function render() {
    const filtered = data.filter(d => d.date === filterDate);
    const inProgress = filtered.filter(d => d.status === 'in-progress').length;
    const scheduled = filtered.filter(d => d.status === 'scheduled').length;
    const completed = filtered.filter(d => d.status === 'completed').length;
    const totalMinutes = filtered.reduce((s, d) => s + d.duration, 0);
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">🔪 Ameliyathane Planlama</h1><p class="text-slate-400 text-sm mt-1">OR takvimi, cerrah/ameliyathane eşleştirme</p></div>
        <div class="flex gap-2"><input type="date" class="input-field" id="or-date" value="${filterDate}"><button id="add-or-btn" class="btn-primary">+ Ameliyat</button></div>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${filtered.length}</p><p class="text-xs text-slate-400">🔪 Toplam Ameliyat</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${inProgress}</p><p class="text-xs text-slate-400">🔴 Devam Eden</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${scheduled}</p><p class="text-xs text-slate-400">📅 Planlanan</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-green-300">${Math.round(totalMinutes / 60)}s</p><p class="text-xs text-slate-400">⏱️ Toplam Süre</p></div>
      </div>
      <div class="space-y-4">${OR_ROOMS.map(room => {
        const roomSurgs = filtered.filter(d => d.orRoom === room).sort((a, b) => a.startTime.localeCompare(b.startTime));
        return roomSurgs.length === 0 ? `<div class="card"><div class="flex items-center justify-between"><h3 class="text-sm font-semibold text-slate-400">${room}</h3><span class="text-xs text-slate-600">Boş</span></div></div>` :
          `<div class="card"><h3 class="text-sm font-semibold text-white mb-3">🏥 ${room}</h3><div class="space-y-3">${roomSurgs.map(d => {
            const st = STATUSES[d.status]; const pr = PRIORITIES[d.priority];
            return `<div class="rounded-xl bg-white/5 p-3 border-l-4 border-${st.color}-500">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-2 mb-1"><span>${st.icon}</span><h4 class="text-base font-bold text-white">${d.procedure}</h4><span class="badge bg-${pr.color}-500/20 text-${pr.color}-300">${pr.label}</span></div>
                  <p class="text-xs text-slate-400">👤 ${d.patientName} · 🩺 ${d.surgeon} · 💉 ${d.anesthesiologist}</p>
                  <p class="text-xs text-slate-400">⏰ ${d.startTime} - ${d.endTime} (${d.duration} dk) · 👥 ${d.team.join(', ')}</p>
                  ${d.notes ? `<p class="text-xs text-amber-400 mt-1">📝 ${d.notes}</p>` : ''}
                </div>
                <div class="flex gap-1">${d.status === 'scheduled' ? `<button class="btn-primary text-xs py-1 px-2 start-or" data-id="${d.id}">▶ Başlat</button>` : ''}${d.status === 'in-progress' ? `<button class="btn-primary text-xs py-1 px-2 complete-or" data-id="${d.id}">✅ Bitir</button>` : ''}</div>
              </div>
            </div>`;
          }).join('')}</div></div>`;
      }).join('')}</div>
    </div>`;
    document.getElementById('or-date')?.addEventListener('change', e => { filterDate = e.target.value; render(); });
    document.querySelectorAll('.start-or').forEach(b => b.onclick = () => { const d = data.find(x => x.id === +b.dataset.id); if (d) { d.status = 'in-progress'; saveData(data); render(); } });
    document.querySelectorAll('.complete-or').forEach(b => b.onclick = () => { const d = data.find(x => x.id === +b.dataset.id); if (d) { d.status = 'completed'; saveData(data); render(); } });
    document.getElementById('add-or-btn')?.addEventListener('click', showAdd);
  }
  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">🔪 Yeni Ameliyat Planla</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Hasta</label><input id="or-name" class="input-field w-full"></div><div><label class="label">Prosedür</label><input id="or-proc" class="input-field w-full"></div></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Cerrah</label><input id="or-surgeon" class="input-field w-full"></div><div><label class="label">Anestezi</label><input id="or-anesth" class="input-field w-full"></div></div>
        <div class="grid grid-cols-3 gap-3"><div><label class="label">OR</label><select id="or-room" class="input-field w-full">${OR_ROOMS.map(r => `<option>${r}</option>`).join('')}</select></div><div><label class="label">Öncelik</label><select id="or-priority" class="input-field w-full"><option value="elective">Elektif</option><option value="urgent">Öncelikli</option><option value="emergency">Acil</option></select></div><div><label class="label">Süre (dk)</label><input id="or-dur" type="number" class="input-field w-full" value="90"></div></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Başlangıç</label><input id="or-start" type="time" class="input-field w-full"></div><div><label class="label">Notlar</label><input id="or-notes" class="input-field w-full"></div></div>
      </div>
      <div class="flex gap-3 mt-5"><button id="or-save" class="btn-primary flex-1">💾 Kaydet</button><button id="or-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('or-cancel').onclick = () => modal.remove();
    document.getElementById('or-save').onclick = () => {
      const name = document.getElementById('or-name').value.trim();
      if (!name) return;
      const dur = +document.getElementById('or-dur').value || 90;
      const start = document.getElementById('or-start').value || '08:00';
      const [h, m] = start.split(':').map(Number);
      const endM = h * 60 + m + dur;
      data.push({ id: Date.now(), patientName: name, procedure: document.getElementById('or-proc').value, surgeon: document.getElementById('or-surgeon').value, anesthesiologist: document.getElementById('or-anesth').value, orRoom: document.getElementById('or-room').value, date: filterDate, startTime: start, endTime: `${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`, duration: dur, status: 'scheduled', priority: document.getElementById('or-priority').value, notes: document.getElementById('or-notes').value, team: [] });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
