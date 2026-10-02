// ===== ARAÇ & AMBULANS YÖNETİMİ =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_vehicles';

function getVehicles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultVehicles(); } catch { return getDefaultVehicles(); }
}
function saveVehicles(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultVehicles() {
  return [
    { id: 1, plate: '34 ABC 001', type: 'ambulance', brand: 'Mercedes Sprinter', year: 2022, km: 45200, fuel: 75, status: 'active', driver: 'Ahmet Kaya', lastService: '2025-01-15', nextService: '2025-07-15', insurance: '2026-03-01' },
    { id: 2, plate: '34 ABC 002', type: 'ambulance', brand: 'Ford Transit', year: 2021, km: 68400, fuel: 45, status: 'active', driver: 'Mehmet Demir', lastService: '2025-02-20', nextService: '2025-08-20', insurance: '2026-05-10' },
    { id: 3, plate: '34 ABC 010', type: 'service', brand: 'Volkswagen Crafter', year: 2023, km: 32100, fuel: 90, status: 'active', driver: 'Ali Yıldız', lastService: '2025-03-01', nextService: '2025-09-01', insurance: '2026-01-15' },
    { id: 4, plate: '34 ABC 020', type: 'service', brand: 'Fiat Ducato', year: 2020, km: 95600, fuel: 60, status: 'maintenance', driver: '', lastService: '2025-04-10', nextService: '2025-06-10', insurance: '2025-12-30' },
    { id: 5, plate: '34 ABC 030', type: 'admin', brand: 'Toyota Corolla', year: 2024, km: 12300, fuel: 85, status: 'active', driver: 'Dr. Ayşe Yılmaz', lastService: '2025-05-01', nextService: '2025-11-01', insurance: '2026-08-20' },
    { id: 6, plate: '34 ABC 040', type: 'admin', brand: 'Honda Civic', year: 2023, km: 28700, fuel: 30, status: 'active', driver: 'Fatma Çelik', lastService: '2025-03-15', nextService: '2025-09-15', insurance: '2026-04-05' },
  ];
}

const typeIcons = { ambulance: '🚑', service: '🚐', admin: '🚗', special: '🏎️' };
const typeLabels = { ambulance: 'Ambulans', service: 'Servis', admin: 'İdari', special: 'Özel' };
const statusColors = { active: 'text-green-400 bg-green-500/10', maintenance: 'text-amber-400 bg-amber-500/10', inactive: 'text-red-400 bg-red-500/10' };
const statusLabels = { active: 'Aktif', maintenance: 'Bakımda', inactive: 'Pasif' };

export function renderVehicleManagementPage(el) {
  const vehicles = getVehicles();
  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const totalKm = vehicles.reduce((s, v) => s + v.km, 0);
  const avgFuel = Math.round(vehicles.reduce((s, v) => s + v.fuel, 0) / vehicles.length);
  const serviceDue = vehicles.filter(v => { const d = new Date(v.nextService); return d - new Date() < 30 * 24 * 3600 * 1000; }).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🚗 Araç & Ambulans Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">Filo takibi, yakıt, bakım ve sürücü atamaları</p>
        </div>
        <button id="add-vehicle-btn" class="btn-primary">➕ Yeni Araç</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${vehicles.length}</p><p class="text-xs text-slate-400">🚗 Toplam Araç</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${activeCount}</p><p class="text-xs text-slate-400">✅ Aktif</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${avgFuel}%</p><p class="text-xs text-slate-400">⛽ Ort. Yakıt</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${serviceDue > 0 ? 'text-red-300' : 'text-slate-300'}">${serviceDue}</p><p class="text-xs text-slate-400">🔧 Bakım Yakın</p></div>
    </div>

    <div class="card fade-in">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <h3 class="text-lg font-semibold text-white">Araç Listesi</h3>
        <select id="vf-type" class="input-field text-xs"><option value="">Tüm Türler</option>${Object.entries(typeLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <select id="vf-status" class="input-field text-xs"><option value="">Tüm Durumlar</option>${Object.entries(statusLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="space-y-3" id="vehicle-list">${vehicleListHTML(vehicles)}</div>
    </div>`;

  const filterAndRender = () => {
    const type = el.querySelector('#vf-type').value;
    const status = el.querySelector('#vf-status').value;
    let filtered = vehicles;
    if (type) filtered = filtered.filter(v => v.type === type);
    if (status) filtered = filtered.filter(v => v.status === status);
    el.querySelector('#vehicle-list').innerHTML = vehicleListHTML(filtered);
  };
  el.querySelector('#vf-type').addEventListener('change', filterAndRender);
  el.querySelector('#vf-status').addEventListener('change', filterAndRender);
  el.querySelector('#add-vehicle-btn')?.addEventListener('click', () => showVehicleModal(el));
}

function vehicleListHTML(vehicles) {
  if (vehicles.length === 0) return '<p class="text-slate-500 text-sm text-center py-8">Araç bulunamadı</p>';
  return vehicles.map(v => `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 transition">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="text-3xl">${typeIcons[v.type] || '🚗'}</div>
        <div class="flex-1 min-w-[200px]">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-semibold text-white text-sm">${v.plate}</h4>
            <span class="badge text-[10px]">${typeLabels[v.type]}</span>
            <span class="text-[10px] px-2 py-0.5 rounded-full ${statusColors[v.status]}">${statusLabels[v.status]}</span>
          </div>
          <p class="text-xs text-slate-400">${v.brand} · ${v.year} · ${v.km.toLocaleString('tr-TR')} km</p>
          ${v.driver ? `<p class="text-xs text-slate-500 mt-1">👤 ${v.driver}</p>` : ''}
        </div>
        <div class="flex items-center gap-4">
          <div class="text-center">
            <p class="text-sm font-bold ${v.fuel < 30 ? 'text-red-400' : v.fuel < 60 ? 'text-amber-400' : 'text-green-400'}">${v.fuel}%</p>
            <p class="text-[10px] text-slate-500">⛽ Yakıt</p>
          </div>
          <div class="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full rounded-full ${v.fuel < 30 ? 'bg-red-500' : v.fuel < 60 ? 'bg-amber-500' : 'bg-green-500'}" style="width:${v.fuel}%"></div>
          </div>
          <div class="text-center">
            <p class="text-xs text-slate-400">${v.nextService}</p>
            <p class="text-[10px] text-slate-500">🔧 Sonraki Bakım</p>
          </div>
        </div>
      </div>
    </div>`).join('');
}

function showVehicleModal(el) {
  const existing = document.getElementById('vehicle-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'vehicle-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">🚗 Yeni Araç Ekle</h3>
      <div class="space-y-3">
        <div><label class="label">Plaka *</label><input id="v-plate" class="input-field w-full" placeholder="34 ABC 001"></div>
        <div><label class="label">Tür</label><select id="v-type" class="input-field w-full">${Object.entries(typeLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div><label class="label">Marka/Model</label><input id="v-brand" class="input-field w-full" placeholder="Mercedes Sprinter"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Yıl</label><input id="v-year" type="number" class="input-field w-full" value="2024"></div>
          <div><label class="label">Km</label><input id="v-km" type="number" class="input-field w-full" value="0"></div>
        </div>
        <div><label class="label">Sürücü</label><input id="v-driver" class="input-field w-full" placeholder="Adı Soyadı"></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="v-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="v-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#v-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#v-save').onclick = () => {
    const plate = modal.querySelector('#v-plate').value.trim();
    if (!plate) { showToast('Plaka zorunludur', 'error'); return; }
    const vehicles = getVehicles();
    vehicles.push({
      id: Date.now(), plate,
      type: modal.querySelector('#v-type').value,
      brand: modal.querySelector('#v-brand').value.trim(),
      year: parseInt(modal.querySelector('#v-year').value) || 2024,
      km: parseInt(modal.querySelector('#v-km').value) || 0,
      fuel: 100, status: 'active',
      driver: modal.querySelector('#v-driver').value.trim(),
      lastService: new Date().toISOString().split('T')[0],
      nextService: '', insurance: ''
    });
    saveVehicles(vehicles);
    modal.remove();
    showToast('Araç eklendi!', 'success');
    renderVehicleManagementPage(el);
  };
}
