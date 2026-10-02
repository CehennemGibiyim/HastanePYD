// ===== INTERAKTIF HASTANE HARITASI =====
import { getPersonnel } from '../state.js';

function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_map') || '{"rooms":[],"floor":1}'); } catch { return { rooms: [], floor: 1 }; }
}
function setStorage(d) { localStorage.setItem('hospital_map', JSON.stringify(d)); }

const FLOORS = [
  { id: 0, label: 'Zemin Kat', desc: 'Acil, Poliklinik, Eczane, Laboratuvar' },
  { id: 1, label: '1. Kat', desc: 'Cerrahi Servisi, Yoğun Bakım, Ameliyathane' },
  { id: 2, label: '2. Kat', desc: 'Dahiliye, Kardiyoloji, Nöroloji' },
  { id: 3, label: '3. Kat', desc: 'Pediatri, Kadın Doğum, Kulak Burun Boğaz' },
  { id: 4, label: '4. Kat', desc: 'İdari Ofisler, Toplantı Salonu, Yemekhane' },
];

const ROOM_TYPES = [
  { id: 'patient', label: 'Hasta Odası', icon: '🛏️', color: 'blue' },
  { id: 'icu', label: 'Yoğun Bakım', icon: '❤️‍🩹', color: 'red' },
  { id: 'or', label: 'Ameliyathane', icon: '🔪', color: 'amber' },
  { id: 'office', label: 'Ofis', icon: '💼', color: 'slate' },
  { id: 'lab', label: 'Laboratuvar', icon: '🔬', color: 'purple' },
  { id: 'pharmacy', label: 'Eczane', icon: '💊', color: 'emerald' },
  { id: 'emergency', label: 'Acil', icon: '🚨', color: 'red' },
  { id: 'cafeteria', label: 'Yemekhane', icon: '🍽️', color: 'orange' },
  { id: 'meeting', label: 'Toplantı', icon: '🏢', color: 'cyan' },
  { id: 'waiting', label: 'Bekleme', icon: '🪑', color: 'slate' },
];

function seedRooms() {
  const data = getStorage();
  if (data.rooms.length > 0) return;
  const roomDefs = [
    // Zemin
    { floor: 0, name: 'Acil Servis', type: 'emergency', capacity: 20, occupied: 8, status: 'busy' },
    { floor: 0, name: 'Poliklinik A', type: 'patient', capacity: 10, occupied: 7, status: 'normal' },
    { floor: 0, name: 'Poliklinik B', type: 'patient', capacity: 10, occupied: 5, status: 'normal' },
    { floor: 0, name: 'Eczane', type: 'pharmacy', capacity: 5, occupied: 3, status: 'normal' },
    { floor: 0, name: 'Laboratuvar', type: 'lab', capacity: 8, occupied: 6, status: 'normal' },
    { floor: 0, name: 'Radyoloji', type: 'lab', capacity: 4, occupied: 2, status: 'normal' },
    { floor: 0, name: 'Bekleme Salonu', type: 'waiting', capacity: 50, occupied: 25, status: 'normal' },
    // 1. Kat
    { floor: 1, name: 'Yoğun Bakım 1', type: 'icu', capacity: 8, occupied: 7, status: 'critical' },
    { floor: 1, name: 'Yoğun Bakım 2', type: 'icu', capacity: 6, occupied: 4, status: 'busy' },
    { floor: 1, name: 'Ameliyathane 1', type: 'or', capacity: 1, occupied: 1, status: 'busy' },
    { floor: 1, name: 'Ameliyathane 2', type: 'or', capacity: 1, occupied: 0, status: 'available' },
    { floor: 1, name: 'Ameliyathane 3', type: 'or', capacity: 1, occupied: 0, status: 'available' },
    { floor: 1, name: 'Cerrahi Servisi A', type: 'patient', capacity: 12, occupied: 9, status: 'normal' },
    { floor: 1, name: 'Cerrahi Servisi B', type: 'patient', capacity: 12, occupied: 6, status: 'normal' },
    { floor: 1, name: 'Cerrahi Hemşire İstasyonu', type: 'office', capacity: 5, occupied: 3, status: 'normal' },
    // 2. Kat
    { floor: 2, name: 'Dahiliye Servisi', type: 'patient', capacity: 15, occupied: 11, status: 'normal' },
    { floor: 2, name: 'Kardiyoloji Servisi', type: 'patient', capacity: 10, occupied: 8, status: 'normal' },
    { floor: 2, name: 'Nöroloji Servisi', type: 'patient', capacity: 8, occupied: 5, status: 'normal' },
    { floor: 2, name: 'Kardiyoloji Hemşire İstasyonu', type: 'office', capacity: 4, occupied: 2, status: 'normal' },
    { floor: 2, name: 'EKG Odası', type: 'lab', capacity: 2, occupied: 1, status: 'normal' },
    // 3. Kat
    { floor: 3, name: 'Pediatri Servisi', type: 'patient', capacity: 12, occupied: 7, status: 'normal' },
    { floor: 3, name: 'Kadın Doğum Servisi', type: 'patient', capacity: 10, occupied: 6, status: 'normal' },
    { floor: 3, name: 'KBB Servisi', type: 'patient', capacity: 6, occupied: 3, status: 'normal' },
    { floor: 3, name: 'Doğumhane', type: 'or', capacity: 3, occupied: 1, status: 'normal' },
    // 4. Kat
    { floor: 4, name: 'Başhekimlik', type: 'office', capacity: 3, occupied: 2, status: 'normal' },
    { floor: 4, name: 'İnsan Kaynakları', type: 'office', capacity: 4, occupied: 3, status: 'normal' },
    { floor: 4, name: 'Muhasebe', type: 'office', capacity: 5, occupied: 4, status: 'normal' },
    { floor: 4, name: 'Toplantı Salonu A', type: 'meeting', capacity: 20, occupied: 0, status: 'available' },
    { floor: 4, name: 'Toplantı Salonu B', type: 'meeting', capacity: 10, occupied: 8, status: 'busy' },
    { floor: 4, name: 'Yemekhane', type: 'cafeteria', capacity: 100, occupied: 35, status: 'normal' },
  ];
  data.rooms = roomDefs.map((r, i) => ({ ...r, id: i + 1 }));
  setStorage(data);
}

