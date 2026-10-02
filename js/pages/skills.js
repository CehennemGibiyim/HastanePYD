// ===== YETENEK MATRISI (SKILLS MATRIX) =====
import { getSkillsMatrix } from '../state-extensions.js';
import { getDepartments, PERSONNEL_TYPES } from '../state.js';

export function renderSkillsPage(el) {
  const depts = getDepartments();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📈 Yetenek Matrisi</h1>
      <p class="text-slate-400 text-sm mt-1">Departman × Yetenek haritası</p>
    </div>
    <div class="flex flex-wrap gap-3 mb-6 fade-in">
      <select id="skills-dept" class="input-field w-48">
        <option value="">Tüm Departmanlar</option>
        ${depts.map(d => '<option>' + d + '</option>').join('')}
      </select>
    </div>
    <div id="skills-content" class="fade-in"></div>`;

  function render() {
    const dept = document.getElementById('skills-dept').value;
    const matrix = getSkillsMatrix(dept || null);
    const container = document.getElementById('skills-content');

    if (!matrix.personnel.length) {
      container.innerHTML = '<div class="empty-state"><div class="icon">📈</div><div class="title">Personel bulunamadı</div></div>';
      return;
    }

    // Top skills by frequency
    const skillCounts = matrix.skills.map(s => ({ name: s, count: matrix.counts[s] || 0 })).sort((a, b) => b.count - a.count);
    const topSkills = skillCounts.slice(0, 20);

    container.innerHTML = `
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">🏆 En Yaygın Yetenekler</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          ${topSkills.map(s => {
            const pct = Math.round((s.count / matrix.personnel.length) * 100);
            return `<div class="rounded-xl bg-white/5 border border-white/10 p-3">
              <p class="text-xs font-medium text-white truncate mb-1">${s.name}</p>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style="width:${pct}%"></div>
                </div>
                <span class="text-xs text-cyan-300 font-bold">${s.count}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card overflow-hidden">
        <h3 class="text-lg font-semibold text-white mb-4">👥 Kişi × Yetenek Tablosu</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead><tr class="border-b border-white/10 bg-white/5">
              <th class="th sticky left-0 bg-slate-900 z-10">Personel</th>
              <th class="th">Departman</th>
              <th class="th">Tür</th>
              <th class="th">Yetenekler</th>
            </tr></thead>
            <tbody>
              ${matrix.personnel.map(p => `
                <tr class="border-b border-white/5 hover:bg-white/5">
                  <td class="td font-medium text-white sticky left-0 bg-slate-900/95 z-10">${p.name}</td>
                  <td class="td text-xs">${p.department}</td>
                  <td class="td"><span class="badge text-[10px]">${PERSONNEL_TYPES[p.type]?.label || p.type}</span></td>
                  <td class="td">
                    <div class="flex flex-wrap gap-1">
                      ${p.skills.map(s => `<span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px]">${s}</span>`).join('')}
                      ${p.skills.length === 0 ? '<span class="text-slate-600 text-xs">—</span>' : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  render();
  document.getElementById('skills-dept').onchange = render;
}
