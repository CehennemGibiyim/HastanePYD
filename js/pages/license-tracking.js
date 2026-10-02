// ===== SERTIFIKA & LİSANS TAKİBİ =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_licenses';

function getLicenses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultLicenses(); } catch { return getDefaultLicenses(); }
}
function saveLicenses(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultLicenses() {
  return [
    { id: 1, personName: 'Dr. Ayşe Yılmaz', type: 'Tıp Doktoru Lisansı', issuer: 'TTB', number: 'TTB-2019-4567', issueDate: '2019-06-15', expiryDate: '2025-09-15', status: 'active', category: 'medical' },
    { id: 2, personName: 'Hem. Fatma Çelik', type: 'Hemşirelik Lisansı', issuer: 'SB', number: 'HEM-2020-1234', issueDate: '2020-03-01', expiryDate: '2025-08-20', status: 'active', category: 'nursing' },
    { id: 3, personName: 'Dr. Mehmet Kaya', type: 'ACLS Sertifikası', issuer: 'AHA', number: 'ACLS-2023-789', issueDate: '2023-01-10', expiryDate: '2025-07-01', status: 'expiring_soon', category: 'certification' },
    { id: 4, personName: 'Ali Yıldız', type: 'İş Güvenliği Sertifikası', issuer: 'İSGÜM', number: 'ISG-2022-567', issueDate: '2022-05-20', expiryDate: '2025-05-20', status: 'expired', category: 'safety' },
    { id: 5, personName: 'Zeynep Arslan', type: 'İlk Yardım Sertifikası', issuer: 'Kızılay', number: 'IY-2024-012', issueDate: '2024-02-01', expiryDate: '2027-02-01', status: 'active', category: 'certification' },
  ];
}

const categoryLabels = { medical: '🩺 Tıp', nursing: '👩‍⚕️ Hemşirelik', certification: '📜 Sertifika', safety: '🛡️ Güvenlik', technical: '🔧 Teknik', admin: '📋 İdari' };
const statusColors = { active: 'text-green-400 bg-green-500/10', expiring_soon: 'text-amber-400 bg-amber-500/10', expired: 'text-red-400 bg-red-500/10' };
const statusLabels = { active: 'Geçerli', expiring_soon: 'Süresi Yaklaşıyor', expired: 'Süresi Dolmuş' };

export function renderLicenseTrackingPage(el) {
  const licenses = getLicenses();
  const now = new Date();
  const active = licenses.filter(l => l.status === 'active').length;
  const expiring = licenses.filter(l => {
    const d = new Date(l.expiryDate);
    return (d - now) < 30 * 24 * 3600 * 1000 && d > now;
  }).length;
  const expired = licenses.filter(l => new Date(l.expiryDate) < now).length;

  // Update statuses
  licenses.forEach(l => {
    const d = new Date(l.expiryDate);
    if (d < now) l.status = 'expired';
    else if ((d - now) < 30 * 24 * 3600 * 1000) l.status = 'expiring_soon';
    else l.status = 'active';
  });
  saveLicenses(licenses);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📜 Sertifika & Lisans Takibi</h1>
          <p class="text-slate-400 text-sm mt-1">Personel sertifikaları, lisanslar ve yenileme takibi</p>
        </div>
        <button id="add-license-btn" class="btn-primary">➕ Sertifika Ekle</button>
      </div>
    </div>

    ${expired > 0 ? `
    <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6 fade-in">
      <div class="flex items-center gap-3">
        <span class="text-3xl">🚨</span>
        <div>
          <h4 class="font-semibold text-red-300">Dikkat! ${expired} sertifikanın süresi dolmuş</h4>
          <p class="text-xs text-red-400/80">Süresi dolan sertifikaları yenilemek için ilgili personel ile iletişime geçin</p>
        </div>
      </div>
    </div>` : ''}

    <div class="grid grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${active}</p><p class="text-xs text-slate-400">✅ Geçerli</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${expiring > 0 ? 'text-amber-300 animate-pulse' : 'text-slate-300'}">${expiring}</p><p class="text-xs text-slate-400">⚠️ Süresi Yakın</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${expired > 0 ? 'text-red-300' : 'text-slate-300'}">${expired}</p><p class="text-xs text-slate-400">❌ Süresi Dolmuş</p></div>
    </div>

    <div class="card fade-in">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <h3 class="text-lg font-semibold text-white">Sertifika Listesi</h3>
        <select id="lf-status" class="input-field text-xs"><option value="">Tüm Durumlar</option>${Object.entries(statusLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <select id="lf-cat" class="input-field text-xs"><option value="">Tüm Kategoriler</option>${Object.entries(categoryLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="space-y-3" id="license-list">${licenseListHTML(licenses)}</div>
    </div>`;

  const filterAndRender = () => {
    const status = el.querySelector('#lf-status').value;
    const cat = el.querySelector('#lf-cat').value;
    let filtered = licenses;
    if (status) filtered = filtered.filter(l => l.status === status);
    if (cat) filtered = filtered.filter(l => l.category === cat);
    el.querySelector('#license-list').innerHTML = licenseListHTML(filtered);
  };
  el.querySelector('#lf-status').addEventListener('change', filterAndRender);
  el.querySelector('#lf-cat').addEventListener('change', filterAndRender);
  el.querySelector('#add-license-btn')?.addEventListener('click', () => showLicenseModal(el));
}

function licenseListHTML(licenses) {
  if (licenses.length === 0) return '<p class="text-slate-500 text-sm text-center py-8">Sertifika bulunamadı</p>';
  return licenses.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)).map(l => {
    const now = new Date();
    const exp = new Date(l.expiryDate);
    const daysLeft = Math.ceil((exp - now) / (24 * 3600 * 1000));
    return `
    <div class="rounded-xl border ${l.status === 'expired' ? 'border-red-500/20 bg-red-500/5' : l.status === 'expiring_soon' ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'} p-4">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="text-2xl">${categoryLabels[l.category]?.split(' ')[0] || '📜'}</div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h4 class="font-semibold text-white text-sm">${l.type}</h4>
            <span class="text-[10px] px-2 py-0.5 rounded-full ${statusColors[l.status]}">${statusLabels[l.status]}</span>
          </div>
          <p class="text-xs text-slate-400">👤 ${l.personName} · ${l.issuer} · No: ${l.number}</p>
          <p class="text-xs text-slate-500">📅 Veriliş: ${l.issueDate} · ⏰ Bitiş: ${l.expiryDate}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold ${daysLeft < 0 ? 'text-red-400' : daysLeft < 30 ? 'text-amber-400' : 'text-green-400'}">
            ${daysLeft < 0 ? Math.abs(daysLeft) + ' gün gecikmiş' : daysLeft + ' gün kaldı'}
          </p>
        </div>
      </div>
    </div>`;
  }).join('');
}

function showLicenseModal(el) {
  const existing = document.getElementById('license-modal');
  if (existing) existing.remove();
  const personnel = getPersonnel({});
  const modal = document.createElement('div');
  modal.id = 'license-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📜 Sertifika Ekle</h3>
      <div class="space-y-3">
        <div><label class="label">Personel *</label><select id="li-person" class="input-field w-full">${personnel.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}</select></div>
        <div><label class="label">Sertifika Türü *</label><input id="li-type" class="input-field w-full" placeholder="ACLS, BLS, Tıp Lisansı..."></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Veren Kurum</label><input id="li-issuer" class="input-field w-full" placeholder="TTB, AHA..."></div>
          <div><label class="label">Numara</label><input id="li-number" class="input-field w-full" placeholder="Sertifika no"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Veriliş Tarihi</label><input id="li-issue" type="date" class="input-field w-full"></div>
          <div><label class="label">Bitiş Tarihi *</label><input id="li-expiry" type="date" class="input-field w-full"></div>
        </div>
        <div><label class="label">Kategori</label><select id="li-cat" class="input-field w-full">${Object.entries(categoryLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="li-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="li-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#li-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#li-save').onclick = () => {
    const type = modal.querySelector('#li-type').value.trim();
    const expiry = modal.querySelector('#li-expiry').value;
    if (!type) { showToast('Sertifika türü zorunludur', 'error'); return; }
    const licenses = getLicenses();
    const now = new Date();
    const exp = new Date(expiry);
    let status = 'active';
    if (exp < now) status = 'expired';
    else if ((exp - now) < 30 * 24 * 3600 * 1000) status = 'expiring_soon';
    licenses.push({
      id: Date.now(), personName: modal.querySelector('#li-person').value, type,
      issuer: modal.querySelector('#li-issuer').value.trim(),
      number: modal.querySelector('#li-number').value.trim(),
      issueDate: modal.querySelector('#li-issue').value, expiryDate: expiry, status,
      category: modal.querySelector('#li-cat').value
    });
    saveLicenses(licenses);
    modal.remove();
    showToast('Sertifika eklendi!', 'success');
    renderLicenseTrackingPage(el);
  };
}
