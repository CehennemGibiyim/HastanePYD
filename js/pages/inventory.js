// ===== MALZEME YÖNETİMİ (INVENTORY) =====
import { showToast } from '../notifications.js';

const CATEGORIES = ['Temizlik', 'Tıbbi Malzeme', 'Kırtasiye', 'Mutfak', 'Teknik', 'Güvenlik', 'Diğer'];
const UNITS = ['Adet', 'Kutu', 'Paket', 'Litre', 'Kg', 'Rulo', 'Set'];

export function renderInventoryPage(container) {
  const items = getInventoryItems();
  const alerts = items.filter(i => i.quantity <= i.minStock);
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">📦 Malzeme & Stok Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">Stok takibi, giriş/çıkış ve tedarik yönetimi</p>
        </div>
        <div class="flex gap-2">
          <button id="inv-add-btn" class="btn-primary">+ Yeni Malzeme</button>
          <button id="inv-movement-btn" class="btn-secondary">📥 Giriş/Çıkış</button>
        </div>
      </div>
      ${alerts.length > 0 ? `
        <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6">
          <p class="text-red-300 font-semibold mb-2">⚠️ Kritik Stok Uyarısı (${alerts.length})</p>
          <div class="flex flex-wrap gap-2">
            ${alerts.map(a => `<span class="badge bg-red-500/20 text-red-300">${a.name}: ${a.quantity} ${a.unit} kaldı (min: ${a.minStock})</span>`).join('')}
          </div>
        </div>` : ''}
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${invStatCard('📦', 'Toplam Malzeme', items.length, 'cyan')}
        ${invStatCard('⚠️', 'Kritik Stok', alerts.length, 'red')}
        ${invStatCard('📊', 'Toplam Değer', formatCurrency(items.reduce((s,i)=>s+(i.quantity*(i.unitPrice||0)),0)), 'green')}
        ${invStatCard('🔄', 'Son Hareket', getLastMovementDate(), 'purple')}
      </div>
      <div class="card">
        <div class="flex flex-wrap gap-3 mb-4">
          <input id="inv-search" class="input-field flex-1 min-w-[200px]" placeholder="🔍 Malzeme ara...">
          <select id="inv-cat-filter" class="input-field"><option value="">Tüm Kategoriler</option>${CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
          <select id="inv-stock-filter" class="input-field">
            <option value="">Tüm Durumlar</option>
            <option value="low">⚠️ Kritik Stok</option>
            <option value="ok">✅ Normal Stok</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full"><thead><tr>
            <th class="th">Malzeme</th><th class="th">Kategori</th><th class="th">Stok</th>
            <th class="th">Min.</th><th class="th">Birim Fiyat</th><th class="th">Toplam</th><th class="th">Durum</th><th class="th">İşlem</th>
          </tr></thead><tbody id="inv-table-body"></tbody></table>
        </div>
      </div>
      <div class="card mt-6">
        <h3 class="text-lg font-semibold text-white mb-4">📋 Son Stok Hareketleri</h3>
        <div id="inv-movements" class="overflow-x-auto"></div>
      </div>
    </div>`;
  renderInventoryTable(items);
  renderMovements();
  document.getElementById('inv-add-btn').onclick = () => showItemModal(null);
  document.getElementById('inv-movement-btn').onclick = () => showMovementModal(items);
  document.getElementById('inv-search').oninput = () => filterAndRender();
  document.getElementById('inv-cat-filter').onchange = () => filterAndRender();
  document.getElementById('inv-stock-filter').onchange = () => filterAndRender();
}

function filterAndRender() {
  const search = document.getElementById('inv-search')?.value.toLowerCase() || '';
  const cat = document.getElementById('inv-cat-filter')?.value || '';
  const stock = document.getElementById('inv-stock-filter')?.value || '';
  let items = getInventoryItems();
  if (search) items = items.filter(i => i.name.toLowerCase().includes(search));
  if (cat) items = items.filter(i => i.category === cat);
  if (stock === 'low') items = items.filter(i => i.quantity <= i.minStock);
  else if (stock === 'ok') items = items.filter(i => i.quantity > i.minStock);
  renderInventoryTable(items);
}

function renderInventoryTable(items) {
  const tbody = document.getElementById('inv-table-body');
  if (!tbody) return;
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="td text-center py-8 text-slate-500">📭 Malzeme bulunamadı</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(i => `
    <tr class="border-t border-white/5 hover:bg-white/[0.02]">
      <td class="td font-medium text-white">${i.name}</td>
      <td class="td"><span class="badge">${i.category}</span></td>
      <td class="td font-semibold ${i.quantity <= i.minStock ? 'text-red-400' : 'text-green-400'}">${i.quantity} ${i.unit}</td>
      <td class="td text-slate-400">${i.minStock}</td>
      <td class="td">${formatCurrency(i.unitPrice || 0)}</td>
      <td class="td font-medium">${formatCurrency((i.unitPrice || 0) * i.quantity)}</td>
      <td class="td">${i.quantity <= i.minStock ? '<span class="badge bg-red-500/20 text-red-400">⚠️ Kritik</span>' : '<span class="badge bg-green-500/20 text-green-400">✅ Normal</span>'}</td>
      <td class="td">
        <div class="flex gap-1">
          <button class="inv-edit-btn btn-secondary text-xs px-2 py-1" data-id="${i.id}">✏️</button>
          <button class="inv-del-btn btn-secondary text-xs px-2 py-1 text-red-400" data-id="${i.id}">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
  tbody.querySelectorAll('.inv-edit-btn').forEach(b => { b.onclick = () => { const item = items.find(x => x.id === parseInt(b.dataset.id)); if (item) showItemModal(item); }; });
  tbody.querySelectorAll('.inv-del-btn').forEach(b => { b.onclick = () => { const all = getInventoryItems().filter(x => x.id !== parseInt(b.dataset.id)); saveInventoryItems(all); showToast('Malzeme silindi', 'success'); filterAndRender(); }; });
}

function renderMovements() {
  const el = document.getElementById('inv-movements');
  if (!el) return;
  const moves = getMovements().slice(-15).reverse();
  if (!moves.length) { el.innerHTML = '<p class="text-slate-500 text-sm text-center py-4">Hareket yok</p>'; return; }
  el.innerHTML = `<table class="w-full"><thead><tr><th class="th">Tarih</th><th class="th">Malzeme</th><th class="th">Tür</th><th class="th">Miktar</th><th class="th">Sorumlu</th><th class="th">Not</th></tr></thead><tbody>
    ${moves.map(m => `<tr class="border-t border-white/5"><td class="td text-xs">${m.date}</td><td class="td">${m.itemName}</td>
      <td class="td">${m.type === 'in' ? '<span class="badge bg-green-500/20 text-green-400">📥 Giriş</span>' : '<span class="badge bg-red-500/20 text-red-400">📤 Çıkış</span>'}</td>
      <td class="td font-medium">${m.quantity}</td><td class="td text-xs">${m.responsible || '-'}</td><td class="td text-xs text-slate-400">${m.note || '-'}</td></tr>`).join('')}
  </tbody></table>`;
}

function showItemModal(existing) {
  const item = existing || { name: '', category: 'Tıbbi Malzeme', quantity: 0, minStock: 10, unit: 'Adet', unitPrice: 0, supplier: '' };
  const m = createModal('inv-item-modal');
  m.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[80vh] overflow-y-auto">
    <h3 class="text-xl font-bold text-white mb-4">${existing ? '✏️ Malzeme Düzenle' : '➕ Yeni Malzeme'}</h3>
    <div class="space-y-3">
      <div><label class="label">Malzeme Adı *</label><input id="ii-name" class="input-field w-full" value="${item.name}"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label">Kategori</label><select id="ii-cat" class="input-field w-full">${CATEGORIES.map(c=>`<option ${item.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        <div><label class="label">Birim</label><select id="ii-unit" class="input-field w-full">${UNITS.map(u=>`<option ${item.unit===u?'selected':''}>${u}</option>`).join('')}</select></div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div><label class="label">Mevcut Stok</label><input id="ii-qty" type="number" class="input-field w-full" value="${item.quantity}"></div>
        <div><label class="label">Min. Stok</label><input id="ii-min" type="number" class="input-field w-full" value="${item.minStock}"></div>
        <div><label class="label">Birim Fiyat (₺)</label><input id="ii-price" type="number" class="input-field w-full" value="${item.unitPrice || 0}"></div>
      </div>
      <div><label class="label">Tedarikçi</label><input id="ii-supplier" class="input-field w-full" value="${item.supplier || ''}"></div>
    </div>
    <div class="flex gap-3 mt-6">
      <button id="ii-save" class="btn-primary flex-1">💾 Kaydet</button>
      <button id="ii-cancel" class="btn-secondary flex-1">İptal</button>
    </div></div>`;
  m.onclick = (e) => { if (e.target.id === 'inv-item-modal') m.remove(); };
  document.getElementById('ii-cancel').onclick = () => m.remove();
  document.getElementById('ii-save').onclick = () => {
    const name = document.getElementById('ii-name').value.trim();
    if (!name) { showToast('Malzeme adı gereklidir', 'error'); return; }
    const newItem = { ...item, name, category: document.getElementById('ii-cat').value, unit: document.getElementById('ii-unit').value,
      quantity: parseInt(document.getElementById('ii-qty').value)||0, minStock: parseInt(document.getElementById('ii-min').value)||10,
      unitPrice: parseFloat(document.getElementById('ii-price').value)||0, supplier: document.getElementById('ii-supplier').value.trim() };
    const items = getInventoryItems();
    if (existing) { const idx = items.findIndex(x => x.id === item.id); if (idx >= 0) items[idx] = newItem; }
    else { newItem.id = Date.now(); items.push(newItem); }
    saveInventoryItems(items);
    m.remove(); showToast(existing ? 'Güncellendi' : 'Eklendi', 'success');
    filterAndRender();
  };
}

function showMovementModal(items) {
  const m = createModal('inv-move-modal');
  m.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
    <h3 class="text-xl font-bold text-white mb-4">📥 Stok Giriş / Çıkış</h3>
    <div class="space-y-3">
      <div><label class="label">Malzeme</label><select id="im-item" class="input-field w-full">${items.map(i=>`<option value="${i.id}">${i.name} (${i.quantity} ${i.unit})</option>`).join('')}</select></div>
      <div><label class="label">İşlem Türü</label><div class="flex gap-2"><button id="im-in" class="btn-primary flex-1">📥 Giriş</button><button id="im-out" class="btn-secondary flex-1">📤 Çıkış</button></div></div>
      <div><label class="label">Miktar</label><input id="im-qty" type="number" class="input-field w-full" min="1" value="1"></div>
      <div><label class="label">Sorumlu</label><input id="im-resp" class="input-field w-full" placeholder="İşlemi yapan kişi"></div>
      <div><label class="label">Not</label><input id="im-note" class="input-field w-full" placeholder="Açıklama"></div>
    </div>
    <div class="flex gap-3 mt-6"><button id="im-save" class="btn-primary flex-1">💾 Kaydet</button><button id="im-cancel" class="btn-secondary flex-1">İptal</button></div></div>`;
  m.onclick = (e) => { if (e.target.id === 'inv-move-modal') m.remove(); };
  document.getElementById('im-cancel').onclick = () => m.remove();
  let moveType = 'in';
  document.getElementById('im-in').onclick = () => { moveType = 'in'; document.getElementById('im-in').className = 'btn-primary flex-1'; document.getElementById('im-out').className = 'btn-secondary flex-1'; };
  document.getElementById('im-out').onclick = () => { moveType = 'out'; document.getElementById('im-out').className = 'btn-primary flex-1'; document.getElementById('im-in').className = 'btn-secondary flex-1'; };
  document.getElementById('im-save').onclick = () => {
    const itemId = parseInt(document.getElementById('im-item').value);
    const qty = parseInt(document.getElementById('im-qty').value)||0;
    if (!qty) { showToast('Miktar girin', 'error'); return; }
    const allItems = getInventoryItems();
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    if (moveType === 'out' && item.quantity < qty) { showToast('Yetersiz stok!', 'error'); return; }
    item.quantity += moveType === 'in' ? qty : -qty;
    saveInventoryItems(allItems);
    const moves = getMovements();
    moves.push({ id: Date.now(), itemId, itemName: item.name, type: moveType, quantity: qty, date: new Date().toISOString().split('T')[0], responsible: document.getElementById('im-resp').value.trim(), note: document.getElementById('im-note').value.trim() });
    saveMovements(moves);
    m.remove();
    showToast(moveType === 'in' ? 'Stok girişi yapıldı' : 'Stok çıkışı yapıldı', 'success');
    renderInventoryPage(document.getElementById('content'));
  };
}

function createModal(id) { const e = document.getElementById(id); if (e) e.remove(); const m = document.createElement('div'); m.id = id; m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'; document.body.appendChild(m); return m; }
function getInventoryItems() { try { return JSON.parse(localStorage.getItem('hospital_inventory') || '[]'); } catch { return []; } }
function saveInventoryItems(items) { localStorage.setItem('hospital_inventory', JSON.stringify(items)); }
function getMovements() { try { return JSON.parse(localStorage.getItem('hospital_inventory_moves') || '[]'); } catch { return []; } }
function saveMovements(m) { localStorage.setItem('hospital_inventory_moves', JSON.stringify(m)); }
function formatCurrency(v) { return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(v); }
function getLastMovementDate() { const m = getMovements(); return m.length ? m[m.length-1].date : 'Yok'; }
function invStatCard(icon, label, value, color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5"><p class="text-sm text-${color}-300">${icon} ${label}</p><p class="text-2xl font-bold text-white mt-1">${value}</p></div>`;
}
