// ===== QR CHECK-IN SISTEMI =====
import { getPersonnel } from '../state.js';

function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_qr_checkin') || '{"records":[],"settings":{}}'); } catch { return { records: [], settings: {} }; }
}
function setStorage(d) { localStorage.setItem('hospital_qr_checkin', JSON.stringify(d)); }

const SHIFT_TYPES = [
  { id: 'morning', label: 'Sabah', time: '07:00-15:00', icon: '🌅' },
  { id: 'afternoon', label: 'Öğle', time: '15:00-23:00', icon: '☀️' },
  { id: 'night', label: 'Gece', time: '23:00-07:00', icon: '🌙' },
];

export function renderQRCheckinPage(el) {
  const data = getStorage();
  const personnel = getPersonnel({}).filter(p => p.status === 'active');
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = data.records.filter(r => r.date === today);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📱 QR Check-in Sistemi</h1>
      <p class="text-slate-400 text-sm mt-1">QR kod ile personel giriş-çıkış takibi</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
      <!-- QR Scanner Area -->
      <div class="card lg:col-span-1">
        <h3 class="text-lg font-semibold text-white mb-4">📷 QR Kod Okut</h3>
        <div class="rounded-xl bg-white/5 border-2 border-dashed border-white/20 p-8 text-center mb-4" id="qr-scanner-area">
          <div class="text-6xl mb-3">📷</div>
          <p class="text-sm text-slate-300">QR kodu okutun</p>
          <p class="text-xs text-slate-500 mt-1">veya manuel giriş yapın</p>
        </div>
        <div class="space-y-3">
          <div>
            <label class="label">Personel Seç (Manuel)</label>
            <select id="qr-person" class="input-field w-full">
              <option value="">Personel seçin...</option>
              ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname} — ${p.department}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="label">İşlem Türü</label>
            <div class="grid grid-cols-2 gap-2">
              <button class="qr-action-btn btn-primary text-sm" data-action="checkin">📥 Giriş</button>
              <button class="qr-action-btn btn-secondary text-sm" data-action="checkout">📤 Çıkış</button>
            </div>
          </div>
          <div>
            <label class="label">Vardiya</label>
            <div class="flex gap-2">
              ${SHIFT_TYPES.map((s, i) => `
                <button class="qr-shift-btn flex-1 rounded-xl p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition text-center ${i === 0 ? 'border-cyan-500/50 bg-cyan-500/10' : ''}" data-shift="${s.id}">
                  <span class="text-lg">${s.icon}</span>
                  <p class="text-[10px] text-slate-400 mt-1">${s.label}</p>
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="qr-shift" value="morning">
          </div>
        </div>

        <!-- Personel QR Kodu Oluştur -->
        <div class="mt-6 pt-4 border-t border-white/10">
          <h4 class="text-sm font-semibold text-white mb-3">🏷️ QR Kod Oluştur</h4>
          <select id="qr-gen-person" class="input-field w-full mb-3">
            ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname}</option>`).join('')}
          </select>
          <button id="qr-generate" class="btn-secondary w-full text-sm">📱 QR Kod Üret</button>
          <div id="qr-output" class="mt-3 text-center"></div>
        </div>
      </div>

      <!-- Right: Stats & Records -->
      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">📊 Bugünkü Durum</h3>
          <span class="text-xs text-slate-400">${today}</span>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
            <p class="text-2xl font-bold text-emerald-300">${todayRecords.filter(r => r.action === 'checkin').length}</p>
            <p class="text-xs text-emerald-400">📥 Giriş</p>
          </div>
          <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
            <p class="text-2xl font-bold text-blue-300">${todayRecords.filter(r => r.action === 'checkout').length}</p>
            <p class="text-xs text-blue-400">📤 Çıkış</p>
          </div>
          <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <p class="text-2xl font-bold text-amber-300">${personnel.length - todayRecords.filter(r => r.action === 'checkin').length}</p>
            <p class="text-xs text-amber-400">⏳ Gelmedi</p>
          </div>
        </div>

        <!-- Recent Records -->
        <h4 class="text-sm font-semibold text-white mb-3">📋 Son Kayıtlar</h4>
        <div class="space-y-2 max-h-[400px] overflow-y-auto">
          ${todayRecords.length === 0 ? '<p class="text-slate-500 text-sm text-center py-4">Bugün henüz kayıt yok</p>' :
            todayRecords.sort((a, b) => b.time.localeCompare(a.time)).map(r => {
              const emp = personnel.find(p => p.id === r.employeeId);
              const shift = SHIFT_TYPES.find(s => s.id === r.shift);
              return `<div class="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                <span class="text-2xl">${r.action === 'checkin' ? '📥' : '📤'}</span>
                <div class="flex-1">
                  <p class="text-sm font-medium text-white">${emp ? emp.name + ' ' + emp.surname : 'Bilinmeyen'}</p>
                  <p class="text-xs text-slate-400">${emp?.department} · ${shift?.icon} ${shift?.label} Vardiyası</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold ${r.action === 'checkin' ? 'text-emerald-300' : 'text-blue-300'}">${r.time}</p>
                  <p class="text-[10px] text-slate-500">${r.method === 'qr' ? 'QR Kod' : 'Manuel'}</p>
                </div>
              </div>`;
            }).join('')
          }
        </div>
      </div>
    </div>

    <!-- Weekly Summary -->
    <div class="card mt-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📈 Haftalık Özet</h3>
      <div class="grid grid-cols-7 gap-2">
        ${Array.from({length: 7}, (_, i) => {
          const d = new Date(Date.now() - (6 - i) * 86400000);
          const dateStr = d.toISOString().slice(0, 10);
          const dayRecords = data.records.filter(r => r.date === dateStr && r.action === 'checkin');
          const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
          const isToday = dateStr === today;
          return `<div class="rounded-xl ${isToday ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-white/5 border border-white/10'} p-3 text-center">
            <p class="text-xs text-slate-400">${dayName}</p>
            <p class="text-xl font-bold text-white mt-1">${dayRecords.length}</p>
            <p class="text-[10px] text-slate-500">giriş</p>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  // Event listeners
  let selectedShift = 'morning';
  el.querySelectorAll('.qr-shift-btn').forEach(btn => {
    btn.onclick = () => {
      selectedShift = btn.dataset.shift;
      document.getElementById('qr-shift').value = selectedShift;
      el.querySelectorAll('.qr-shift-btn').forEach(b => {
        b.classList.toggle('border-cyan-500/50', b.dataset.shift === selectedShift);
        b.classList.toggle('bg-cyan-500/10', b.dataset.shift === selectedShift);
      });
    };
  });

  el.querySelectorAll('.qr-action-btn').forEach(btn => {
    btn.onclick = () => {
      const empId = parseInt(document.getElementById('qr-person').value);
      if (!empId) { alert('Lütfen personel seçin'); return; }
      const now = new Date();
      const d = getStorage();
      const existing = d.records.find(r => r.employeeId === empId && r.date === today && r.action === btn.dataset.action);
      if (existing) { alert(`Bu personel bugün zaten ${btn.dataset.action === 'checkin' ? 'giriş' : 'çıkış'} yapmış`); return; }
      d.records.push({
        id: Date.now(), employeeId: empId, date: today,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        action: btn.dataset.action,
        shift: document.getElementById('qr-shift').value,
        method: 'manual',
        createdAt: now.toISOString(),
      });
      setStorage(d);
      renderQRCheckinPage(document.getElementById('content'));
    };
  });

  document.getElementById('qr-generate')?.addEventListener('click', () => {
    const empId = parseInt(document.getElementById('qr-gen-person').value);
    const emp = personnel.find(p => p.id === empId);
    if (!emp) return;
    const qrData = `HOSPITAL-CHECKIN:${empId}:${emp.name}_${emp.surname}`;
    if (typeof qrcode !== 'undefined') {
      const qr = qrcode(0, 'M');
      qr.addData(qrData);
      qr.make();
      document.getElementById('qr-output').innerHTML = `
        <div class="inline-block bg-white p-4 rounded-xl">${qr.createSvgTag(4, 0)}</div>
        <p class="text-xs text-slate-400 mt-2">${emp.name} ${emp.surname}</p>
        <p class="text-[10px] text-slate-500">Sicil: ${empId}</p>
      `;
    } else {
      document.getElementById('qr-output').innerHTML = `<p class="text-sm text-amber-300">QR kütüphanesi yüklenemedi</p>`;
    }
  });
}
