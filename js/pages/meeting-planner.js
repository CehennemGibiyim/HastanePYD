// ===== TOPLANTI PLANLAYICI =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_meetings';

function getMeetings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveMeetings(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

export function renderMeetingPlannerPage(el) {
  const meetings = getMeetings();
  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.date + 'T' + m.time) >= now).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = meetings.filter(m => new Date(m.date + 'T' + m.time) < now).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const personnel = getPersonnel({});

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📹 Toplantı Planlayıcı</h1>
          <p class="text-slate-400 text-sm mt-1">Toplantı oluştur, katılımcı ekle, takvimde görüntüle</p>
        </div>
        <button id="add-meeting-btn" class="btn-primary">➕ Yeni Toplantı</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center">
        <p class="text-3xl font-bold text-cyan-300">${upcoming.length}</p>
        <p class="text-xs text-slate-400 mt-1">📅 Yaklaşan</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-green-300">${meetings.filter(m => m.status === 'completed').length}</p>
        <p class="text-xs text-slate-400 mt-1">✅ Tamamlanan</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-amber-300">${meetings.filter(m => m.recurring).length}</p>
        <p class="text-xs text-slate-400 mt-1">🔁 Tekrarlayan</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-purple-300">${meetings.reduce((s, m) => s + (m.participants?.length || 0), 0)}</p>
        <p class="text-xs text-slate-400 mt-1">👥 Toplam Katılımcı</p>
      </div>
    </div>

    ${upcoming.length > 0 ? `
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📅 Yaklaşan Toplantılar</h3>
      <div class="space-y-3">
        ${upcoming.map(m => meetingCard(m, personnel)).join('')}
      </div>
    </div>` : ''}

    ${past.length > 0 ? `
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Geçmiş Toplantılar</h3>
      <div class="space-y-3">
        ${past.slice(0, 10).map(m => meetingCard(m, personnel, true)).join('')}
      </div>
    </div>` : ''}

    ${meetings.length === 0 ? `
    <div class="empty-state fade-in">
      <div class="icon">📹</div>
      <div class="title">Henüz toplantı yok</div>
      <div class="desc">İlk toplantınızı oluşturmak için yukarıdaki butona tıklayın</div>
    </div>` : ''}`;

  el.querySelector('#add-meeting-btn')?.addEventListener('click', () => showMeetingModal(el, personnel));
  el.querySelectorAll('.meeting-join-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const meeting = meetings.find(m => m.id === btn.dataset.id);
      if (meeting?.link) { window.open(meeting.link, '_blank'); showToast('Toplantıya katılıyorsunuz...', 'success'); }
      else showToast('Toplantı linki tanımlanmamış', 'error');
    });
  });
  el.querySelectorAll('.meeting-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const updated = meetings.filter(m => m.id !== btn.dataset.id);
      saveMeetings(updated);
      showToast('Toplantı silindi', 'success');
      renderMeetingPlannerPage(el);
    });
  });
  el.querySelectorAll('.meeting-complete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = getMeetings();
      const m = list.find(x => x.id === btn.dataset.id);
      if (m) { m.status = 'completed'; saveMeetings(list); showToast('Toplantı tamamlandı', 'success'); renderMeetingPlannerPage(el); }
    });
  });
}

function meetingCard(m, personnel, isPast = false) {
  const dateObj = new Date(m.date);
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const participantNames = (m.participants || []).slice(0, 4).map(id => {
    const p = personnel.find(x => x.id === id);
    return p ? p.name.split(' ')[0] : '?';
  });
  const moreCount = Math.max(0, (m.participants?.length || 0) - 4);

  return `
    <div class="rounded-xl border ${isPast ? 'border-white/5 bg-white/[0.02]' : 'border-cyan-500/20 bg-cyan-500/5'} p-4">
      <div class="flex items-start gap-4">
        <div class="text-center min-w-[50px]">
          <p class="text-2xl font-bold text-white">${dateObj.getDate()}</p>
          <p class="text-xs text-slate-400">${monthNames[dateObj.getMonth()]}</p>
          <p class="text-[10px] text-slate-500">${dayNames[dateObj.getDay()]}</p>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-semibold text-white text-sm">${m.title}</h4>
            <span class="badge text-[10px]">${m.time} · ${m.duration || 60}dk</span>
            ${m.recurring ? '<span class="text-[10px] text-amber-400">🔁</span>' : ''}
          </div>
          ${m.description ? `<p class="text-xs text-slate-400 mb-2">${m.description}</p>` : ''}
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-slate-500">👥 ${m.participants?.length || 0} katılımcı:</span>
            ${participantNames.map(n => `<span class="text-[10px] bg-white/10 rounded-full px-2 py-0.5 text-slate-300">${n}</span>`).join('')}
            ${moreCount > 0 ? `<span class="text-[10px] text-slate-500">+${moreCount}</span>` : ''}
          </div>
          ${m.location ? `<p class="text-xs text-slate-500 mt-1">📍 ${m.location}</p>` : ''}
        </div>
        <div class="flex gap-2">
          ${!isPast && m.link ? `<button class="meeting-join-btn btn-primary text-xs px-3 py-1.5" data-id="${m.id}">🎥 Katıl</button>` : ''}
          ${!isPast ? `<button class="meeting-complete-btn btn-secondary text-xs px-3 py-1.5" data-id="${m.id}">✅</button>` : ''}
          <button class="meeting-del-btn btn-secondary text-xs px-3 py-1.5" data-id="${m.id}">🗑️</button>
        </div>
      </div>
    </div>`;
}

function showMeetingModal(el, personnel) {
  const existing = document.getElementById('meeting-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'meeting-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  const participantCheckboxes = personnel.slice(0, 30).map(p =>
    `<label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
      <input type="checkbox" value="${p.id}" class="meeting-participant"> ${p.name}
    </label>`
  ).join('');

  modal.innerHTML = `
    <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📹 Yeni Toplantı</h3>
      <div class="space-y-3">
        <div><label class="label">Toplantı Başlığı *</label><input id="m-title" class="input-field w-full" placeholder="Haftalık ekip toplantısı"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Tarih *</label><input id="m-date" type="date" class="input-field w-full"></div>
          <div><label class="label">Saat *</label><input id="m-time" type="time" class="input-field w-full" value="09:00"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Süre (dk)</label><input id="m-duration" type="number" class="input-field w-full" value="60" min="15" step="15"></div>
          <div><label class="label">Konum</label><input id="m-location" class="input-field w-full" placeholder="Toplantı Salonu A"></div>
        </div>
        <div><label class="label">Açıklama</label><textarea id="m-desc" class="input-field w-full" rows="2" placeholder="Toplantı gündem maddeleri..."></textarea></div>
        <div><label class="label">Toplantı Linki (opsiyonel)</label><input id="m-link" class="input-field w-full" placeholder="https://meet.google.com/..."></div>
        <div><label class="label">Tekrar</label>
          <select id="m-recurring" class="input-field w-full">
            <option value="">Tekrar yok</option>
            <option value="daily">Her gün</option>
            <option value="weekly">Her hafta</option>
            <option value="monthly">Her ay</option>
          </select>
        </div>
        <div>
          <label class="label">Katılımcılar</label>
          <div class="max-h-32 overflow-y-auto space-y-1 rounded-xl bg-white/5 p-3 border border-white/10">${participantCheckboxes}</div>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="m-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="m-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#m-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  const today = new Date().toISOString().split('T')[0];
  modal.querySelector('#m-date').value = today;

  modal.querySelector('#m-save').onclick = () => {
    const title = modal.querySelector('#m-title').value.trim();
    const date = modal.querySelector('#m-date').value;
    const time = modal.querySelector('#m-time').value;
    if (!title || !date) { showToast('Başlık ve tarih zorunludur', 'error'); return; }
    const participants = Array.from(modal.querySelectorAll('.meeting-participant:checked')).map(cb => parseInt(cb.value));
    const meeting = {
      id: Date.now().toString(36),
      title, date, time,
      duration: parseInt(modal.querySelector('#m-duration').value) || 60,
      location: modal.querySelector('#m-location').value.trim(),
      description: modal.querySelector('#m-desc').value.trim(),
      link: modal.querySelector('#m-link').value.trim(),
      recurring: modal.querySelector('#m-recurring').value || '',
      participants,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    const meetings = getMeetings();
    meetings.push(meeting);
    saveMeetings(meetings);
    modal.remove();
    showToast('Toplantı oluşturuldu!', 'success');
    renderMeetingPlannerPage(el);
  };
}
