// ===== ZIYARETÇI YÖNETİMİ =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_visitors';

function getVisitors() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultVisitors(); } catch { return getDefaultVisitors(); }
}
function saveVisitors(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultVisitors() {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: 1, name: 'Ali Veli', tcNo: '12345678901', phone: '05551112233', visiting: 'Mehmet Kaya (Hasta)', department: 'Dahiliye', purpose: 'Hasta ziyareti', checkIn: today + 'T09:30', checkOut: '', badge: 'V-0001', vip: false, blacklist: false, notes: '' },
    { id: 2, name: 'Ayşe Demir', tcNo: '98765432100', phone: '05554445566', visiting: 'Dr. Ayşe Yılmaz', department: 'Başhekimlik', purpose: 'Görüşme', checkIn: today + 'T10:00', checkOut: today + 'T10:45', badge: 'V-0002', vip: true, blacklist: false, notes: 'Sağlık Müdürlüğü temsilcisi' },
    { id: 3, name: 'Kargo Elemanı', tcNo: '', phone: '', visiting: 'İdari İşler', department: 'İdari', purpose: 'Kargo teslimi', checkIn: today + 'T11:00', checkOut: today + 'T11:15', badge: 'V-0003', vip: false, blacklist: false, notes: '' },
  ];
}

