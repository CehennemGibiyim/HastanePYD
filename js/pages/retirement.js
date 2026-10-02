// ===== EMEKLILIK SAYACI =====
import { getRetirementList } from '../state-extensions.js';
import { PERSONNEL_TYPES } from '../state.js';

export function renderRetirementPage(el) {
  const list = getRetirementList();
  const eligible = list.filter(p => p.retirement.eligible);
  const soon = list.filter(p => !p.retirement.eligible && p.retirement.yearsRemaining <= 5);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">⏰ Emeklilik Sayacı</h1>
      <p class="text-slate-400 text-sm mt-1">${list.length} personel · ${eligible.length} emekli olabilir · ${soon.length} 5 yıl içinde</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-emerald-300">${eligible.length}</p>
        <p class="text-xs text-emerald-400">Emekli Olabilir</p>
      </div>
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-amber-300">${soon.length}</p>
        <p class="text-xs text-amber-400">5 Yıl İçinde</p>
      </div>
      <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-blue-300">${list.filter(p => p.retirement.isWorker).length}</p>
        <p class="text-xs text-blue-400">İşçi (50 yaş/25 yıl)</p>
      </div>
      <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-purple-300">${list.filter(p => !p.retirement.isWorker).length}</p>
        <p class="text-xs text-purple-400">Memur (60 yaş/25 yıl)</p>
      </div>
    </div>
    <div class="card overflow-hidden fade-in">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">#</th>
            <th class="th">Personel</th>
            <th class="th">Departman</th>
            <th class="th">Tür</th>
            <th class="th">Yaş</th>
            <th class="th">Hizmet Yılı</th>
            <th class="th">Emeklilik Yaşı</th>
            <th class="th">Kalan Yıl</th>
            <th class="th">Durum</th>
          </tr></thead>
          <tbody>
            ${list.map((p, i) => {
              const r = p.retirement;
              const statusHtml = r.eligible
                ? '<span class="badge bg-emerald-500/15 text-emerald-300">✅ Emekli Olabilir</span>'
                : r.yearsRemaining <= 5
                  ? '<span class="badge bg-amber-500/15 text-amber-300">⏰ ' + r.yearsRemaining + ' yıl</span>'
                  : '<span class="badge">' + r.yearsRemaining + ' yıl</span>';
              const progressPct = Math.min(100, Math.round(((r.age + r.serviceYears) / (r.retirementAge + r.retirementService)) * 100));
              return `<tr class="border-b border-white/5 hover:bg-white/5 ${r.eligible ? 'bg-emerald-500/5' : ''}">
                <td class="td text-slate-600 text-xs">${i + 1}</td>
                <td class="td font-medium text-white">${p.name} ${p.surname}</td>
                <td class="td">${p.department}</td>
                <td class="td"><span class="badge">${PERSONNEL_TYPES[p.type]?.label || p.type}</span></td>
                <td class="td">${r.age}</td>
                <td class="td">${r.serviceYears} yıl</td>
                <td class="td">${r.retirementAge} yaş / ${r.retirementService} yıl</td>
                <td class="td">
                  <div class="flex items-center gap-2">
                    <div class="w-20 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div class="h-full rounded-full ${r.eligible ? 'bg-emerald-500' : 'bg-cyan-500'}" style="width:${progressPct}%"></div>
                    </div>
                    <span class="text-xs font-bold ${r.yearsRemaining <= 0 ? 'text-emerald-400' : r.yearsRemaining <= 5 ? 'text-amber-400' : 'text-slate-400'}">${r.yearsRemaining <= 0 ? '0' : r.yearsRemaining}</span>
                  </div>
                </td>
                <td class="td">${statusHtml}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}
