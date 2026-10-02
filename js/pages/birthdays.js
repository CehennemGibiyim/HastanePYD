// ===== DOGUM GUNU & IS YILDONUMU + HATIRLATMALAR =====
import { getUpcomingBirthdays, getUpcomingAnniversaries, getActiveReminders } from '../state-extensions.js';
import { getPersonnel } from '../state.js';

export function renderBirthdaysPage(el) {
  const birthdays = getUpcomingBirthdays(60);
  const anniversaries = getUpcomingAnniversaries(60);
  const reminders = getActiveReminders();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🎂 Doğum Günleri & Hatırlatmalar</h1>
      <p class="text-slate-400 text-sm mt-1">Yaklaşan doğum günleri, iş yıldönümleri ve hatırlatmalar</p>
    </div>

    ${reminders.length > 0 ? `
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-3">🔔 Aktif Hatırlatmalar (${reminders.length})</h3>
      <div class="space-y-2">
        ${reminders.map(r => `
          <div class="flex items-center gap-3 rounded-xl ${r.severity === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/10'} p-3">
            <span class="text-2xl">${r.icon}</span>
            <span class="text-sm text-white flex-1">${r.message}</span>
            <span class="text-xs ${r.severity === 'warning' ? 'text-amber-400' : 'text-slate-400'}">${r.daysUntil === 0 ? 'Bugün' : r.daysUntil + ' gün'}</span>
          </div>
        `).join('')}
      </div>
    </div>` : ''}

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🎂 Doğum Günleri (60 gün)</h3>
        ${birthdays.length === 0 ? '<p class="text-slate-500 text-sm">Yaklaşan doğum günü yok</p>' : `
        <div class="space-y-2">
          ${birthdays.map(b => `
            <div class="flex items-center gap-3 rounded-xl ${b.isToday ? 'bg-pink-500/15 border border-pink-500/30' : 'bg-white/5 border border-white/10'} p-3">
              <div class="w-10 h-10 rounded-lg ${b.isToday ? 'bg-pink-500/20' : 'bg-white/10'} flex items-center justify-center text-lg">${b.isToday ? '🎉' : '🎂'}</div>
              <div class="flex-1">
                <p class="text-sm font-medium text-white">${b.name} ${b.surname}</p>
                <p class="text-xs text-slate-400">${b.department} · ${formatDate(b.birthDate)}</p>
              </div>
              <span class="text-xs font-bold ${b.isToday ? 'text-pink-400' : 'text-slate-400'}">${b.isToday ? 'BUGÜN!' : b.daysUntil + ' gün'}</span>
            </div>
          `).join('')}
        </div>`}
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🏢 İş Yıldönümleri (60 gün)</h3>
        ${anniversaries.length === 0 ? '<p class="text-slate-500 text-sm">Yaklaşan yıldönümü yok</p>' : `
        <div class="space-y-2">
          ${anniversaries.map(a => `
            <div class="flex items-center gap-3 rounded-xl ${a.isToday ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-white/5 border border-white/10'} p-3">
              <div class="w-10 h-10 rounded-lg ${a.isToday ? 'bg-emerald-500/20' : 'bg-white/10'} flex items-center justify-center text-lg">${a.isToday ? '🎊' : '🏢'}</div>
              <div class="flex-1">
                <p class="text-sm font-medium text-white">${a.name} ${a.surname}</p>
                <p class="text-xs text-slate-400">${a.department} · ${a.years}. yıl · ${formatDate(a.startDate)}</p>
              </div>
              <span class="text-xs font-bold ${a.isToday ? 'text-emerald-400' : 'text-slate-400'}">${a.isToday ? 'BUGÜN!' : a.daysUntil + ' gün'}</span>
            </div>
          `).join('')}
        </div>`}
      </div>
    </div>`;
}

function formatDate(d) {
  if (!d) return '';
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const dt = new Date(d);
  return dt.getDate() + ' ' + months[dt.getMonth()] + ' ' + dt.getFullYear();
}
