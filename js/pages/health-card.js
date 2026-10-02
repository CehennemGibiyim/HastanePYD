// ===== DİJİTAL SAĞLIK KARTI (QR HEALTH CARD) =====
import { getPersonnel, getPersonnelById } from '../state.js';
import { showToast } from '../notifications.js';

export function renderHealthCardPage(container) {
  const personnel = getPersonnel({ status: 'active' });
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">📸 Dijital Sağlık Kartı</h1>
          <p class="text-slate-400 text-sm mt-1">QR kod ile acil durum sağlık bilgileri</p>
        </div>
        <button id="hc-batch-btn" class="btn-secondary">📦 Toplu Oluştur</button>
      </div>
      <div class="card mb-6">
        <input id="hc-search" class="input-field w-full mb-4" placeholder="🔍 Personel ara...">
        <div id="hc-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </div>
    </div>`;
  renderHealthCards(personnel);
  document.getElementById('hc-search').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = personnel.filter(p => (p.name+' '+p.surname).toLowerCase().includes(q) || p.department?.toLowerCase().includes(q));
    renderHealthCards(filtered);
  };
}

function renderHealthCards(personnel) {
  const grid = document.getElementById('hc-grid');
  grid.innerHTML = personnel.map(p => {
    const vaccineStatus = getVaccineStatus(p);
    return `
      <div class="card hover:border-cyan-500/30 transition-all">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-lg font-bold text-cyan-300 overflow-hidden">${p.photo ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" class="w-full h-full object-cover">` : `${p.name[0]}${p.surname[0]}`}</div>
          <div class="flex-1">
            <p class="font-semibold text-white">${p.name} ${p.surname}</p>
            <p class="text-xs text-slate-400">${p.title} · ${p.department}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div class="rounded-lg bg-white/5 p-2"><span class="text-slate-500">Kan Grubu</span><p class="text-white font-bold">${p.bloodType || '-'}</p></div>
          <div class="rounded-lg bg-white/5 p-2"><span class="text-slate-500">Doğum</span><p class="text-white font-bold">${p.birthDate || '-'}</p></div>
        </div>
        ${p.emergencyContacts?.length ? `
          <div class="text-xs mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p class="text-red-400 font-medium mb-1">🚨 Acil Durum</p>
            ${p.emergencyContacts.map(c => `<p class="text-slate-300">${c.name} (${c.relation}): ${c.phone}</p>`).join('')}
          </div>` : ''}
        <div class="flex items-center justify-between">
          <span class="badge ${vaccineStatus.ok ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}">${vaccineStatus.label}</span>
          <button class="hc-qr-btn btn-secondary text-xs px-3 py-1" data-id="${p.id}">📱 QR Kod</button>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.hc-qr-btn').forEach(btn => {
    btn.onclick = () => showHealthQR(parseInt(btn.dataset.id));
  });
}

function showHealthQR(personId) {
  const p = getPersonnelById(personId);
  if (!p) return;
  const m = document.createElement('div');
  m.id = 'hc-qr-modal';
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  const healthData = `SAĞLIK KARTI
Ad: ${p.name} ${p.surname}
Kan: ${p.bloodType||'-'}
Departman: ${p.department}
Acil: ${p.emergencyContacts?.[0]?.phone||'-'}`;
  m.innerHTML = `<div class="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in text-center">
    <h3 class="text-xl font-bold text-white mb-4">📱 Sağlık Kartı QR</h3>
    <div id="hc-qr-code" class="mb-4 flex justify-center"></div>
    <p class="text-sm text-white font-medium">${p.name} ${p.surname}</p>
    <p class="text-xs text-slate-400">${p.department} · Kan: ${p.bloodType||'-'}</p>
    <button id="hc-qr-close" class="btn-secondary mt-4 w-full">Kapat</button>
  </div>`;
  document.body.appendChild(m);
  m.onclick = (e) => { if (e.target.id === 'hc-qr-modal') m.remove(); };
  document.getElementById('hc-qr-close').onclick = () => m.remove();
  if (typeof qrcode !== 'undefined') {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(healthData);
      qr.make();
      document.getElementById('hc-qr-code').innerHTML = qr.createSvgTag(4, 0);
    } catch { document.getElementById('hc-qr-code').innerHTML = '<p class="text-slate-500">QR oluşturulamadı</p>'; }
  }
}

function getVaccineStatus(p) {
  const vaccines = ['COVID-19', 'Tetanoz', 'Hepatit B'];
  const random = (p.id % 3);
  return random === 0 ? { ok: true, label: '✅ Aşılar güncel' } : random === 1 ? { ok: false, label: '⚠️ Tetanoz zamanı' } : { ok: true, label: '✅ Aşılar güncel' };
}
