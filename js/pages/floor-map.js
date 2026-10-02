// ===== KAT PLANI =====
import { getPersonnel, getTodaySchedules } from '../state.js';

const FLOORS = [
  { id: 0, name: 'Zemin Kat', emoji: '🏥' },
  { id: 1, name: '1. Kat', emoji: '🏢' },
  { id: 2, name: '2. Kat', emoji: '🏢' },
  { id: 3, name: '3. Kat', emoji: '🏢' },
];

const ROOMS = [
  { id: 'r1', floor: 0, name: 'Acil Servis', type: 'emergency', capacity: 20, beds: 12, status: 'busy', dept: 'Acil' },
  { id: 'r2', floor: 0, name: 'Resepsiyon', type: 'admin', capacity: 5, beds: 0, status: 'ok', dept: 'İdari' },
  { id: 'r3', floor: 0, name: 'Güvenlik', type: 'admin', capacity: 3, beds: 0, status: 'ok', dept: 'Güvenlik' },
  { id: 'r4', floor: 0, name: 'Kafeterya', type: 'service', capacity: 30, beds: 0, status: 'ok', dept: 'Mutfak' },
  { id: 'r5', floor: 1, name: 'Dahiliye', type: 'clinic', capacity: 15, beds: 10, status: 'normal', dept: 'Dahiliye' },
  { id: 'r6', floor: 1, name: 'Cerrahi', type: 'clinic', capacity: 12, beds: 8, status: 'busy', dept: 'Cerrahi' },
  { id: 'r7', floor: 1, name: 'Ameliyathane 1', type: 'surgery', capacity: 1, beds: 1, status: 'occupied', dept: 'Cerrahi' },
  { id: 'r8', floor: 1, name: 'Ameliyathane 2', type: 'surgery', capacity: 1, beds: 1, status: 'available', dept: 'Cerrahi' },
  { id: 'r9', floor: 1, name: 'Yoğun Bakım', type: 'icu', capacity: 10, beds: 8, status: 'critical', dept: 'Yoğun Bakım' },
  { id: 'r10', floor: 2, name: 'Kadın Doğum', type: 'clinic', capacity: 12, beds: 8, status: 'normal', dept: 'Kadın Doğum' },
  { id: 'r11', floor: 2, name: 'Pediatri', type: 'clinic', capacity: 10, beds: 6, status: 'normal', dept: 'Pediatri' },
  { id: 'r12', floor: 2, name: 'Kardiyoloji', type: 'clinic', capacity: 8, beds: 5, status: 'busy', dept: 'Kardiyoloji' },
  { id: 'r13', floor: 2, name: 'Radyoloji', type: 'diagnostic', capacity: 4, beds: 0, status: 'ok', dept: 'Radyoloji' },
  { id: 'r14', floor: 2, name: 'Laboratuvar', type: 'diagnostic', capacity: 6, beds: 0, status: 'ok', dept: 'Laboratuvar' },
  { id: 'r15', floor: 3, name: 'Eczane', type: 'service', capacity: 4, beds: 0, status: 'ok', dept: 'Eczane' },
  { id: 'r16', floor: 3, name: 'Fizik Tedavi', type: 'clinic', capacity: 8, beds: 4, status: 'normal', dept: 'Fizik Tedavi' },
  { id: 'r17', floor: 3, name: 'Psikiyatri', type: 'clinic', capacity: 6, beds: 4, status: 'normal', dept: 'Psikiyatri' },
  { id: 'r18', floor: 3, name: 'Konferans Salonu', type: 'admin', capacity: 50, beds: 0, status: 'ok', dept: 'İdari' },
];

const STATUS_COLORS = {
  ok: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', label: 'Uygun' },
  normal: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', label: 'Normal' },
  busy: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', label: 'Yoğun' },
  occupied: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', label: 'Dolu' },
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', label: 'Kritik' },
  available: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', label: 'Boş' },
};

