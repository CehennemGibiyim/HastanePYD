// ===== VİDEO KONFERANS =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const MEETINGS = [
  { id: 1, title: 'Haftalık Departman Toplantısı', date: '2025-01-15', time: '10:00', duration: 60, organizer: 'Başhekim', participants: ['Dr. Ahmet Yılmaz', 'Hem. Fatma Demir', 'Müdür Ali Kaya'], room: 'Konferans Salonu', status: 'upcoming', link: 'https://meet.example.com/abc123' },
  { id: 2, title: 'İş Güvenliği Eğitimi', date: '2025-01-16', time: '14:00', duration: 90, organizer: 'İSG Uzmanı', participants: ['Tüm Personel'], room: 'Online', status: 'upcoming', link: 'https://meet.example.com/def456' },
  { id: 3, title: 'Performans Değerlendirme', date: '2025-01-10', time: '09:00', duration: 30, organizer: 'İK Müdürü', participants: ['Dr. Mehmet Can'], room: 'İK Ofisi', status: 'completed', link: '' },
  { id: 4, title: 'Acil Durum Tatbikatı Planlama', date: '2025-01-17', time: '11:00', duration: 45, organizer: 'Güvenlik Amiri', participants: ['Tüm Amirler'], room: 'Konferans Salonu', status: 'upcoming', link: 'https://meet.example.com/ghi789' },
];

const ROOMS = [
  { id: 'conf', name: 'Konferans Salonu', capacity: 50, equipment: ['Projektor', 'Beyaz Tahta', 'Ses Sistemi'], status: 'available' },
  { id: 'meeting1', name: 'Toplantı Odası 1', capacity: 10, equipment: ['TV', 'Beyaz Tahta'], status: 'occupied' },
  { id: 'meeting2', name: 'Toplantı Odası 2', capacity: 8, equipment: ['TV'], status: 'available' },
  { id: 'ik', name: 'İK Ofisi', capacity: 4, equipment: ['Bilgisayar'], status: 'available' },
];

