// ===== TOPLANTI ODASI REZERVASYONU =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_room_bookings';

const ROOMS = [
  { id: 1, name: 'Konferans Salonu A', floor: '1. Kat', capacity: 30, equipment: ['Projektor', 'Beyaz Tahta', 'Ses Sistemi', 'Video Konferans'], icon: '🏛️' },
  { id: 2, name: 'Toplantı Odası B', floor: '2. Kat', capacity: 12, equipment: ['Projektor', 'Beyaz Tahta'], icon: '🏢' },
  { id: 3, name: 'Eğitim Salonu', floor: '3. Kat', capacity: 50, equipment: ['Projektor', 'Ses Sistemi', 'Mikrofon', 'Kamera'], icon: '🎓' },
  { id: 4, name: 'Küçük Toplantı Odası', floor: '1. Kat', capacity: 6, equipment: ['TV Ekran', 'Beyaz Tahta'], icon: '💼' },
  { id: 5, name: 'Yönetim Kurulu Odası', floor: '4. Kat', capacity: 15, equipment: ['Projektor', 'Video Konferans', 'Ses Sistemi', 'Klima'], icon: '👔' },
  { id: 6, name: 'Kreatif Oda', floor: '2. Kat', capacity: 8, equipment: ['Beyaz Tahta', 'TV Ekran', 'Post-it Duvarı'], icon: '🎨' },
];

function getBookings() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultBookings(); } catch { return getDefaultBookings(); } }
function saveBookings(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultBookings() {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: 1, roomId: 1, date: today, startTime: '09:00', endTime: '10:30', title: 'Haftalık Değerlendirme', organizer: 'Dr. Ayşe Yılmaz', participants: 12 },
    { id: 2, roomId: 2, date: today, startTime: '10:00', endTime: '11:00', title: 'Ekip Toplantısı', organizer: 'Mehmet Kaya', participants: 8 },
    { id: 3, roomId: 3, date: today, startTime: '14:00', endTime: '16:00', title: 'İlk Yardım Eğitimi', organizer: 'Hem. Fatma Çelik', participants: 25 },
    { id: 4, roomId: 5, date: today, startTime: '11:00', endTime: '12:00', title: 'Yönetim Kurulu', organizer: 'Başhekim', participants: 10 },
  ];
}

