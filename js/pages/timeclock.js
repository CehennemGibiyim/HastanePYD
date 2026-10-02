// ===== MESAI SAAT TAKIBI (TIME CLOCK) =====
import { getTimeClockEntries, clockIn, clockOut, getTodayTimeClock } from '../state-extensions.js';
import { getPersonnel, getPersonnelById, getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';

export function renderTimeClockPage(el) {
  const user = getCurrentUser();
  const now = new Date();
  const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const today = now.toISOString().split('T')[0];

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">⏰ Mesai Saat Takibi</h1>
      <p class="text-slate-400 text-sm mt-1">Giriş/çıkış saat kaydı ve takibi</p>
    </div>
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🕐 Hızlı Giriş/Çıkış</h3>
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="label">Personel Seç</label>
          <select id="tc-person" class="input-field w-full">
            <option value="">Personel seçiniz</option>
            ${getPersonnel({ status: 'active' }).map(p => '<option value="' + p.id + '">' + p.name + ' ' + p.surname + ' - ' + p.department + '</option>').join('')}
          </select>
        </div>
        <button id="tc-clockin" class="btn-primary">🟢 Giriş Yap</button>
        <button id="tc-clockout" class="btn-secondary">🔴 Çıkış Yap</button>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in" id="tc-stats"></div>
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Bugünkü Giriş/Çıkışlar</h3>
      <div id="tc-today" class="fade-in"></div>
    </div>
    <div class="card fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">📊 Aylık Özet</h3>
        <input id="tc-month" type="month" class="input-field text-sm" value="${monthStr}">
      </div>
      <div id="tc-monthly" class="fade-in"></div>
    </div>`;

  function render() {
    // Today's entries
    const todayEntries = getTodayTimeClock();
    const activeNow = todayEntries.filter(t => !t.clockOut).length;
    const completedToday = todayEntries.filter(t => t.clockOut).length;
    const avgHours = todayEntries.filter(t => t.hours).length ? (todayEntries.filter(t => t.hours).reduce((s, t) => s + t.hours, 0) / todayEntries.filter(t => t.hours).length).toFixed(1) : '0';

    document.getElementById('tc-stats').innerHTML = `
      <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${todayEntries.length}</p><p class="text-xs text-slate-400">Bugün Giriş</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-green-300">${activeNow}</p><p class="text-xs text-slate-400">Aktif (İçeride)</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-blue-300">${completedToday}</p><p class="text-xs text-slate-400">Çıkış Yapan</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-amber-300">${avgHours}s</p><p class="text-xs text-slate-400">Ort. Çalışma</p></div>`;

    // Today list
    const todayContainer = document.getElementById('tc-today');
    if (!todayEntries.length) { todayContainer.innerHTML = '<p class="text-slate-500 text-center py-4 text-sm">Bugün giriş kaydı yok</p>'; }
    else {
      todayContainer.innerHTML = `<div class="overflow-x-auto"><table class="w-full text-sm">
        <thead><tr class="border-b border-white/10 bg-white/5"><th class="th">Personel</th><th class="th">Giriş</th><th class="th">Çıkış</th><th class="th">Süre</th><th class="th">Durum</th></tr></thead>
        <tbody>${todayEntries.sort((a, b) => (a.clockIn || '').localeCompare(b.clockIn || '')).map(t => {
          const p = getPersonnelById(t.personnelId);
          const inTime = t.clockIn ? new Date(t.clockIn).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';
          const outTime = t.clockOut ? new Date(t.clockOut).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-';
          const isActive = !t.clockOut;
          return `<tr class="border-b border-white/5 hover:bg-white/5">
            <td class="td font-medium text-white">${p ? p.name + ' ' + p.surname : 'Bilinmiyor'}</td>
            <td class="td">${inTime}</td>
            <td class="td">${outTime}</td>
            <td class="td">${t.hours ? t.hours + 's' : '-'}</td>
            <td class="td"><span class="badge text-[10px] ${isActive ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-400'}">${isActive ? '🟢 İçeride' : '⚪ Çıkmış'}</span></td>
          </tr>`;
        }).join('')}</tbody></table></div>`;
    }

    // Monthly
    const monthVal = document.getElementById('tc-month').value;
    const monthEntries = getTimeClockEntries({ month: monthVal });
    const monthlyContainer = document.getElementById('tc-monthly');
    if (!monthEntries.length) { monthlyContainer.innerHTML = '<p class="text-slate-500 text-center py-4 text-sm">Bu ay kayıt yok</p>'; }
    else {
      const byPerson = {};
      monthEntries.forEach(t => {
        if (!byPerson[t.personnelId]) byPerson[t.personnelId] = { total: 0, days: 0 };
        if (t.hours) { byPerson[t.personnelId].total += t.hours; byPerson[t.personnelId].days++; }
      });
      monthlyContainer.innerHTML = `<div class="overflow-x-auto"><table class="w-full text-sm">
        <thead><tr class="border-b border-white/10 bg-white/5"><th class="th">Personel</th><th class="th">Gün</th><th class="th">Toplam Saat</th><th class="th">Ortalama</th></tr></thead>
        <tbody>${Object.entries(byPerson).sort((a, b) => b[1].total - a[1].total).map(([pid, d]) => {
          const p = getPersonnelById(parseInt(pid));
          return `<tr class="border-b border-white/5"><td class="td font-medium text-white">${p ? p.name + ' ' + p.surname : pid}</td><td class="td">${d.days}</td><td class="td">${d.total.toFixed(1)}s</td><td class="td">${d.days ? (d.total / d.days).toFixed(1) + 's' : '-'}</td></tr>`;
        }).join('')}</tbody></table></div>`;
    }
  }

  document.getElementById('tc-clockin').onclick = () => {
    const pid = parseInt(document.getElementById('tc-person').value);
    if (!pid) { showToast('Personel seçiniz', 'error'); return; }
    clockIn(pid);
    const p = getPersonnelById(pid);
    showToast((p ? p.name : '') + ' giriş yaptı', 'success');
    render();
  };
  document.getElementById('tc-clockout').onclick = () => {
    const pid = parseInt(document.getElementById('tc-person').value);
    if (!pid) { showToast('Personel seçiniz', 'error'); return; }
    const result = clockOut(pid);
    if (result) { showToast('Çıkış yapıldı (' + result.hours + 's)', 'success'); }
    else { showToast('Aktif giriş kaydı bulunamadı', 'error'); }
    render();
  };
  document.getElementById('tc-month').onchange = render;
  render();
}
