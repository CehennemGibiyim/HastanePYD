// ===== WELLNESS SKOR SİSTEMİ =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_wellness_scores';

function getScores() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultScores(); } catch { return getDefaultScores(); }
}
function saveScores(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultScores() {
  return [
    { id: 1, personName: 'Dr. Ayşe Yılmaz', department: 'Dahiliye', mood: 8, stress: 3, sleep: 7, exercise: 6, water: 8, overall: 64, trend: 'up', lastEntry: '2025-07-11' },
    { id: 2, personName: 'Mehmet Kaya', department: 'Cerrahi', mood: 5, stress: 7, sleep: 4, exercise: 3, water: 5, overall: 48, trend: 'down', lastEntry: '2025-07-11' },
    { id: 3, personName: 'Fatma Çelik', department: 'Hemşirelik', mood: 7, stress: 5, sleep: 6, exercise: 7, water: 7, overall: 64, trend: 'stable', lastEntry: '2025-07-10' },
    { id: 4, personName: 'Ali Yıldız', department: 'Güvenlik', mood: 6, stress: 4, sleep: 8, exercise: 8, water: 6, overall: 64, trend: 'up', lastEntry: '2025-07-11' },
  ];
}

const metricLabels = {
  mood: { label: '😊 Ruh Hali', color: 'text-yellow-400', max: 10 },
  stress: { label: '😰 Stres', color: 'text-red-400', max: 10, inverted: true },
  sleep: { label: '😴 Uyku', color: 'text-indigo-400', max: 10 },
  exercise: { label: '🏃 Egzersiz', color: 'text-green-400', max: 10 },
  water: { label: '💧 Su Tüketimi', color: 'text-cyan-400', max: 10 },
};

export function renderWellnessScorePage(el) {
  const scores = getScores();
  const departments = {};
  scores.forEach(s => {
    if (!departments[s.department]) departments[s.department] = [];
    departments[s.department].push(s);
  });
  const avgOverall = Math.round(scores.reduce((s, x) => s + x.overall, 0) / (scores.length || 1));
  const highStress = scores.filter(s => s.stress >= 7).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">💆 Wellness Skor Sistemi</h1>
          <p class="text-slate-400 text-sm mt-1">Departman wellness analizi ve kişi bazlı takip</p>
        </div>
        <button id="add-wellness-btn" class="btn-primary">📊 Günlük Giriş</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center">
        <p class="text-4xl font-bold ${avgOverall >= 70 ? 'text-green-300' : avgOverall >= 50 ? 'text-amber-300' : 'text-red-300'}">${avgOverall}</p>
        <p class="text-xs text-slate-400">💆 Ort. Wellness Skoru</p>
        <p class="text-[10px] ${avgOverall >= 70 ? 'text-green-400' : avgOverall >= 50 ? 'text-amber-400' : 'text-red-400'}">${avgOverall >= 70 ? 'İyi 👍' : avgOverall >= 50 ? 'Orta 😐' : 'Dikkat ⚠️'}</p>
      </div>
      <div class="card text-center"><p class="text-3xl font-bold text-pink-300">${scores.length}</p><p class="text-xs text-slate-400">👤 Katılımcı</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${highStress > 0 ? 'text-red-300' : 'text-green-300'}">${highStress}</p><p class="text-xs text-slate-400">😰 Yüksek Stres</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${Object.keys(departments).length}</p><p class="text-xs text-slate-400">🏢 Departman</p></div>
    </div>

    <!-- Departman Wellness Haritası -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Wellness Haritası</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${Object.entries(departments).map(([dept, members]) => {
          const avgScore = Math.round(members.reduce((s, m) => s + m.overall, 0) / members.length);
          const avgStress = (members.reduce((s, m) => s + m.stress, 0) / members.length).toFixed(1);
          return `
          <div class="rounded-xl border ${avgScore >= 70 ? 'border-green-500/20 bg-green-500/5' : avgScore >= 50 ? 'border-amber-500/20 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'} p-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-white text-sm">${dept}</h4>
              <span class="text-2xl font-bold ${avgScore >= 70 ? 'text-green-400' : avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}">${avgScore}</span>
            </div>
            <div class="space-y-2">
              ${Object.entries(metricLabels).map(([key, meta]) => {
                const avg = (members.reduce((s, m) => s + m[key], 0) / members.length).toFixed(1);
                const pct = Math.round((avg / meta.max) * 100);
                const displayPct = meta.inverted ? 100 - pct : pct;
                return `
                <div class="flex items-center gap-2">
                  <span class="text-[10px] w-20 text-slate-400">${meta.label.split(' ')[0]}</span>
                  <div class="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div class="h-full rounded-full ${displayPct >= 70 ? 'bg-green-500' : displayPct >= 40 ? 'bg-amber-500' : 'bg-red-500'}" style="width:${displayPct}%"></div>
                  </div>
                  <span class="text-[10px] text-slate-500 w-6 text-right">${avg}</span>
                </div>`;
              }).join('')}
            </div>
            <p class="text-[10px] text-slate-500 mt-2">👥 ${members.length} kişi · Stres ort: ${avgStress}</p>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Kişi Bazlı Skorlar -->
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">👤 Kişi Bazlı Wellness Skorları</h3>
      <div class="space-y-3">
        ${scores.sort((a, b) => b.overall - a.overall).map(s => `
          <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div class="flex items-center gap-4 flex-wrap">
              <div class="w-12 h-12 rounded-xl ${s.overall >= 70 ? 'bg-green-500/15' : s.overall >= 50 ? 'bg-amber-500/15' : 'bg-red-500/15'} flex items-center justify-center">
                <span class="text-xl font-bold ${s.overall >= 70 ? 'text-green-300' : s.overall >= 50 ? 'text-amber-300' : 'text-red-300'}">${s.overall}</span>
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <h4 class="font-semibold text-white text-sm">${s.personName}</h4>
                  <span class="text-[10px] text-slate-500">${s.department}</span>
                  <span class="text-xs">${s.trend === 'up' ? '📈' : s.trend === 'down' ? '📉' : '➡️'}</span>
                </div>
                <div class="flex gap-4 flex-wrap">
                  ${Object.entries(metricLabels).map(([key, meta]) => {
                    const val = s[key];
                    const emoji = val >= 7 ? '🟢' : val >= 4 ? '🟡' : '🔴';
                    return `<span class="text-[10px] ${meta.color}">${meta.label.split(' ')[0]} ${val}/10 ${emoji}</span>`;
                  }).join('')}
                </div>
              </div>
              <p class="text-[10px] text-slate-600">📅 ${s.lastEntry}</p>
            </div>
          </div>`).join('')}
      </div>
    </div>`;

  el.querySelector('#add-wellness-btn')?.addEventListener('click', () => showWellnessModal(el));
}

function showWellnessModal(el) {
  const existing = document.getElementById('wellness-modal');
  if (existing) existing.remove();
  const personnel = getPersonnel({});
  const modal = document.createElement('div');
  modal.id = 'wellness-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">💆 Wellness Girişi</h3>
      <div class="space-y-3">
        <div><label class="label">Personel</label><select id="ws-person" class="input-field w-full">${personnel.map(p => `<option value="${p.name}" data-dept="${p.department}">${p.name} - ${p.department}</option>`).join('')}</select></div>
        ${Object.entries(metricLabels).map(([key, meta]) => `
          <div>
            <label class="label">${meta.label} (0-10)</label>
            <div class="flex items-center gap-3">
              <input type="range" id="ws-${key}" min="0" max="10" value="5" class="flex-1">
              <span id="ws-${key}-val" class="text-sm font-bold text-white w-6 text-center">5</span>
            </div>
          </div>`).join('')}
      </div>
      <div class="flex gap-3 mt-6">
        <button id="ws-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="ws-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  Object.keys(metricLabels).forEach(key => {
    const range = modal.querySelector(`#ws-${key}`);
    const valEl = modal.querySelector(`#ws-${key}-val`);
    range?.addEventListener('input', () => { valEl.textContent = range.value; });
  });

  modal.querySelector('#ws-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#ws-save').onclick = () => {
    const person = modal.querySelector('#ws-person');
    const name = person.value;
    const dept = person.selectedOptions[0]?.dataset.dept || '';
    const metrics = {};
    let sum = 0;
    Object.keys(metricLabels).forEach(key => {
      metrics[key] = parseInt(modal.querySelector(`#ws-${key}`).value) || 5;
      sum += metrics[key];
    });
    const overall = Math.round((sum / (Object.keys(metricLabels).length * 10)) * 100);
    const scores = getScores();
    const existing = scores.find(s => s.personName === name);
    if (existing) {
      Object.assign(existing, metrics, { overall, lastEntry: new Date().toISOString().split('T')[0] });
    } else {
      scores.push({ id: Date.now(), personName: name, department: dept, ...metrics, overall, trend: 'stable', lastEntry: new Date().toISOString().split('T')[0] });
    }
    saveScores(scores);
    modal.remove();
    showToast(`Wellness skoru kaydedildi: ${overall}/100`, 'success');
    renderWellnessScorePage(el);
  };
}
