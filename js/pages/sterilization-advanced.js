// ===== STERİLİZASYON TAKİP (GELİŞMİŞ) =====
const STORAGE_KEY = 'sterilization_advanced';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, setName: 'Laparoskopi Seti', code: 'STER-001', lastSterilized: '2026-07-12 06:30', method: 'Otoklav (134°C)', duration: 18, cycles: 245, maxCycles: 500, status: 'ready', location: 'Ameliyathane-1', boweDick: 'pass', biologicIndicator: 'pass', chemicalIndicator: 'pass', expiryDate: '2026-07-19', operator: 'Teknisyen Mehmet' },
    { id: 2, setName: 'Genel Cerrahi Seti', code: 'STER-002', lastSterilized: '2026-07-12 07:00', method: 'Otoklav (134°C)', duration: 18, cycles: 180, maxCycles: 500, status: 'ready', location: 'Ameliyathane-2', boweDick: 'pass', biologicIndicator: 'pass', chemicalIndicator: 'pass', expiryDate: '2026-07-19', operator: 'Teknisyen Ali' },
    { id: 3, setName: 'Ortopedi Seti', code: 'STER-003', lastSterilized: '2026-07-11 14:00', method: 'Otoklav (121°C)', duration: 30, cycles: 320, maxCycles: 500, status: 'in-use', location: 'Ameliyathane-3', boweDick: 'pass', biologicIndicator: 'pass', chemicalIndicator: 'pass', expiryDate: '2026-07-18', operator: 'Teknisyen Mehmet' },
    { id: 4, setName: 'Acil Seti', code: 'STER-004', lastSterilized: '2026-07-10 09:00', method: 'ETO Gaz', duration: 360, cycles: 50, maxCycles: 200, status: 'expired', location: 'Steril Deposu', boweDick: 'pass', biologicIndicator: 'fail', chemicalIndicator: 'pass', expiryDate: '2026-07-11', operator: 'Teknisyen Ali' },
    { id: 5, setName: 'KBB Seti', code: 'STER-005', lastSterilized: '2026-07-12 08:00', method: 'Otoklav (134°C)', duration: 18, cycles: 90, maxCycles: 500, status: 'sterilizing', location: 'Sterilizasyon Ünitesi', boweDick: 'pending', biologicIndicator: 'pending', chemicalIndicator: 'pending', expiryDate: '', operator: 'Teknisyen Mehmet' },
  ];
  saveData(d); return d;
}
const STATUSES = { ready: { label: 'Hazır', color: 'green', icon: '✅' }, 'in-use': { label: 'Kullanımda', color: 'blue', icon: '🔵' }, sterilizing: { label: 'Sterilize Ediliyor', color: 'amber', icon: '🔄' }, expired: { label: 'Süresi Dolmuş', color: 'red', icon: '❌' }, maintenance: { label: 'Bakımda', color: 'purple', icon: '🔧' } };

