// ===== ANLIK RUH HALI (MOOD PULSE) =====
import { getMoodEntries, addMoodEntry, getMoodStats } from '../state-extensions.js';
import { getPersonnel, getPersonnelById, getDepartments } from '../state.js';
import { showToast } from '../notifications.js';

const MOODS = [
  { score: 1, emoji: '😞', label: 'Çok Kötü', color: 'text-red-400' },
  { score: 2, emoji: '😕', label: 'Kötü', color: 'text-orange-400' },
  { score: 3, emoji: '😐', label: 'Normal', color: 'text-yellow-400' },
  { score: 4, emoji: '🙂', label: 'İyi', color: 'text-emerald-400' },
  { score: 5, emoji: '😊', label: 'Harika', color: 'text-cyan-400' },
];

export function renderMoodPage(el) {
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = getMoodEntries({ date: today });
  const stats = getMoodStats();
  const depts = getDepartments();

  const avgToday = todayEntries.length ? (todayEntries.reduce((s, m) => s + m.score, 0) / todayEntries.length) : 0;
  const avgEmoji = MOODS[Math.round(avgToday) - 1]?.emoji || '—';

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">😊 Anlık Ruh Hali</h1>
      <p class="text-slate-400 text-sm mt-1">Günlük personel memnuniyet ölçümü</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
        <p class="text-4xl">${avgEmoji}</p>
        <p class="text-2xl font-bold text-cyan-300 mt-1">${avgToday.toFixed(1)}/5</p>
        <p class="text-xs text-cyan-400">Bugünkü Ortalama</p>
      </div>
      <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-purple-300">${todayEntries.length}</p>
        <p class="text-xs text-purple-400">Bugünkü Katılım</p>
      </div>
      <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-emerald-300">${todayEntries.filter(m => m.score >= 4).length}</p>
        <p class="text-xs text-emerald-400">Pozitif</p>
      </div>
      <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-red-300">${todayEntries.filter(m => m.score <= 2).length}</p>
        <p class="text-xs text-red-400">Negatif</p>
      </div>
    </div>

    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Son 7 Gün Trend</h3>
      <div class="grid grid-cols-7 gap-2">
        ${stats.map(s => {
          const pct = s.avg ? (s.avg / 5) * 100 : 0;
          const mood = MOODS[Math.round(s.avg) - 1];
          return `<div class="text-center">
            <div class="h-32 flex items-end justify-center mb-1">
              <div class="w-10 rounded-t-lg transition-all" style="height:${pct}%;background:linear-gradient(to top,rgba(34,211,238,0.3),rgba(34,211,238,0.8))"></div>
            </div>
            <p class="text-lg">${mood?.emoji || '—'}</p>
            <p class="text-xs font-bold text-white">${s.avg || '—'}</p>
            <p class="text-[10px] text-slate-500">${s.date.slice(5)}</p>
            <p class="text-[10px] text-slate-600">${s.count} kişi</p>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📝 Ruh Hali Gir</h3>
      <p class="text-sm text-slate-400 mb-3">Bugünkü ruh halinizi seçin:</p>
      <div class="flex flex-wrap gap-3">
        ${MOODS.map(m => `
          <button data-mood-score="${m.score}" class="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 hover:bg-white/10 hover:border-cyan-500/30 transition-all">
            <span class="text-3xl">${m.emoji}</span>
            <span class="text-xs ${m.color}">${m.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="mt-3">
        <select id="mood-person" class="input-field w-full">
          <option value="">Personel seçin...</option>
          ${getPersonnel({ status: 'active' }).map(p => `<option value="${p.id}">${p.name} ${p.surname} - ${p.department}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Bazlı Son 7 Gün</h3>
      <select id="mood-dept-filter" class="input-field w-48 mb-4">
        <option value="">Tüm Departmanlar</option>
        ${depts.map(d => '<option>' + d + '</option>').join('')}
      </select>
      <div id="mood-dept-stats"></div>
    </div>`;

  document.querySelectorAll('[data-mood-score]').forEach(btn => {
    btn.onclick = () => {
      const pid = parseInt(document.getElementById('mood-person').value);
      if (!pid) return showToast('Lütfen personel seçin', 'error');
      const person = getPersonnelById(pid);
      const score = parseInt(btn.dataset.moodScore);
      addMoodEntry({ personnelId: pid, department: person.department, date: today, score, emoji: MOODS[score - 1].emoji, note: '' });
      showToast(MOODS[score - 1].emoji + ' Ruh hali kaydedildi!', 'success');
    };
  });

  function renderDeptStats() {
    const dept = document.getElementById('mood-dept-filter').value;
    const deptStats = getMoodStats(dept);
    document.getElementById('mood-dept-stats').innerHTML = deptStats.map(s => {
      const mood = MOODS[Math.round(s.avg) - 1];
      return `<div class="flex items-center gap-3 py-2 border-b border-white/5">
        <span class="text-sm text-slate-400 w-20">${s.date.slice(5)}</span>
        <div class="flex-1 h-4 rounded-full bg-white/5 overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style="width:${s.avg ? (s.avg/5)*100 : 0}%"></div>
        </div>
        <span class="text-lg">${mood?.emoji || '—'}</span>
        <span class="text-sm font-bold text-white w-12 text-right">${s.avg || '—'}</span>
        <span class="text-xs text-slate-500 w-12 text-right">${s.count} kişi</span>
      </div>`;
    }).join('');
  }

  renderDeptStats();
  document.getElementById('mood-dept-filter').onchange = renderDeptStats;
}