export function renderMeetingRoomsPage(el) {
  const bookings = getBookings();
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === today);
  const hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🏢 Toplantı Odası Rezervasyonu</h1>
          <p class="text-slate-400 text-sm mt-1">Oda müsaitlik durumu ve rezervasyon yönetimi</p>
        </div>
        <div class="flex gap-2">
          <input id="booking-date" type="date" class="input-field text-xs" value="${today}">
          <button id="add-booking-btn" class="btn-primary">➕ Rezervasyon</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${ROOMS.length}</p><p class="text-xs text-slate-400">🏢 Toplam Oda</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${ROOMS.length - todayBookings.length}</p><p class="text-xs text-slate-400">✅ Şu an Müsait</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${todayBookings.length}</p><p class="text-xs text-slate-400">📅 Bugünkü Rezervasyon</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${todayBookings.reduce((s, b) => s + (b.participants || 0), 0)}</p><p class="text-xs text-slate-400">👥 Toplam Katılımcı</p></div>
    </div>

    <!-- Timeline Grid -->
    <div class="card fade-in overflow-x-auto">
      <h3 class="text-lg font-semibold text-white mb-4">📅 Bugünkü Rezervasyonlar - Timeline</h3>
      <div class="min-w-[700px]">
        <div class="grid gap-1" style="grid-template-columns: 140px repeat(${hours.length}, 1fr)">
          <div class="text-xs font-semibold text-slate-500 p-2">Oda</div>
          ${hours.map(h => `<div class="text-[10px] text-center text-slate-500 p-1">${h}</div>`).join('')}
          ${ROOMS.map(room => {
            const roomBookings = todayBookings.filter(b => b.roomId === room.id);
            return `
              <div class="text-xs text-slate-300 p-2 border-t border-white/5 flex items-center gap-1">
                <span>${room.icon}</span>
                <span class="truncate">${room.name}</span>
              </div>
              ${hours.map(h => {
                const booking = roomBookings.find(b => b.startTime <= h && b.endTime > h);
                if (booking) {
                  const isStart = booking.startTime === h;
                  return `<div class="bg-cyan-500/20 border border-cyan-500/30 rounded p-1 min-h-[36px] text-[10px] text-cyan-200 ${isStart ? 'font-semibold' : ''}" title="${booking.title} - ${booking.organizer}">${isStart ? booking.title.substring(0, 15) : ''}</div>`;
                }
                return `<div class="bg-white/[0.02] border border-white/5 rounded min-h-[36px] hover:bg-white/5 transition cursor-pointer room-slot" data-room="${room.id}" data-hour="${h}"></div>`;
              }).join('')}
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Room Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 fade-in">
      ${ROOMS.map(room => {
        const roomBookings = todayBookings.filter(b => b.roomId === room.id);
        const nextBooking = roomBookings.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
        const isOccupied = nextBooking && nextBooking.startTime <= new Date().toTimeString().slice(0, 5) && nextBooking.endTime > new Date().toTimeString().slice(0, 5);
        return `
        <div class="card hover:border-cyan-500/30 transition cursor-pointer room-card" data-room="${room.id}">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-3xl">${room.icon}</span>
            <div>
              <h4 class="font-semibold text-white text-sm">${room.name}</h4>
              <p class="text-xs text-slate-500">${room.floor} · 👥 ${room.capacity} kişi</p>
            </div>
            <span class="ml-auto text-[10px] px-2 py-0.5 rounded-full ${isOccupied ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}">${isOccupied ? '🔴 Dolu' : '🟢 Müsait'}</span>
          </div>
          <div class="flex flex-wrap gap-1 mb-3">
            ${room.equipment.map(e => `<span class="text-[10px] bg-white/10 rounded-full px-2 py-0.5 text-slate-400">${e}</span>`).join('')}
          </div>
          ${roomBookings.length > 0 ? `
            <div class="space-y-1">
              ${roomBookings.slice(0, 3).map(b => `<p class="text-[10px] text-slate-400">🕐 ${b.startTime}-${b.endTime} ${b.title}</p>`).join('')}
            </div>
          ` : '<p class="text-[10px] text-green-400/60">Bugün tüm gün müsait</p>'}
        </div>`;
      }).join('')}
    </div>`;

  el.querySelector('#add-booking-btn')?.addEventListener('click', () => showBookingModal(el));
}

function showBookingModal(el) {
  const existing = document.getElementById('booking-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'booking-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  const today = new Date().toISOString().split('T')[0];
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">🏢 Oda Rezervasyonu</h3>
      <div class="space-y-3">
        <div><label class="label">Oda *</label><select id="b-room" class="input-field w-full">${ROOMS.map(r => `<option value="${r.id}">${r.icon} ${r.name} (${r.capacity} kişi)</option>`).join('')}</select></div>
        <div><label class="label">Tarih *</label><input id="b-date" type="date" class="input-field w-full" value="${today}"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Başlangıç *</label><input id="b-start" type="time" class="input-field w-full" value="09:00"></div>
          <div><label class="label">Bitiş *</label><input id="b-end" type="time" class="input-field w-full" value="10:00"></div>
        </div>
        <div><label class="label">Toplantı Başlığı *</label><input id="b-title" class="input-field w-full" placeholder="Ekip toplantısı"></div>
        <div><label class="label">Organizatör</label><input id="b-organizer" class="input-field w-full" placeholder="Adı Soyadı"></div>
        <div><label class="label">Katılımcı Sayısı</label><input id="b-participants" type="number" class="input-field w-full" value="5" min="1"></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="b-save" class="btn-primary flex-1">💾 Rezerve Et</button>
        <button id="b-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#b-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#b-save').onclick = () => {
    const title = modal.querySelector('#b-title').value.trim();
    const date = modal.querySelector('#b-date').value;
    if (!title || !date) { showToast('Başlık ve tarih zorunludur', 'error'); return; }
    const bookings = getBookings();
    const newBooking = {
      id: Date.now(), roomId: parseInt(modal.querySelector('#b-room').value), date,
      startTime: modal.querySelector('#b-start').value, endTime: modal.querySelector('#b-end').value,
      title, organizer: modal.querySelector('#b-organizer').value.trim(),
      participants: parseInt(modal.querySelector('#b-participants').value) || 5
    };
    // Check conflict
    const conflict = bookings.find(b => b.roomId === newBooking.roomId && b.date === date && b.startTime < newBooking.endTime && b.endTime > newBooking.startTime);
    if (conflict) { showToast(`Çakışma: "${conflict.title}" (${conflict.startTime}-${conflict.endTime})`, 'error'); return; }
    bookings.push(newBooking);
    saveBookings(bookings);
    modal.remove();
    showToast('Rezervasyon oluşturuldu!', 'success');
    renderMeetingRoomsPage(el);
  };
}