export function renderHospitalMapPage(el) {
  seedRooms();
  const data = getStorage();
  const currentFloor = data.floor || 0;

  const totalCapacity = data.rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = data.rooms.reduce((s, r) => s + r.occupied, 0);
  const criticalRooms = data.rooms.filter(r => r.status === 'critical').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🗺️ İnteraktif Hastane Haritası</h1>
      <p class="text-slate-400 text-sm mt-1">Kat bazlı oda durumu ve kapasite takibi</p>
    </div>

    <!-- Genel Durum -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5">
        <p class="text-sm text-cyan-300">🏢 Toplam Oda</p>
        <p class="text-3xl font-bold text-white">${data.rooms.length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-5">
        <p class="text-sm text-emerald-300">📊 Genel Doluluk</p>
        <p class="text-3xl font-bold text-white">${totalCapacity > 0 ? Math.round(totalOccupied / totalCapacity * 100) : 0}%</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 p-5">
        <p class="text-sm text-red-300">🚨 Kritik</p>
        <p class="text-3xl font-bold text-white">${criticalRooms}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 p-5">
        <p class="text-sm text-blue-300">🛏️ Toplam Kapasite</p>
        <p class="text-3xl font-bold text-white">${totalOccupied}/${totalCapacity}</p>
      </div>
    </div>

    <!-- Kat Seçimi -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 fade-in">
      ${FLOORS.map(f => `
        <button class="${f.id === currentFloor ? 'tab-active' : 'tab-inactive'} flex items-center gap-2" data-floor="${f.id}">
          <span>🏢</span>${f.label}
        </button>
      `).join('')}
    </div>

    <!-- Kat Bilgisi -->
    <div class="card mb-6 fade-in">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-white">${FLOORS[currentFloor]?.label || 'Zemin Kat'}</h3>
          <p class="text-sm text-slate-400">${FLOORS[currentFloor]?.desc || ''}</p>
        </div>
        <div class="flex gap-2">
          <div class="att-legend-item"><div class="att-legend-dot" style="background:rgba(34,197,94,0.5)"></div>Müsait</div>
          <div class="att-legend-item"><div class="att-legend-dot" style="background:rgba(59,130,246,0.5)"></div>Normal</div>
          <div class="att-legend-item"><div class="att-legend-dot" style="background:rgba(245,158,11,0.5)"></div>Yoğun</div>
          <div class="att-legend-item"><div class="att-legend-dot" style="background:rgba(239,68,68,0.5)"></div>Kritik</div>
        </div>
      </div>

      <!-- Oda Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" id="map-rooms"></div>
    </div>

    <!-- Oda Tipi Dağılımı -->
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Oda Tipi Dağılımı</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        ${ROOM_TYPES.filter(t => data.rooms.some(r => r.type === t.id)).map(t => {
          const rooms = data.rooms.filter(r => r.type === t.id);
          const cap = rooms.reduce((s, r) => s + r.capacity, 0);
          const occ = rooms.reduce((s, r) => s + r.occupied, 0);
          return `<div class="rounded-xl bg-${t.color}-500/10 border border-${t.color}-500/20 p-3 text-center">
            <span class="text-2xl">${t.icon}</span>
            <p class="text-lg font-bold text-white mt-1">${rooms.length}</p>
            <p class="text-xs text-slate-400">${t.label}</p>
            <p class="text-[10px] text-slate-500">${occ}/${cap}</p>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  renderRooms(currentFloor, data);

  el.querySelectorAll('[data-floor]').forEach(btn => {
    btn.onclick = () => {
      const d = getStorage();
      d.floor = parseInt(btn.dataset.floor);
      setStorage(d);
      renderHospitalMapPage(el);
    };
  });
}

function renderRooms(floor, data) {
  const container = document.getElementById('map-rooms');
  if (!container) return;
  const rooms = data.rooms.filter(r => r.floor === floor);

  container.innerHTML = rooms.map(room => {
    const type = ROOM_TYPES.find(t => t.id === room.type);
    const pct = room.capacity > 0 ? Math.round(room.occupied / room.capacity * 100) : 0;
    const statusColor = room.status === 'critical' ? 'red' : room.status === 'busy' ? 'amber' : room.status === 'available' ? 'emerald' : 'cyan';
    const statusLabel = room.status === 'critical' ? 'Kritik' : room.status === 'busy' ? 'Yoğun' : room.status === 'available' ? 'Müsait' : 'Normal';

    return `<div class="room-card rounded-xl bg-white/5 border border-${statusColor}-500/20 p-4 hover:border-${statusColor}-500/40 transition" data-room-id="${room.id}">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">${type?.icon || '🏢'}</span>
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-white">${room.name}</h4>
          <p class="text-[10px] text-slate-400">${type?.label || ''}</p>
        </div>
        <span class="badge bg-${statusColor}-500/15 text-${statusColor}-300 text-[10px]">${statusLabel}</span>
      </div>
      <div class="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
        <div class="h-full rounded-full bg-${statusColor}-500 transition-all" style="width:${pct}%"></div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-400">${room.occupied}/${room.capacity}</span>
        <span class="text-xs text-${statusColor}-300 font-medium">%${pct}</span>
      </div>
    </div>`;
  }).join('');

  // Room click detail
  container.querySelectorAll('.room-card').forEach(card => {
    card.onclick = () => {
      const room = data.rooms.find(r => r.id === parseInt(card.dataset.roomId));
      if (!room) return;
      const type = ROOM_TYPES.find(t => t.id === room.type);
      const pct = room.capacity > 0 ? Math.round(room.occupied / room.capacity * 100) : 0;
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
      modal.innerHTML = `
        <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
          <div class="text-center mb-4">
            <span class="text-4xl">${type?.icon || '🏢'}</span>
            <h3 class="text-xl font-bold text-white mt-2">${room.name}</h3>
            <p class="text-sm text-slate-400">${FLOORS[room.floor]?.label} · ${type?.label}</p>
          </div>
          <div class="space-y-3 mb-4">
            <div class="flex justify-between"><span class="text-sm text-slate-400">Kapasite</span><span class="text-sm text-white font-medium">${room.capacity}</span></div>
            <div class="flex justify-between"><span class="text-sm text-slate-400">Doluluk</span><span class="text-sm text-white font-medium">${room.occupied} (%${pct})</span></div>
            <div class="flex justify-between"><span class="text-sm text-slate-400">Boş</span><span class="text-sm text-emerald-300 font-medium">${room.capacity - room.occupied}</span></div>
            <div class="flex justify-between"><span class="text-sm text-slate-400">Durum</span><span class="badge">${room.status === 'critical' ? '🚨 Kritik' : room.status === 'busy' ? '⚠️ Yoğun' : room.status === 'available' ? '✅ Müsait' : '🟢 Normal'}</span></div>
          </div>
          <button class="btn-primary w-full" onclick="this.closest('.fixed').remove()">Kapat</button>
        </div>`;
      document.body.appendChild(modal);
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    };
  });
}