export function renderVisitorsPage(el) {
  const visitors = getVisitors();
  const today = new Date().toISOString().split('T')[0];
  const todayVisitors = visitors.filter(v => v.checkIn?.startsWith(today));
  const insideNow = todayVisitors.filter(v => !v.checkOut);
  const vipCount = visitors.filter(v => v.vip).length;
  const blacklistCount = visitors.filter(v => v.blacklist).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">👤 Ziyaretçi Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">Ziyaretçi kaydı, giriş/çıkış takibi ve VIP protokol</p>
        </div>
        <button id="add-visitor-btn" class="btn-primary">➕ Ziyaretçi Kaydet</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${todayVisitors.length}</p><p class="text-xs text-slate-400">📅 Bugünkü Ziyaretçi</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${insideNow.length}</p><p class="text-xs text-slate-400">🟢 İçeride</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${vipCount}</p><p class="text-xs text-slate-400">⭐ VIP</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${blacklistCount > 0 ? 'text-red-300' : 'text-slate-300'}">${blacklistCount}</p><p class="text-xs text-slate-400">🚫 Kara Liste</p></div>
    </div>

    ${insideNow.length > 0 ? `
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-3">🟢 Şu Anda İçeride Olanlar</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${insideNow.map(v => `
          <div class="rounded-xl border border-green-500/20 bg-green-500/5 p-3 flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-lg">${v.vip ? '⭐' : '👤'}</div>
            <div class="flex-1">
              <p class="text-sm font-medium text-white">${v.name}</p>
              <p class="text-xs text-slate-400">${v.visiting} · ${v.department}</p>
              <p class="text-[10px] text-green-400">Giriş: ${v.checkIn?.split('T')[1]} · 🪪 ${v.badge}</p>
            </div>
            <button class="visitor-checkout-btn btn-secondary text-xs px-3 py-1.5" data-id="${v.id}">🚪 Çıkış</button>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div class="card fade-in">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <h3 class="text-lg font-semibold text-white">Ziyaretçi Geçmişi</h3>
        <select id="visit-filter" class="input-field text-xs">
          <option value="">Tümü</option>
          <option value="today">Bugün</option>
          <option value="vip">VIP</option>
          <option value="inside">İçeride</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr>
              <th class="th">👤 Ziyaretçi</th>
              <th class="th">🎯 Ziyaret Edilen</th>
              <th class="th">📋 Amaç</th>
              <th class="th">🕐 Giriş</th>
              <th class="th">🕐 Çıkış</th>
              <th class="th">🪪 Kart</th>
              <th class="th">İşlem</th>
            </tr>
          </thead>
          <tbody id="visitor-table">
            ${visitorRows(visitors)}
          </tbody>
        </table>
      </div>
    </div>`;

  el.querySelector('#visit-filter').addEventListener('change', (e) => {
    let filtered = visitors;
    if (e.target.value === 'today') filtered = todayVisitors;
    else if (e.target.value === 'vip') filtered = visitors.filter(v => v.vip);
    else if (e.target.value === 'inside') filtered = visitors.filter(v => !v.checkOut);
    el.querySelector('#visitor-table').innerHTML = visitorRows(filtered);
  });

  el.querySelectorAll('.visitor-checkout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = getVisitors();
      const v = list.find(x => x.id === parseInt(btn.dataset.id));
      if (v) {
        v.checkOut = new Date().toISOString();
        saveVisitors(list);
        showToast(`${v.name} çıkış yaptı`, 'success');
        renderVisitorsPage(el);
      }
    });
  });

  el.querySelector('#add-visitor-btn')?.addEventListener('click', () => showVisitorModal(el));
}

function visitorRows(visitors) {
  if (visitors.length === 0) return '<tr><td colspan="7" class="td text-center text-slate-500 py-8">Kayıt yok</td></tr>';
  return visitors.slice(0, 20).map(v => `
    <tr class="hover:bg-white/5 transition">
      <td class="td">
        <div class="flex items-center gap-2">
          ${v.vip ? '<span class="text-amber-400">⭐</span>' : '<span>👤</span>'}
          <div>
            <p class="font-medium text-white">${v.name}</p>
            ${v.phone ? `<p class="text-[10px] text-slate-500">${v.phone}</p>` : ''}
          </div>
        </div>
      </td>
      <td class="td">${v.visiting}</td>
      <td class="td">${v.purpose}</td>
      <td class="td">${v.checkIn?.replace('T', ' ') || '—'}</td>
      <td class="td ${v.checkOut ? '' : 'text-green-400'}">${v.checkOut ? v.checkOut.replace('T', ' ') : '🟢 İçeride'}</td>
      <td class="td"><span class="badge">${v.badge}</span></td>
      <td class="td">${!v.checkOut ? `<button class="visitor-checkout-btn btn-secondary text-[10px] px-2 py-1" data-id="${v.id}">🚪</button>` : ''}</td>
    </tr>`).join('');
}

function showVisitorModal(el) {
  const existing = document.getElementById('visitor-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'visitor-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">👤 Ziyaretçi Kaydı</h3>
      <div class="space-y-3">
        <div><label class="label">Ad Soyad *</label><input id="vi-name" class="input-field w-full" placeholder="Ziyaretçi adı"></div>
        <div><label class="label">TC No</label><input id="vi-tc" class="input-field w-full" placeholder="11 haneli TC" maxlength="11"></div>
        <div><label class="label">Telefon</label><input id="vi-phone" class="input-field w-full" placeholder="0555..."></div>
        <div><label class="label">Ziyaret Edilen *</label><input id="vi-visiting" class="input-field w-full" placeholder="Hasta adı veya personel"></div>
        <div><label class="label">Departman</label><input id="vi-dept" class="input-field w-full" placeholder="Dahiliye"></div>
        <div><label class="label">Amaç</label><select id="vi-purpose" class="input-field w-full"><option>Hasta ziyareti</option><option>Görüşme</option><option>Kargo teslimi</option><option>Resmi iş</option><option>Diğer</option></select></div>
        <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" id="vi-vip"> ⭐ VIP Ziyaretçi</label>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="vi-save" class="btn-primary flex-1">💾 Kaydet & Giriş</button>
        <button id="vi-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#vi-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#vi-save').onclick = () => {
    const name = modal.querySelector('#vi-name').value.trim();
    const visiting = modal.querySelector('#vi-visiting').value.trim();
    if (!name || !visiting) { showToast('Ad ve ziyaret edilen kişi zorunludur', 'error'); return; }
    const visitors = getVisitors();
    const badgeNum = visitors.length + 1;
    visitors.push({
      id: Date.now(), name,
      tcNo: modal.querySelector('#vi-tc').value.trim(),
      phone: modal.querySelector('#vi-phone').value.trim(),
      visiting, department: modal.querySelector('#vi-dept').value.trim(),
      purpose: modal.querySelector('#vi-purpose').value,
      checkIn: new Date().toISOString(), checkOut: '',
      badge: `V-${String(badgeNum).padStart(4, '0')}`,
      vip: modal.querySelector('#vi-vip').checked,
      blacklist: false, notes: ''
    });
    saveVisitors(visitors);
    modal.remove();
    showToast(`🪪 ${name} giriş yaptı! Kart: V-${String(badgeNum).padStart(4, '0')}`, 'success');
    renderVisitorsPage(el);
  };
}