export function renderVideoConferencePage(el) {
  const personnel = getPersonnel({});
  let activeTab = 'upcoming';

  function render() {
    el.innerHTML = `
      <div class="mb-6 fade-in">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-white">🎥 Video Konferans</h1>
            <p class="text-slate-400 text-sm mt-1">Toplantı planlama, oda rezervasyonu ve katılım</p>
          </div>
          <button id="new-meeting-btn" class="btn-primary text-sm">+ Yeni Toplantı</button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
        <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${MEETINGS.filter(m => m.status === 'upcoming').length}</p><p class="text-xs text-slate-400">Yaklaşan</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-green-300">${MEETINGS.filter(m => m.status === 'completed').length}</p><p class="text-xs text-slate-400">Tamamlanan</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-amber-300">${ROOMS.filter(r => r.status === 'available').length}</p><p class="text-xs text-slate-400">Boş Oda</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-purple-300">${ROOMS.length}</p><p class="text-xs text-slate-400">Toplam Oda</p></div>
      </div>

      <div class="flex gap-2 mb-6 flex-wrap fade-in">
        <button data-tab="upcoming" class="vc-tab ${activeTab === 'upcoming' ? 'tab-active' : 'tab-inactive'}">📅 Yaklaşan</button>
        <button data-tab="rooms" class="vc-tab ${activeTab === 'rooms' ? 'tab-active' : 'tab-inactive'}">🏠 Odalar</button>
        <button data-tab="history" class="vc-tab ${activeTab === 'history' ? 'tab-active' : 'tab-inactive'}">📜 Geçmiş</button>
      </div>

      <div id="vc-content" class="fade-in"></div>

      <div id="new-meeting-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
          <h3 class="text-xl font-bold text-white mb-4">📅 Yeni Toplantı</h3>
          <div class="space-y-3">
            <div><label class="label">Başlık</label><input id="mt-title" class="input-field w-full" placeholder="Toplantı başlığı"></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label">Tarih</label><input id="mt-date" type="date" class="input-field w-full"></div>
              <div><label class="label">Saat</label><input id="mt-time" type="time" class="input-field w-full"></div>
            </div>
            <div><label class="label">Süre (dk)</label><input id="mt-duration" type="number" class="input-field w-full" value="60" min="15" step="15"></div>
            <div><label class="label">Oda</label><select id="mt-room" class="input-field w-full">${ROOMS.map(r => `<option value="${r.id}">${r.name} (${r.capacity} kişi)</option>`).join('')}</select></div>
          </div>
          <div class="flex gap-3 mt-6">
            <button id="mt-save" class="btn-primary flex-1">💾 Oluştur</button>
            <button id="mt-cancel" class="btn-secondary flex-1">İptal</button>
          </div>
        </div>
      </div>`;

    document.querySelectorAll('.vc-tab').forEach(btn => {
      btn.onclick = () => { activeTab = btn.dataset.tab; render(); };
    });

    const content = document.getElementById('vc-content');
    if (activeTab === 'upcoming') renderUpcoming(content);
    else if (activeTab === 'rooms') renderRooms(content);
    else renderHistory(content);

    document.getElementById('new-meeting-btn')?.addEventListener('click', () => {
      document.getElementById('new-meeting-modal').classList.remove('hidden');
    });
    document.getElementById('mt-cancel')?.addEventListener('click', () => {
      document.getElementById('new-meeting-modal').classList.add('hidden');
    });
    document.getElementById('mt-save')?.addEventListener('click', () => {
      const title = document.getElementById('mt-title').value.trim();
      if (!title) { showToast('Başlık gereklidir', 'error'); return; }
      showToast('Toplantı oluşturuldu (demo)', 'success');
      document.getElementById('new-meeting-modal').classList.add('hidden');
    });
  }

  function renderUpcoming(container) {
    const upcoming = MEETINGS.filter(m => m.status === 'upcoming');
    container.innerHTML = `
      <div class="space-y-4">
        ${upcoming.map(m => `
          <div class="card border border-cyan-500/20">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <h4 class="text-base font-semibold text-white mb-1">🎥 ${m.title}</h4>
                <div class="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>📅 ${m.date}</span>
                  <span>🕐 ${m.time}</span>
                  <span>⏱️ ${m.duration} dk</span>
                  <span>👤 ${m.organizer}</span>
                  <span>🏠 ${m.room}</span>
                </div>
                <div class="flex flex-wrap gap-1 mt-2">
                  ${m.participants.map(p => `<span class="badge text-[10px]">${p}</span>`).join('')}
                </div>
              </div>
              <div class="flex gap-2 shrink-0">
                ${m.link ? `<a href="${m.link}" target="_blank" class="btn-primary text-xs px-3 py-1.5">🔗 Katıl</a>` : ''}
                <button class="btn-secondary text-xs px-3 py-1.5">✏️</button>
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  function renderRooms(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${ROOMS.map(r => `
          <div class="card">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-semibold text-white">🏠 ${r.name}</h4>
              <span class="badge ${r.status === 'available' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} text-[10px]">${r.status === 'available' ? 'Boş' : 'Dolu'}</span>
            </div>
            <p class="text-xs text-slate-400 mb-2">👥 Kapasite: ${r.capacity} kişi</p>
            <div class="flex flex-wrap gap-1">
              ${r.equipment.map(e => `<span class="badge text-[10px]">${e}</span>`).join('')}
            </div>
            ${r.status === 'available' ? '<button class="btn-primary w-full text-xs mt-3">📅 Rezervasyon Yap</button>' : ''}
          </div>`).join('')}
      </div>`;
  }

  function renderHistory(container) {
    const completed = MEETINGS.filter(m => m.status === 'completed');
    container.innerHTML = `
      <div class="card">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead><tr><th class="th">Toplantı</th><th class="th">Tarih</th><th class="th">Organizatör</th><th class="th">Durum</th></tr></thead>
            <tbody>
              ${completed.map(m => `
                <tr class="border-t border-white/5">
                  <td class="td text-sm text-white">${m.title}</td>
                  <td class="td text-xs">${m.date} ${m.time}</td>
                  <td class="td text-sm">${m.organizer}</td>
                  <td class="td"><span class="badge bg-green-500/20 text-green-300">✓ Tamamlandı</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  render();
}
