// ===== QR BARKOD STOK SİSTEMİ =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_qr_inventory';

function getQRItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultItems(); } catch { return getDefaultItems(); }
}
function saveQRItems(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultItems() {
  return [
    { id: 1, name: 'Lateks Eldiven (M)', sku: 'ELD-001', category: 'Sarf', unit: 'Kutu (100 adet)', stock: 45, minStock: 20, price: 85, location: 'Depo A-3', lastCount: '2025-07-01', dailyUsage: 3.2 },
    { id: 2, name: 'Cerrahi Maske', sku: 'MSK-001', category: 'Sarf', unit: 'Kutu (50 adet)', stock: 120, minStock: 50, price: 45, location: 'Depo A-1', lastCount: '2025-07-01', dailyUsage: 8.5 },
    { id: 3, name: 'Enjektör 5ml', sku: 'ENJ-005', category: 'Sarf', unit: 'Kutu (100 adet)', stock: 30, minStock: 15, price: 120, location: 'Depo B-2', lastCount: '2025-07-01', dailyUsage: 4.1 },
    { id: 4, name: 'Serum Fizyolojik 500ml', sku: 'SRY-050', category: 'İlaç', unit: 'Koli (20 adet)', stock: 8, minStock: 10, price: 65, location: 'Eczane', lastCount: '2025-07-01', dailyUsage: 5.3 },
    { id: 5, name: 'Dezenfektan 5L', sku: 'DEZ-005', category: 'Temizlik', unit: 'Bidon', stock: 15, minStock: 5, price: 95, location: 'Temizlik Deposu', lastCount: '2025-07-01', dailyUsage: 0.8 },
  ];
}

const categoryColors = { 'Sarf': 'text-cyan-400 bg-cyan-500/10', 'İlaç': 'text-red-400 bg-red-500/10', 'Temizlik': 'text-green-400 bg-green-500/10', 'Ekipman': 'text-purple-400 bg-purple-500/10', 'Diğer': 'text-slate-400 bg-slate-500/10' };

export function renderQRInventoryPage(el) {
  const items = getQRItems();
  const lowStock = items.filter(i => i.stock <= i.minStock);
  const totalValue = items.reduce((s, i) => s + (i.stock * i.price), 0);
  const today = new Date().toISOString().split('T')[0];

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🏗️ QR Barkod Stok Sistemi</h1>
          <p class="text-slate-400 text-sm mt-1">QR kodlu stok takibi, hızlı sayım ve tüketim analizi</p>
        </div>
        <div class="flex gap-2">
          <button id="quick-count-btn" class="btn-secondary">📱 Hızlı Sayım</button>
          <button id="add-qr-item-btn" class="btn-primary">➕ Malzeme Ekle</button>
        </div>
      </div>
    </div>

    ${lowStock.length > 0 ? `
    <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-6 fade-in">
      <div class="flex items-center gap-3">
        <span class="text-3xl">⚠️</span>
        <div>
          <h4 class="font-semibold text-amber-300">${lowStock.length} malzeme kritik stok seviyesinde!</h4>
          <p class="text-xs text-amber-400/80">${lowStock.map(i => i.name).join(', ')}</p>
        </div>
      </div>
    </div>` : ''}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${items.length}</p><p class="text-xs text-slate-400">📦 Toplam Kalem</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${lowStock.length > 0 ? 'text-red-300' : 'text-green-300'}">${lowStock.length}</p><p class="text-xs text-slate-400">⚠️ Kritik Stok</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">₺${(totalValue / 1000).toFixed(1)}K</p><p class="text-xs text-slate-400">💰 Toplam Değer</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${new Set(items.map(i => i.category)).size}</p><p class="text-xs text-slate-400">🏷️ Kategori</p></div>
    </div>

    <div class="card fade-in">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <h3 class="text-lg font-semibold text-white">Stok Listesi</h3>
        <select id="qi-cat" class="input-field text-xs"><option value="">Tüm Kategoriler</option>${[...new Set(items.map(i => i.category))].map(c => `<option value="${c}">${c}</option>`).join('')}</select>
        <select id="qi-sort" class="input-field text-xs"><option value="name">Ada Göre</option><option value="stock">Stok Miktarı</option><option value="usage">Tüketim Hızı</option></select>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr>
              <th class="th">QR</th>
              <th class="th">📦 Malzeme</th>
              <th class="th">🏷️ SKU</th>
              <th class="th">📊 Stok</th>
              <th class="th">📉 Min</th>
              <th class="th">📈 Günlük Tüketim</th>
              <th class="th">📍 Konum</th>
              <th class="th">💰 Birim Fiyat</th>
              <th class="th">İşlem</th>
            </tr>
          </thead>
          <tbody id="qr-items-table">${qrItemRows(items)}</tbody>
        </table>
      </div>
    </div>`;

  // Generate QR codes using qrcode-generator (loaded globally)
  setTimeout(() => {
    items.forEach(item => {
      const qrEl = document.getElementById(`qr-${item.id}`);
      if (qrEl && typeof qrcode !== 'undefined') {
        try {
          const qr = qrcode(0, 'M');
          qr.addData(JSON.stringify({ id: item.id, sku: item.sku, name: item.name }));
          qr.make();
          qrEl.innerHTML = qr.createSvgTag(3, 0);
          qrEl.querySelector('svg')?.setAttribute('class', 'w-10 h-10');
        } catch (e) { qrEl.textContent = '📱'; }
      }
    });
  }, 100);

  const filterAndRender = () => {
    const cat = el.querySelector('#qi-cat').value;
    const sort = el.querySelector('#qi-sort').value;
    let filtered = cat ? items.filter(i => i.category === cat) : [...items];
    if (sort === 'stock') filtered.sort((a, b) => a.stock - b.stock);
    else if (sort === 'usage') filtered.sort((a, b) => b.dailyUsage - a.dailyUsage);
    else filtered.sort((a, b) => a.name.localeCompare(b.name));
    el.querySelector('#qr-items-table').innerHTML = qrItemRows(filtered);
  };
  el.querySelector('#qi-cat')?.addEventListener('change', filterAndRender);
  el.querySelector('#qi-sort')?.addEventListener('change', filterAndRender);

  el.querySelector('#add-qr-item-btn')?.addEventListener('click', () => showQRItemModal(el));

  el.querySelector('#quick-count-btn')?.addEventListener('click', () => {
    showToast('Hızlı sayım modu: Her malzeme için güncel stok girin', 'success');
    el.querySelectorAll('.quick-stock-input').forEach(input => {
      input.style.display = '';
      input.addEventListener('change', () => {
        const id = parseInt(input.dataset.id);
        const list = getQRItems();
        const item = list.find(x => x.id === id);
        if (item) {
          item.stock = parseInt(input.value) || 0;
          item.lastCount = today;
          saveQRItems(list);
          showToast(`${item.name} stok güncellendi: ${item.stock}`, 'success');
        }
      });
    });
  });

  // +/- buttons
  el.querySelectorAll('.stock-adjust-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const delta = parseInt(btn.dataset.delta);
      const list = getQRItems();
      const item = list.find(x => x.id === id);
      if (item) {
        item.stock = Math.max(0, item.stock + delta);
        saveQRItems(list);
        renderQRInventoryPage(el);
      }
    });
  });
}

function qrItemRows(items) {
  if (items.length === 0) return '<tr><td colspan="9" class="td text-center text-slate-500 py-8">Malzeme bulunamadı</td></tr>';
  return items.map(i => {
    const isLow = i.stock <= i.minStock;
    return `
    <tr class="hover:bg-white/5 transition ${isLow ? 'bg-amber-500/5' : ''}">
      <td class="td"><div id="qr-${i.id}" class="w-10 h-10 flex items-center justify-center"></div></td>
      <td class="td">
        <p class="font-medium text-white">${i.name}</p>
        <span class="text-[10px] px-2 py-0.5 rounded-full ${categoryColors[i.category] || categoryColors['Diğer']}">${i.category}</span>
      </td>
      <td class="td font-mono text-xs">${i.sku}</td>
      <td class="td">
        <div class="flex items-center gap-1">
          <button class="stock-adjust-btn text-xs hover:bg-white/10 rounded px-1" data-id="${i.id}" data-delta="-1">−</button>
          <span class="font-bold ${isLow ? 'text-red-400' : 'text-green-400'}">${i.stock}</span>
          <button class="stock-adjust-btn text-xs hover:bg-white/10 rounded px-1" data-id="${i.id}" data-delta="1">+</button>
          <span class="text-slate-500 text-[10px]">${i.unit}</span>
        </div>
      </td>
      <td class="td text-slate-500">${i.minStock}</td>
      <td class="td text-amber-400">${i.dailyUsage}/gün</td>
      <td class="td text-slate-400">${i.location}</td>
      <td class="td">₺${i.price}</td>
      <td class="td"><input type="number" class="quick-stock-input input-field text-xs w-16" data-id="${i.id}" value="${i.stock}" style="display:none"></td>
    </tr>`;
  }).join('');
}

function showQRItemModal(el) {
  const existing = document.getElementById('qr-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'qr-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📦 Malzeme Ekle</h3>
      <div class="space-y-3">
        <div><label class="label">Malzeme Adı *</label><input id="qr-name" class="input-field w-full" placeholder="Malzeme adı"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">SKU Kodu *</label><input id="qr-sku" class="input-field w-full" placeholder="ELD-001"></div>
          <div><label class="label">Kategori</label><select id="qr-cat" class="input-field w-full"><option>Sarf</option><option>İlaç</option><option>Temizlik</option><option>Ekipman</option><option>Diğer</option></select></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="label">Stok</label><input id="qr-stock" type="number" class="input-field w-full" value="0"></div>
          <div><label class="label">Min. Stok</label><input id="qr-min" type="number" class="input-field w-full" value="10"></div>
          <div><label class="label">Birim Fiyat ₺</label><input id="qr-price" type="number" class="input-field w-full" value="0"></div>
        </div>
        <div><label class="label">Birim</label><input id="qr-unit" class="input-field w-full" placeholder="Kutu, Koli, Adet..." value="Kutu"></div>
        <div><label class="label">Konum</label><input id="qr-location" class="input-field w-full" placeholder="Depo A-3"></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="qr-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="qr-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#qr-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#qr-save').onclick = () => {
    const name = modal.querySelector('#qr-name').value.trim();
    const sku = modal.querySelector('#qr-sku').value.trim();
    if (!name || !sku) { showToast('Ad ve SKU zorunludur', 'error'); return; }
    const items = getQRItems();
    items.push({
      id: Date.now(), name, sku, category: modal.querySelector('#qr-cat').value,
      unit: modal.querySelector('#qr-unit').value.trim(), stock: parseInt(modal.querySelector('#qr-stock').value) || 0,
      minStock: parseInt(modal.querySelector('#qr-min').value) || 10,
      price: parseInt(modal.querySelector('#qr-price').value) || 0,
      location: modal.querySelector('#qr-location').value.trim(),
      lastCount: new Date().toISOString().split('T')[0],
      dailyUsage: 0
    });
    saveQRItems(items);
    modal.remove();
    showToast('Malzeme eklendi! QR kodu otomatik oluşturuldu.', 'success');
    renderQRInventoryPage(el);
  };
}
