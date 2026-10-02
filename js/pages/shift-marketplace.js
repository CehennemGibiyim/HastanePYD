// ===== VARDİYA PAZARI (SHIFT MARKETPLACE) =====
import { getSchedules, getPersonnel, getPersonnelById, deleteSchedule, addSchedule } from '../state.js';
import { showToast } from '../notifications.js';

export function renderShiftMarketplacePage(container) {
  const listings = getListings();
  const personnel = getPersonnel({ status: 'active' });
  const myId = null;
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">🔄 Vardiya Pazarı</h1>
          <p class="text-slate-400 text-sm mt-1">Müsait vardiyaları paylaşın ve talep edin</p>
        </div>
        <button id="sm-add-btn" class="btn-primary">+ Vardiya Yayınla</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${smStatCard('📢', 'Aktif İlan', listings.filter(l=>l.status==='open').length, 'cyan')}
        ${smStatCard('✅', 'Eşleşen', listings.filter(l=>l.status==='matched').length, 'green')}
        ${smStatCard('👥', 'Katılımcı', new Set(listings.map(l=>l.ownerId)).size, 'purple')}
        ${smStatCard('🏆', 'Puan Dağıtılan', listings.filter(l=>l.status==='matched').length * 10, 'amber')}
      </div>
      <div class="flex gap-3 mb-4">
        <select id="sm-filter" class="input-field">
          <option value="">Tüm İlanlar</option>
          <option value="open">🟢 Açık</option>
          <option value="matched">✅ Eşleşen</option>
        </select>
        <select id="sm-dept-filter" class="input-field">
          <option value="">Tüm Departmanlar</option>
          ${[...new Set(personnel.map(p=>p.department))].map(d=>`<option value="${d}">${d}</option>`).join('')}
        </select>
      </div>
      <div id="sm-listings" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
    </div>`;
  renderListings(listings, personnel);
  document.getElementById('sm-add-btn').onclick = () => showListingModal(personnel);
  document.getElementById('sm-filter').onchange = () => filterListings(personnel);
  document.getElementById('sm-dept-filter').onchange = () => filterListings(personnel);
}

function filterListings(personnel) {
  let listings = getListings();
  const status = document.getElementById('sm-filter').value;
  const dept = document.getElementById('sm-dept-filter').value;
  if (status) listings = listings.filter(l => l.status === status);
  if (dept) listings = listings.filter(l => { const p = getPersonnelById(l.ownerId); return p?.department === dept; });
  renderListings(listings, personnel);
}

function renderListings(listings, personnel) {
  const el = document.getElementById('sm-listings');
  if (listings.length === 0) {
    el.innerHTML = '<div class="col-span-full empty-state card"><div class="icon">🔄</div><div class="title">İlan yok</div><div class="desc">Henüz vardiya paylaşılmamış</div></div>';
    return;
  }
  el.innerHTML = listings.map(l => {
    const owner = getPersonnelById(l.ownerId);
    const taker = l.takerId ? getPersonnelById(l.takerId) : null;
    const shiftLabel = {morning:'🌅 Sabah',evening:'🌆 Akşam',night:'🌙 Gece'}[l.shift] || l.shift;
    return `
      <div class="card ${l.status==='matched' ? 'border-green-500/20' : l.status==='open' ? 'border-cyan-500/20' : 'border-white/10'}">
        <div class="flex items-center justify-between mb-3">
          <span class="badge ${l.status==='open'?'bg-cyan-500/20 text-cyan-400':'bg-green-500/20 text-green-400'}">${l.status==='open'?'🟢 Açık':'✅ Eşleşti'}</span>
          <span class="text-xs text-slate-500">${l.date}</span>
        </div>
        <p class="text-lg font-bold text-white mb-1">${shiftLabel}</p>
        <p class="text-sm text-slate-300 mb-2">${owner ? owner.name+' '+owner.surname : '?'} · ${owner?.department || '-'}</p>
        ${l.note ? `<p class="text-xs text-slate-400 mb-3">"${l.note}"</p>` : ''}
        <div class="flex items-center justify-between pt-3 border-t border-white/5">
          <span class="text-xs text-amber-400">🏆 +10 puan</span>
          ${l.status === 'open' ? `<button class="sm-take-btn btn-primary text-xs px-3 py-1" data-id="${l.id}">🙋 Almak İstiyorum</button>` :
            `<p class="text-xs text-green-400">→ ${taker ? taker.name+' '+taker.surname : '?'}</p>`}
        </div>
      </div>`;
  }).join('');
  el.querySelectorAll('.sm-take-btn').forEach(b => {
    b.onclick = () => {
      const listings = getListings();
      const listing = listings.find(x => x.id === parseInt(b.dataset.id));
      if (listing) {
        listing.status = 'matched';
        listing.takerId = 1;
        listing.matchedAt = new Date().toISOString();
        saveListings(listings);
        showToast('Vardiya kabul edildi! +10 puan kazandınız 🏆', 'success');
        renderListings(listings, personnel);
      }
    };
  });
}

function showListingModal(personnel) {
  const m = document.createElement('div');
  m.id = 'sm-modal';
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  m.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
    <h3 class="text-xl font-bold text-white mb-4">📢 Vardiya Yayınla</h3>
    <div class="space-y-3">
      <div><label class="label">Personel</label><select id="sl-owner" class="input-field w-full">${personnel.map(p=>`<option value="${p.id}">${p.name} ${p.surname} (${p.department})</option>`).join('')}</select></div>
      <div><label class="label">Tarih</label><input id="sl-date" type="date" class="input-field w-full" value="${new Date().toISOString().split('T')[0]}"></div>
      <div><label class="label">Vardiya</label><select id="sl-shift" class="input-field w-full"><option value="morning">🌅 Sabah</option><option value="evening">🌆 Akşam</option><option value="night">🌙 Gece</option></select></div>
      <div><label class="label">Not</label><input id="sl-note" class="input-field w-full" placeholder="Neden bırakmak istiyorsunuz?"></div>
    </div>
    <div class="flex gap-3 mt-6"><button id="sl-save" class="btn-primary flex-1">📢 Yayınla</button><button id="sl-cancel" class="btn-secondary flex-1">İptal</button></div></div>`;
  document.body.appendChild(m);
  m.onclick = (e) => { if (e.target.id === 'sm-modal') m.remove(); };
  document.getElementById('sl-cancel').onclick = () => m.remove();
  document.getElementById('sl-save').onclick = () => {
    const listings = getListings();
    listings.push({ id: Date.now(), ownerId: parseInt(document.getElementById('sl-owner').value), date: document.getElementById('sl-date').value, shift: document.getElementById('sl-shift').value, note: document.getElementById('sl-note').value.trim(), status: 'open', createdAt: new Date().toISOString() });
    saveListings(listings);
    m.remove(); showToast('Vardiya yayınlandı!', 'success');
    renderShiftMarketplacePage(document.getElementById('content'));
  };
}

function smStatCard(icon, label, value, color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5"><p class="text-sm text-${color}-300">${icon} ${label}</p><p class="text-2xl font-bold text-white mt-1">${value}</p></div>`;
}
function getListings() { try { return JSON.parse(localStorage.getItem('hospital_shift_marketplace') || '[]'); } catch { return []; } }
function saveListings(l) { localStorage.setItem('hospital_shift_marketplace', JSON.stringify(l)); }
