// ===== SIFRE & KIMLIK YÖNETIM KASASI =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_password_vault';

function getVault() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultVault(); } catch { return getDefaultVault(); } }
function saveVault(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultVault() {
  return [
    { id: 1, name: 'IT Wi-Fi Şifresi', category: 'network', username: 'admin', password: 'HastaneWiFi2025!', url: '', sharedWith: ['IT Departmanı'], lastChanged: '2025-06-01', expiresAt: '2025-12-01' },
    { id: 2, name: 'Lab Erişim Kodu', category: 'access', username: '', password: 'LAB-4521', url: '', sharedWith: ['Laboratuvar'], lastChanged: '2025-05-15', expiresAt: '2025-11-15' },
    { id: 3, name: 'Eczane Otomasyon', category: 'software', username: 'eczane_admin', password: 'Ecz2025!Pro', url: 'https://eczane.hastane.gov.tr', sharedWith: ['Eczacıbaşı'], lastChanged: '2025-04-01', expiresAt: '2025-10-01' },
    { id: 4, name: 'Röntgen Sistemi', category: 'software', username: 'radyoloji', password: 'Rad$ys2025', url: '', sharedWith: ['Radyoloji'], lastChanged: '2025-03-20', expiresAt: '2026-03-20' },
    { id: 5, name: 'Güvenlik Kamera Sistemi', category: 'security', username: 'guv_admin', password: 'C@m2025!Sec', url: '192.168.1.100', sharedWith: ['Güvenlik Müdürü'], lastChanged: '2025-02-10', expiresAt: '2026-02-10' },
  ];
}

const categories = { network: '🌐 Network', software: '💻 Yazılım', access: '🔑 Erişim Kodu', security: '🛡️ Güvenlik', database: '🗄️ Veritabanı', other: '📋 Diğer' };

export function renderPasswordVaultPage(el) {
  const vault = getVault();
  const now = new Date();
  const expiringSoon = vault.filter(v => {
    if (!v.expiresAt) return false;
    const d = new Date(v.expiresAt);
    return (d - now) < 30 * 24 * 3600 * 1000 && d > now;
  }).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🔑 Şifre & Kimlik Kasası</h1>
          <p class="text-slate-400 text-sm mt-1">Departman ortak şifreleri ve erişim kodları</p>
        </div>
        <button id="add-vault-btn" class="btn-primary">➕ Şifre Ekle</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${vault.length}</p><p class="text-xs text-slate-400">🔑 Kayıtlı Şifre</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${new Set(vault.flatMap(v => v.sharedWith)).size}</p><p class="text-xs text-slate-400">👥 Erişim Grubu</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${expiringSoon > 0 ? 'text-amber-300' : 'text-slate-300'}">${expiringSoon}</p><p class="text-xs text-slate-400">⚠️ Süresi Yakın</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${Object.keys(categories).length}</p><p class="text-xs text-slate-400">🏷️ Kategori</p></div>
    </div>

    <div class="card fade-in">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <h3 class="text-lg font-semibold text-white">Kasa</h3>
        <select id="vf-cat" class="input-field text-xs"><option value="">Tüm Kategoriler</option>${Object.entries(categories).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="space-y-3" id="vault-list">${vaultListHTML(vault)}</div>
    </div>`;

  el.querySelector('#vf-cat').addEventListener('change', () => {
    const cat = el.querySelector('#vf-cat').value;
    const filtered = cat ? vault.filter(v => v.category === cat) : vault;
    el.querySelector('#vault-list').innerHTML = vaultListHTML(filtered);
    attachVaultHandlers(el, vault);
  });

  el.querySelector('#add-vault-btn')?.addEventListener('click', () => showVaultModal(el));
  attachVaultHandlers(el, vault);
}

function attachVaultHandlers(el, vault) {
  el.querySelectorAll('.vault-toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const pwEl = btn.parentElement.querySelector('.vault-password');
      if (pwEl) {
        const isHidden = pwEl.dataset.hidden === '1';
        pwEl.textContent = isHidden ? pwEl.dataset.pw : '••••••••';
        pwEl.dataset.hidden = isHidden ? '0' : '1';
        btn.textContent = isHidden ? '🙈' : '👁️';
      }
    });
  });
  el.querySelectorAll('.vault-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pw = btn.dataset.pw;
      navigator.clipboard?.writeText(pw).then(() => showToast('Şifre kopyalandı!', 'success')).catch(() => showToast('Kopyalanamadı', 'error'));
    });
  });
  el.querySelectorAll('.vault-del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = getVault().filter(v => v.id !== parseInt(btn.dataset.id));
      saveVault(list);
      showToast('Silindi', 'success');
      renderPasswordVaultPage(el);
    });
  });
}

function vaultListHTML(vault) {
  if (vault.length === 0) return '<p class="text-slate-500 text-sm text-center py-8">Kayıt yok</p>';
  return vault.map(v => `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 transition">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="text-2xl">${categories[v.category]?.split(' ')[0] || '🔑'}</div>
        <div class="flex-1">
          <h4 class="font-semibold text-white text-sm">${v.name}</h4>
          <p class="text-xs text-slate-400">${categories[v.category] || v.category} · Erişim: ${v.sharedWith.join(', ')}</p>
          ${v.username ? `<p class="text-xs text-slate-500">👤 ${v.username}</p>` : ''}
          ${v.url ? `<p class="text-xs text-cyan-400">${v.url}</p>` : ''}
          <p class="text-[10px] text-slate-600 mt-1">Son değişiklik: ${v.lastChanged} · Son kullanma: ${v.expiresAt || 'Süresiz'}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="vault-password font-mono text-sm text-amber-300" data-pw="${v.password}" data-hidden="1">••••••••</span>
          <button class="vault-toggle-pw text-sm hover:bg-white/10 rounded p-1 transition">👁️</button>
          <button class="vault-copy-btn text-sm hover:bg-white/10 rounded p-1 transition" data-pw="${v.password}">📋</button>
          <button class="vault-del-btn text-sm hover:bg-red-500/10 rounded p-1 transition" data-id="${v.id}">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

function showVaultModal(el) {
  const existing = document.getElementById('vault-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'vault-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">🔑 Şifre Ekle</h3>
      <div class="space-y-3">
        <div><label class="label">İsim *</label><input id="v-name" class="input-field w-full" placeholder="Wi-Fi, Lab erişim..."></div>
        <div><label class="label">Kategori</label><select id="v-cat" class="input-field w-full">${Object.entries(categories).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div><label class="label">Kullanıcı Adı</label><input id="v-user" class="input-field w-full" placeholder="admin"></div>
        <div><label class="label">Şifre *</label><input id="v-pass" class="input-field w-full" placeholder="Şifre"></div>
        <div><label class="label">URL / IP</label><input id="v-url" class="input-field w-full" placeholder="https://..."></div>
        <div><label class="label">Paylaşılan Gruplar</label><input id="v-shared" class="input-field w-full" placeholder="IT, Güvenlik (virgülle ayırın)"></div>
        <div><label class="label">Son Kullanma Tarihi</label><input id="v-expiry" type="date" class="input-field w-full"></div>
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
    const name = modal.querySelector('#v-name').value.trim();
    const password = modal.querySelector('#v-pass').value.trim();
    if (!name || !password) { showToast('İsim ve şifre zorunludur', 'error'); return; }
    const vault = getVault();
    vault.push({
      id: Date.now(), name, category: modal.querySelector('#v-cat').value,
      username: modal.querySelector('#v-user').value.trim(), password,
      url: modal.querySelector('#v-url').value.trim(),
      sharedWith: modal.querySelector('#v-shared').value.split(',').map(s => s.trim()).filter(Boolean),
      lastChanged: new Date().toISOString().split('T')[0],
      expiresAt: modal.querySelector('#v-expiry').value || ''
    });
    saveVault(vault);
    modal.remove();
    showToast('Şifre kasaya eklendi!', 'success');
    renderPasswordVaultPage(el);
  };
}
