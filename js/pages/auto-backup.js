// ===== OTOMATİK YEDEKLEME =====
import { exportAllDataFull, importAllData } from '../state.js';
import { showToast } from '../notifications.js';

const MAX_BACKUPS = 10;

export function renderAutoBackupPage(container) {
  const backups = getBackupList();
  const lastAuto = localStorage.getItem('hospital_last_autobackup');
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">🔐 Otomatik Yedekleme & Geri Yükleme</h1>
          <p class="text-slate-400 text-sm mt-1">Verilerinizi otomatik olarak yedekleyin</p>
        </div>
        <div class="flex gap-2">
          <button id="ab-manual-btn" class="btn-primary">💾 Manuel Yedek Al</button>
          <button id="ab-restore-btn" class="btn-secondary">📂 Geri Yükle</button>
        </div>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('📦', 'Toplam Yedek', backups.length, 'cyan')}
        ${statCard('📅', 'Son Yedek', lastAuto ? new Date(lastAuto).toLocaleDateString('tr-TR') : 'Yok', 'green')}
        ${statCard('💾', 'Veri Boyutu', calcDataSize(), 'purple')}
        ${statCard('🔄', 'Otomatik', 'Her girişte', 'amber')}
      </div>
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">⚙️ Yedekleme Ayarları</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
            <div><p class="text-sm text-white">Otomatik Yedekleme</p><p class="text-xs text-slate-400">Her giriş yapışta otomatik yedek al</p></div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="ab-auto-toggle" class="sr-only peer" ${isAutoEnabled() ? 'checked' : ''}>
              <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-cyan-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
            <div><p class="text-sm text-white">Maksimum Yedek</p><p class="text-xs text-slate-400">Eski yedekler otomatik silinir</p></div>
            <span class="badge">${MAX_BACKUPS}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📋 Yedek Geçmişi</h3>
        ${backups.length === 0 ? '<p class="text-slate-500 text-center py-8">Henüz yedek yok</p>' : `
        <div class="overflow-x-auto"><table class="w-full"><thead><tr>
          <th class="th">#</th><th class="th">Tarih</th><th class="th">Personel</th><th class="th">Nöbet</th><th class="th">Puantaj</th><th class="th">Boyut</th><th class="th">İşlem</th>
        </tr></thead><tbody>
          ${backups.map((b, i) => `<tr class="border-t border-white/5 hover:bg-white/[0.02]">
            <td class="td text-xs">${i+1}</td>
            <td class="td text-xs">${new Date(b.date).toLocaleString('tr-TR')}</td>
            <td class="td">${b.counts?.personnel || '-'}</td>
            <td class="td">${b.counts?.schedules || '-'}</td>
            <td class="td">${b.counts?.attendance || '-'}</td>
            <td class="td text-xs">${b.size || '-'}</td>
            <td class="td"><div class="flex gap-1">
              <button class="ab-restore-btn btn-secondary text-xs px-2 py-1" data-idx="${i}">🔄 Geri Yükle</button>
              <button class="ab-download-btn btn-secondary text-xs px-2 py-1" data-idx="${i}">📥 İndir</button>
              <button class="ab-del-btn btn-secondary text-xs px-2 py-1 text-red-400" data-idx="${i}">🗑️</button>
            </div></td>
          </tr>`).join('')}
        </tbody></table></div>`}
      </div>
    </div>`;

  document.getElementById('ab-manual-btn').onclick = () => { createBackup(); renderAutoBackupPage(container); };
  document.getElementById('ab-restore-btn').onclick = () => triggerFileRestore(container);
  document.getElementById('ab-auto-toggle').onchange = (e) => {
    localStorage.setItem('hospital_autobackup_enabled', e.target.checked ? '1' : '0');
    showToast(e.target.checked ? 'Otomatik yedekleme açıldı' : 'Otomatik yedekleme kapatıldı', 'success');
  };
  document.querySelectorAll('.ab-restore-btn').forEach(b => { b.onclick = () => { restoreBackup(parseInt(b.dataset.idx), container); }; });
  document.querySelectorAll('.ab-download-btn').forEach(b => { b.onclick = () => { downloadBackup(parseInt(b.dataset.idx)); }; });
  document.querySelectorAll('.ab-del-btn').forEach(b => { b.onclick = () => { deleteBackup(parseInt(b.dataset.idx)); renderAutoBackupPage(container); }; });
}

export function autoBackupOnLogin() {
  if (localStorage.getItem('hospital_autobackup_enabled') === '0') return;
  createBackup();
  localStorage.setItem('hospital_last_autobackup', new Date().toISOString());
}

function createBackup() {
  const data = exportAllDataFull();
  const json = JSON.stringify(data);
  const size = new Blob([json]).size;
  const backup = { date: new Date().toISOString(), data, counts: { personnel: data.personnel?.length, schedules: data.schedules?.length, attendance: data.attendance?.length }, size: formatSize(size) };
  const backups = getBackupList();
  backups.push(backup);
  while (backups.length > MAX_BACKUPS) backups.shift();
  localStorage.setItem('hospital_backups', JSON.stringify(backups));
  showToast('Yedek oluşturuldu (' + formatSize(size) + ')', 'success');
}

function restoreBackup(idx, container) {
  const backups = getBackupList();
  const b = backups[idx];
  if (!b) return;
  if (!confirm('Bu yedeği geri yüklemek mevcut verilerin üzerine yazacaktır. Devam etmek istiyor musunuz?')) return;
  const result = importAllData(b.data);
  if (result.ok) {
    showToast('Yedek geri yüklendi! Sayfa yenileniyor...', 'success');
    setTimeout(() => location.reload(), 1500);
  } else {
    showToast('Hata: ' + result.error, 'error');
  }
}

function downloadBackup(idx) {
  const backups = getBackupList();
  const b = backups[idx];
  if (!b) return;
  const blob = new Blob([JSON.stringify(b.data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `hastane-yedek-${b.date.split('T')[0]}.json`;
  a.click();
  showToast('Yedek indiriliyor...', 'success');
}

function deleteBackup(idx) {
  const backups = getBackupList();
  backups.splice(idx, 1);
  localStorage.setItem('hospital_backups', JSON.stringify(backups));
  showToast('Yedek silindi', 'success');
}

function triggerFileRestore(container) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = importAllData(data);
      if (result.ok) {
        showToast('Geri yükleme başarılı! Sayfa yenileniyor...', 'success');
        setTimeout(() => location.reload(), 1500);
      } else { showToast('Hata: ' + result.error, 'error'); }
    } catch { showToast('Geçersiz dosya', 'error'); }
  };
  input.click();
}

function getBackupList() { try { return JSON.parse(localStorage.getItem('hospital_backups') || '[]'); } catch { return []; } }
function isAutoEnabled() { return localStorage.getItem('hospital_autobackup_enabled') !== '0'; }
function formatSize(bytes) { if (bytes < 1024) return bytes + ' B'; if (bytes < 1048576) return (bytes/1024).toFixed(1) + ' KB'; return (bytes/1048576).toFixed(1) + ' MB'; }
function calcDataSize() { try { return formatSize(new Blob([JSON.stringify(exportAllDataFull())]).size); } catch { return '-'; } }
function statCard(icon, label, value, color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5"><p class="text-sm text-${color}-300">${icon} ${label}</p><p class="text-xl font-bold text-white mt-1">${value}</p></div>`;
}