export function renderFloorMapPage(el) {
  const personnel = getPersonnel({});
  const today = getTodaySchedules();
  let currentFloor = 0;

  function render() {
    const rooms = ROOMS.filter(r => r.floor === currentFloor);
    const totalBeds = rooms.reduce((s, r) => s + r.beds, 0);
    const occupiedBeds = Math.round(totalBeds * 0.72);

    el.innerHTML = `
      <div class="mb-6 fade-in">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-2xl font-bold text-white">🗺️ Kat Planı</h1>
            <p class="text-slate-400 text-sm mt-1">İnteraktif hastane kat planı ve oda durumu</p>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-slate-400">🛏️ Yatak:</span>
            <span class="text-white font-medium">${occupiedBeds}/${totalBeds}</span>
            <span class="text-slate-500">dolu</span>
          </div>
        </div>
      </div>

      <div class="flex gap-2 mb-6 overflow-x-auto pb-2 fade-in">
        ${FLOORS.map(f => `
          <button data-floor="${f.id}" class="floor-tab shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition ${currentFloor === f.id ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}">
            ${f.emoji} ${f.name}
          </button>`).join('')}
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 fade-in" id="room-grid">
        ${rooms.map(r => {
          const sc = STATUS_COLORS[r.status] || STATUS_COLORS.ok;
          const typeIcons = { emergency: '🚨', clinic: '🏥', surgery: '🔪', icu: '❤️', diagnostic: '🔬', service: '🛎️', admin: '🏢' };
          const staffHere = today.filter(s => {
            const p = personnel.find(pp => pp.id === s.personnelId);
            return p && p.department === r.dept;
          }).length;
          return `
            <div class="room-card card cursor-pointer hover:bg-white/8 transition ${sc.bg} ${sc.border}" data-room="${r.id}">
              <div class="flex items-center justify-between mb-2">
                <span class="text-2xl">${typeIcons[r.type] || '🏠'}</span>
                <span class="badge ${sc.bg} ${sc.text} text-[10px]">${sc.label}</span>
              </div>
              <h3 class="text-sm font-semibold text-white mb-1">${r.name}</h3>
              <p class="text-[10px] text-slate-400 mb-2">🏢 ${r.dept}</p>
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-400">🛏️ ${r.beds > 0 ? r.beds + ' yatak' : 'Yatak yok'}</span>
                <span class="text-slate-400">👤 ${staffHere} personel</span>
              </div>
              ${r.beds > 0 ? `
                <div class="h-2 rounded-full bg-white/10 overflow-hidden mt-2">
                  <div class="h-full rounded-full ${r.status === 'critical' ? 'bg-red-400' : r.status === 'busy' ? 'bg-amber-400' : 'bg-green-400'}" style="width:${Math.round(Math.random() * 40 + 50)}%"></div>
                </div>` : ''}
            </div>`;
        }).join('')}
      </div>

      <div class="card fade-in">
        <h3 class="text-lg font-semibold text-white mb-4">📊 Durum Lejantı</h3>
        <div class="flex flex-wrap gap-4">
          ${Object.entries(STATUS_COLORS).map(([key, val]) => `
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded ${val.bg} border ${val.border}"></div>
              <span class="text-xs text-slate-400">${val.label}</span>
            </div>`).join('')}
        </div>
      </div>`;

    document.querySelectorAll('.floor-tab').forEach(btn => {
      btn.onclick = () => { currentFloor = parseInt(btn.dataset.floor); render(); };
    });

    document.querySelectorAll('.room-card').forEach(card => {
      card.onclick = () => {
        const room = ROOMS.find(r => r.id === card.dataset.room);
        if (!room) return;
        showRoomDetail(room);
      };
    });
  }

  function showRoomDetail(room) {
    const sc = STATUS_COLORS[room.status] || STATUS_COLORS.ok;
    const staffInDept = personnel.filter(p => p.department === room.dept);
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">${room.name}</h3>
          <span class="badge ${sc.bg} ${sc.text}">${sc.label}</span>
        </div>
        <div class="space-y-3 mb-4">
          <div class="flex justify-between"><span class="text-sm text-slate-400">Departman</span><span class="text-sm text-white">${room.dept}</span></div>
          <div class="flex justify-between"><span class="text-sm text-slate-400">Kapasite</span><span class="text-sm text-white">${room.capacity} kişi</span></div>
          <div class="flex justify-between"><span class="text-sm text-slate-400">Yatak</span><span class="text-sm text-white">${room.beds} adet</span></div>
          <div class="flex justify-between"><span class="text-sm text-slate-400">Personel</span><span class="text-sm text-white">${staffInDept.length} kişi</span></div>
        </div>
        ${staffInDept.length ? `
          <h4 class="text-sm font-semibold text-white mb-2">👥 Departman Personeli</h4>
          <div class="space-y-1 max-h-40 overflow-y-auto">
            ${staffInDept.slice(0, 10).map(p => `
              <div class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5">
                <span class="text-xs">${p.type === 'doctor' ? '🩺' : p.type === 'nurse' ? '👩‍⚕️' : '👤'}</span>
                <span class="text-xs text-slate-300">${p.name}</span>
                <span class="text-[10px] text-slate-500 ml-auto">${p.title || ''}</span>
              </div>`).join('')}
          </div>` : ''}
        <button id="room-close" class="btn-secondary w-full mt-4">Kapat</button>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.querySelector('#room-close').onclick = () => modal.remove();
  }

  render();
}
