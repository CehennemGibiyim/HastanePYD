// ===== PERFORMANS DEĞERLENDİRME SAYFASI =====

import {
  getPersonnel, getPersonnelById, getCurrentUser, isDepartmentRestricted, getUserDepartment,
  getDepartments, PERSONNEL_TYPES, getPerformanceRecords, savePerformanceRecords,
} from '../state.js';
import { showToast } from '../notifications.js';

const CRITERIA = [
  { key: 'attendance', label: 'Devam Düzeni', icon: '📅', desc: 'İşe zamanında gelme, devamsızlık' },
  { key: 'performance', label: 'İş Performansı', icon: '⚡', desc: 'Görevleri tamamlama kalitesi' },
  { key: 'teamwork', label: 'Takım Çalışması', icon: '🤝', desc: 'İşbirliği ve uyum' },
  { key: 'communication', label: 'İletişim', icon: '💬', desc: 'Hasta/çalışan iletişimi' },
  { key: 'initiative', label: 'Girişimcilik', icon: '🚀', desc: 'Öneri ve inisiyatif alma' },
];

export function renderPerformancePage(el) {
  const user = getCurrentUser();
  let personnel = getPersonnel({ status: 'active' });
  if (isDepartmentRestricted()) {
    personnel = personnel.filter(p => p.department === getUserDepartment());
  }

  const records = getPerformanceRecords();
  const now = new Date();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">⭐ Performans Değerlendirme</h1>
          <p class="text-slate-400 text-sm mt-1">Personel performans puanlama ve takip sistemi</p>
        </div>
        <div class="flex items-center gap-2">
          <select id="perf-quarter" class="input-field text-sm">
            ${[1,2,3,4].map(q => `<option value="${q}" ${q === currentQuarter ? 'selected' : ''}>${q}. Çeyrek ${currentYear}</option>`).join('')}
          </select>
          <select id="perf-dept" class="input-field text-sm">
            <option value="">Tüm Departmanlar</option>
            ${getDepartments().sort().map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>
    <div id="perf-stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in"></div>
    <div id="perf-list" class="fade-in"></div>
    <div id="perf-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"></div>`;

  renderPerfStats(personnel, records, currentQuarter, currentYear);
  renderPerfList(personnel, records, currentQuarter, currentYear);
  renderPerfTrend(personnel, records, currentYear);

  document.getElementById('perf-quarter').onchange = () => refreshPerf();
  document.getElementById('perf-dept').onchange = () => refreshPerf();

  function refreshPerf() {
    let p = getPersonnel({ status: 'active' });
    if (isDepartmentRestricted()) p = p.filter(x => x.department === getUserDepartment());
    const dept = document.getElementById('perf-dept').value;
    if (dept) p = p.filter(x => x.department === dept);
    const q = parseInt(document.getElementById('perf-quarter').value);
    renderPerfStats(p, getPerformanceRecords(), q, currentYear);
    renderPerfList(p, getPerformanceRecords(), q, currentYear);
  }
}

function getQuarterRecords(records, personnelId, quarter, year) {
  const months = [(quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2, (quarter - 1) * 3 + 3];
  return records.filter(r =>
    r.personnelId === personnelId &&
    r.year === year &&
    months.includes(r.month)
  );
}

function getAvgScore(records, personnelId, quarter, year) {
  const qr = getQuarterRecords(records, personnelId, quarter, year);
  if (!qr.length) return 0;
  const total = qr.reduce((sum, r) => sum + (r.totalScore || 0), 0);
  return Math.round((total / qr.length) * 10) / 10;
}

function renderPerfStats(personnel, records, quarter, year) {
  const container = document.getElementById('perf-stats');
  const scores = personnel.map(p => getAvgScore(records, p.id, quarter, year)).filter(s => s > 0);
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';
  const excellent = scores.filter(s => s >= 4.5).length;
  const good = scores.filter(s => s >= 3.5 && s < 4.5).length;
  const needsImprovement = scores.filter(s => s > 0 && s < 3.5).length;

  container.innerHTML = `
    <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5">
      <p class="text-sm text-cyan-300">📊 Ortalama Puan</p>
      <p class="text-3xl font-bold text-white mt-1">${avg}</p>
      <p class="text-xs text-cyan-400/60 mt-1">/ 5.0 üzerinden</p>
    </div>
    <div class="rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 p-5">
      <p class="text-sm text-green-300">🌟 Mükemmel (4.5+)</p>
      <p class="text-3xl font-bold text-white mt-1">${excellent}</p>
      <p class="text-xs text-green-400/60 mt-1">personel</p>
    </div>
    <div class="rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 p-5">
      <p class="text-sm text-blue-300">✅ İyi (3.5-4.5)</p>
      <p class="text-3xl font-bold text-white mt-1">${good}</p>
      <p class="text-xs text-blue-400/60 mt-1">personel</p>
    </div>
    <div class="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5">
      <p class="text-sm text-amber-300">⚠️ Geliştirilmeli (<3.5)</p>
      <p class="text-3xl font-bold text-white mt-1">${needsImprovement}</p>
      <p class="text-xs text-amber-400/60 mt-1">personel</p>
    </div>`;
}

function renderPerfList(personnel, records, quarter, year) {
  const container = document.getElementById('perf-list');
  const sorted = [...personnel].map(p => ({
    ...p,
    avgScore: getAvgScore(records, p.id, quarter, year),
    evalCount: getQuarterRecords(records, p.id, quarter, year).length,
  })).sort((a, b) => b.avgScore - a.avgScore);

  container.innerHTML = `
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">#</th>
            <th class="th">Personel</th>
            <th class="th">Departman</th>
            <th class="th">Tür</th>
            <th class="th text-center">Puan</th>
            <th class="th text-center">Değerlendirme</th>
            <th class="th">İşlem</th>
          </tr></thead>
          <tbody>${sorted.map((p, i) => {
            const scoreColor = p.avgScore >= 4.5 ? 'text-green-400' : p.avgScore >= 3.5 ? 'text-blue-400' : p.avgScore > 0 ? 'text-amber-400' : 'text-slate-500';
            const scoreBg = p.avgScore >= 4.5 ? 'bg-green-500/15' : p.avgScore >= 3.5 ? 'bg-blue-500/15' : p.avgScore > 0 ? 'bg-amber-500/15' : 'bg-slate-500/15';
            const stars = p.avgScore > 0 ? '★'.repeat(Math.round(p.avgScore)) + '☆'.repeat(5 - Math.round(p.avgScore)) : '—';
            return `<tr class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="td text-slate-500">${i + 1}</td>
              <td class="td font-medium text-white">${p.name} ${p.surname}</td>
              <td class="td text-xs">${p.department}</td>
              <td class="td text-xs">${PERSONNEL_TYPES[p.type]?.label || p.type}</td>
              <td class="td text-center"><span class="${scoreColor} font-bold">${p.avgScore || '—'}</span></td>
              <td class="td text-center"><span class="text-amber-400 text-xs tracking-wider">${stars}</span></td>
              <td class="td"><button data-eval="${p.id}" class="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 rounded hover:bg-cyan-500/10 transition">⭐ Değerlendir</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;

  container.querySelectorAll('[data-eval]').forEach(btn => {
    btn.onclick = () => {
      const pid = parseInt(btn.dataset.eval);
      const p = personnel.find(x => x.id === pid);
      if (p) openEvalModal(p, records, quarter, year);
    };
  });
}

function openEvalModal(person, records, quarter, year) {
  const modal = document.getElementById('perf-modal');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  modal.innerHTML = `
    <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-white">⭐ ${person.name} ${person.surname}</h3>
        <button id="eval-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">✕</button>
      </div>
      <p class="text-xs text-slate-400 mb-4">${person.department} · ${PERSONNEL_TYPES[person.type]?.label || person.type}</p>
      <div class="space-y-4 mb-4">
        ${CRITERIA.map(c => `
          <div class="rounded-xl bg-white/5 border border-white/10 p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-white">${c.icon} ${c.label}</span>
              <span id="score-${c.key}-val" class="text-sm font-bold text-cyan-400">3</span>
            </div>
            <p class="text-[10px] text-slate-500 mb-2">${c.desc}</p>
            <input type="range" id="score-${c.key}" min="1" max="5" value="3" class="w-full accent-cyan-400">
            <div class="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>1 - Kötü</span><span>2 - Yetersiz</span><span>3 - İyi</span><span>4 - Çok İyi</span><span>5 - Mükemmel</span>
            </div>
          </div>`).join('')}
      </div>
      <div class="mb-4">
        <label class="label">📝 Notlar</label>
        <textarea id="eval-notes" class="input-field w-full" rows="3" placeholder="Değerlendirme notları..."></textarea>
      </div>
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 mb-4">
        <div class="flex justify-between items-center">
          <span class="text-sm text-cyan-300">Toplam Puan</span>
          <span id="eval-total" class="text-2xl font-bold text-white">15</span>
          <span class="text-sm text-slate-400">/ 25</span>
        </div>
      </div>
      <button id="eval-save" class="btn-primary w-full">💾 Değerlendirmeyi Kaydet</button>
    </div>`;

  modal.classList.remove('hidden');

  CRITERIA.forEach(c => {
    const slider = document.getElementById(`score-${c.key}`);
    const valEl = document.getElementById(`score-${c.key}-val`);
    slider.oninput = () => {
      valEl.textContent = slider.value;
      updateTotal();
    };
  });

  function updateTotal() {
    const total = CRITERIA.reduce((sum, c) => sum + parseInt(document.getElementById(`score-${c.key}`).value), 0);
    document.getElementById('eval-total').textContent = total;
  }

  modal.onclick = (e) => { if (e.target.id === 'perf-modal') modal.classList.add('hidden'); };
  document.getElementById('eval-close').onclick = () => modal.classList.add('hidden');
  document.getElementById('eval-save').onclick = () => {
    const scores = {};
    let total = 0;
    CRITERIA.forEach(c => {
      const val = parseInt(document.getElementById(`score-${c.key}`).value);
      scores[c.key] = val;
      total += val;
    });
    const notes = document.getElementById('eval-notes').value;
    const allRecords = getPerformanceRecords();
    allRecords.push({
      id: Date.now(),
      personnelId: person.id,
      year, month: currentMonth, quarter,
      scores, totalScore: total / CRITERIA.length,
      notes,
      evaluatedBy: getCurrentUser()?.name || 'Sistem',
      date: new Date().toISOString(),
    });
    savePerformanceRecords(allRecords);
    modal.classList.add('hidden');
    showToast(`${person.name} ${person.surname} değerlendirildi: ${(total / CRITERIA.length).toFixed(1)}/5`, 'success');
  };
}

// ===== PERFORMANS TRENDİ =====
function renderPerfTrend(personnel, records, year) {
  // Find or create trend container
  let container = document.getElementById('perf-trend');
  if (!container) {
    const listEl = document.getElementById('perf-list');
    if (!listEl) return;
    container = document.createElement('div');
    container.id = 'perf-trend';
    container.className = 'mt-6 fade-in';
    listEl.after(container);
  }

  const quarters = [1, 2, 3, 4];
  const qLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const qData = quarters.map(q => {
    const scores = personnel.map(p => getAvgScore(records, p.id, q, year)).filter(s => s > 0);
    return {
      label: qLabels[q - 1],
      avg: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      count: scores.length,
    };
  });

  const maxAvg = Math.max(...qData.map(d => d.avg), 1);

  container.innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">📈 Çeyreklik Performans Trendi (${year})</h3>
      <div class="flex items-end gap-4 h-40 px-4">
        ${qData.map(d => {
          const h = maxAvg ? Math.round((d.avg / 5) * 100) : 0;
          const color = d.avg >= 4.5 ? 'from-green-500 to-green-400' : d.avg >= 3.5 ? 'from-blue-500 to-blue-400' : d.avg > 0 ? 'from-amber-500 to-amber-400' : 'from-slate-600 to-slate-500';
          return `
          <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span class="text-xs font-bold text-white">${d.avg > 0 ? d.avg.toFixed(1) : '—'}</span>
            <div class="w-full rounded-t-lg bg-gradient-to-t ${color} transition-all" style="height:${h}%"></div>
            <span class="text-xs text-slate-400">${d.label}</span>
            <span class="text-[10px] text-slate-600">${d.count} değerlendirme</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}