export function renderSterilizationAdvancedPage(el) {
  let data = getData();
  function render() {
    const ready = data.filter(d => d.status === 'ready').length;
    const inUse = data.filter(d => d.status === 'in-use').length;
    const expired = data.filter(d => d.status === 'expired').length;
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">🧫 Sterilizasyon Takip</h1><p class="text-slate-400 text-sm mt-1">Set bazlı sterilizasyon döngüsü, Bowie-Dick ve biyolojik indikatör</p></div>
        <button id="add-ster-btn" class="btn-primary">+ Yeni Set</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold text-green-300">${ready}</p><p class="text-xs text-slate-400">✅ Hazır</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${inUse}</p><p class="text-xs text-slate-400">🔵 Kullanımda</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${data.filter(d => d.status === 'sterilizing').length}</p><p class="text-xs text-slate-400">🔄 Sterilizasyonda</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-red-300">${expired}</p><p class="text-xs text-slate-400">❌ Süresi Dolmuş</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${data.length}</p><p class="text-xs text-slate-400">📦 Toplam Set</p></div>
      </div>
      <div class="card overflow-x-auto"><table class="w-full min-w-[900px]"><thead><tr>
        <th class="th">Set</th><th class="th">Kod</th><th class="th">Durum</th><th class="th">Yöntem</th><th class="th">Son Sterilizasyon</th>
        <th class="th">Bowie-Dick</th><th class="th">Biyolojik</th><th class="th">Kimyasal</th><th class="th">Döngü</th><th class="th">SKT</th>
      </tr></thead><tbody>
        ${data.map(d => {
          const st = STATUSES[d.status];
          const cyclePct = Math.round((d.cycles / d.maxCycles) * 100);
          const indColor = v => v === 'pass' ? 'text-green-400' : v === 'fail' ? 'text-red-400' : 'text-amber-400';
          return `<tr class="border-t border-white/5 hover:bg-white/5">
            <td class="td font-medium text-white">${d.setName}</td><td class="td font-mono text-xs">${d.code}</td>
            <td class="td"><span class="badge bg-${st.color}-500/20 text-${st.color}-300">${st.icon} ${st.label}</span></td>
            <td class="td text-sm">${d.method}</td><td class="td text-xs">${d.lastSterilized}</td>
            <td class="td ${indColor(d.boweDick)}">${d.boweDick === 'pass' ? '✅' : d.boweDick === 'fail' ? '❌' : '⏳'} ${d.boweDick}</td>
            <td class="td ${indColor(d.biologicIndicator)}">${d.biologicIndicator === 'pass' ? '✅' : d.biologicIndicator === 'fail' ? '❌' : '⏳'} ${d.biologicIndicator}</td>
            <td class="td ${indColor(d.chemicalIndicator)}">${d.chemicalIndicator === 'pass' ? '✅' : d.chemicalIndicator === 'fail' ? '❌' : '⏳'} ${d.chemicalIndicator}</td>
            <td class="td"><div class="flex items-center gap-1"><div class="w-16 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full ${cyclePct > 80 ? 'bg-red-400' : cyclePct > 60 ? 'bg-amber-400' : 'bg-green-400'}" style="width:${cyclePct}%"></div></div><span class="text-xs">${d.cycles}/${d.maxCycles}</span></div></td>
            <td class="td text-xs ${new Date(d.expiryDate) < new Date() ? 'text-red-400 font-bold' : 'text-slate-300'}">${d.expiryDate || '—'}</td>
          </tr>`;
        }).join('')}
      </tbody></table></div>
      <div class="card mt-4"><h3 class="text-sm font-semibold text-white mb-3">📋 Göstergeler Açıklaması</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div class="rounded-lg bg-white/5 p-3"><p class="font-bold text-blue-300">Bowie-Dick Testi</p><p class="text-slate-400">Hava kaçağı testi, her gün ilk döngü öncesi</p></div>
          <div class="rounded-lg bg-white/5 p-3"><p class="font-bold text-purple-300">Biyolojik İndikatör</p><p class="text-slate-400">Bakteri sporları ile sterilizasyon doğrulama</p></div>
          <div class="rounded-lg bg-white/5 p-3"><p class="font-bold text-green-300">Kimyasal İndikatör</p><p class="text-slate-400">Renk değişim ile sıcaklık/süre doğrulama</p></div>
        </div>
      </div>
    </div>`;
    document.getElementById('add-ster-btn')?.addEventListener('click', () => openSterilizationForm(el, data));
  }
  render();
}

function openSterilizationForm(el, data) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fixed inset-0 z-50 m-auto w-[min(92vw,500px)] rounded-2xl border border-white/10 bg-slate-900 p-0 text-slate-100 shadow-2xl';
  dialog.innerHTML = `<form method="dialog" class="p-6"><h2 class="text-lg font-bold text-white">Yeni Sterilizasyon Seti</h2><div class="space-y-3 mt-4"><label class="label">Set adı<input id="st-name" class="input-field w-full" required></label><div class="grid grid-cols-2 gap-3"><label class="label">Kod<input id="st-code" class="input-field w-full" placeholder="STER-006" required></label><label class="label">Lokasyon<input id="st-location" class="input-field w-full" required></label></div><label class="label">Yöntem<select id="st-method" class="input-field w-full"><option>Otoklav (134°C)</option><option>Otoklav (121°C)</option><option>ETO Gaz</option></select></label><label class="label">Maksimum döngü<input id="st-max" type="number" min="1" value="500" class="input-field w-full" required></label></div><div class="flex gap-2 mt-5"><button value="cancel" class="btn-secondary flex-1">İptal</button><button id="st-save" class="btn-primary flex-1">Kaydet</button></div></form>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('#st-save').addEventListener('click', event => {
    const name = dialog.querySelector('#st-name').value.trim(); if (!name) return;
    data.unshift({ id: Date.now(), setName: name, code: dialog.querySelector('#st-code').value.trim(), lastSterilized: '—', method: dialog.querySelector('#st-method').value, duration: 0, cycles: 0, maxCycles: Number(dialog.querySelector('#st-max').value || 500), status: 'maintenance', location: dialog.querySelector('#st-location').value.trim(), boweDick: 'pending', biologicIndicator: 'pending', chemicalIndicator: 'pending', expiryDate: '', operator: 'Atanmadı' });
    saveData(data); event.preventDefault(); dialog.close(); dialog.remove(); renderSterilizationAdvancedPage(el);
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
}
