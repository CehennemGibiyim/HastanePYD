// ===== ÇALIŞAN REFAHI (WELLNESS TRACKER) =====
import { getPersonnel, getPersonnelById } from '../state.js';
import { showToast } from '../notifications.js';

const MOODS = [
  { score: 5, emoji: '😊', label: 'Çok İyi', color: 'green' },
  { score: 4, emoji: '🙂', label: 'İyi', color: 'emerald' },
  { score: 3, emoji: '😐', label: 'Normal', color: 'amber' },
  { score: 2, emoji: '😔', label: 'Kötü', color: 'orange' },
  { score: 1, emoji: '😢', label: 'Çok Kötü', color: 'red' },
];

export function renderWellnessPage(container) {
  const personnel = getPersonnel({ status: 'active' });
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const entries = getWellnessEntries();

  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">💆 Çalışan Refahı Takibi</h1>
          <p class="text-slate-400 text-sm mt-1">Ruh hali, stres ve wellness skoru</p>
        </div>
        <button id="wellness-add-btn" class="btn-primary">+ Bugünkü Kayıt</button>
      </div>

      <!-- Wellness Dashboard -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${wellnessStatCard('📊', 'Ortalama Skor', calcAvgScore(entries), '/ 5.0', 'cyan')}
        ${wellnessStatCard('👥', 'Katılımcı', uniqueParticipants(entries, thisWeek(entries)), 'bu hafta', 'green')}
        ${wellnessStatCard('😊', 'En İyi Ruh Hali', bestDept(entries), '', 'emerald')}
        ${wellnessStatCard('⚠️', 'Stresli Departman', worstDept(entries), '', 'red')}
      </div>

      <!-- Mood Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">😊 Ruh Hali Dağılımı (Son 7 Gün)</h3>
          <div class="space-y-3">
            ${MOODS.map(m => {
              const count = entries.filter(e => e.date >= weekAgo && e.mood === m.score).length;
              const total = entries.filter(e => e.date >= weekAgo).length || 1;
              return `
                <div class="flex items-center gap-3">
                  <span class="text-xl w-8">${m.emoji}</span>
                  <span class="text-sm text-slate-300 w-20">${m.label}</span>
                  <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
                    <div class="h-full rounded-lg bg-${m.color}-500/60 transition-all flex items-center pl-2"
                         style="width:${Math.round(count/total*100)}%">
                      <span class="text-xs font-bold text-white">${count}</span>
                    </div>
                  </div>
                  <span class="text-xs text-slate-500 w-10 text-right">${Math.round(count/total*100)}%</span>
                </div>`;
            }).join('')}
          </div>
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Wellness Skoru</h3>
          <div id="wellness-dept-chart" class="space-y-2.5"></div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">💡 Wellness Önerileri</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${generateRecommendations(entries).map(r => `
            <div class="rounded-xl bg-${r.color}-500/10 border border-${r.color}-500/20 p-4">
              <p class="text-lg mb-1">${r.icon}</p>
              <p class="text-sm font-medium text-${r.color}-300">${r.title}</p>
              <p class="text-xs text-slate-400 mt-1">${r.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recent Entries -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📋 Son Kayıtlar</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead><tr>
              <th class="th">Tarih</th><th class="th">Personel</th><th class="th">Departman</th>
              <th class="th">Ruh Hali</th><th class="th">Stres</th><th class="th">Uyku</th><th class="th">Not</th>
            </tr></thead>
            <tbody>
              ${entries.slice(-20).reverse().map(e => {
                const p = getPersonnelById(e.personnelId);
                const mood = MOODS.find(m => m.score === e.mood);
                return `<tr class="border-t border-white/5 hover:bg-white/[0.02]">
                  <td class="td text-xs">${e.date}</td>
                  <td class="td">${p ? p.name + ' ' + p.surname : 'Bilinmiyor'}</td>
                  <td class="td text-xs">${p?.department || '-'}</td>
                  <td class="td"><span class="text-lg">${mood?.emoji || '😐'}</span> <span class="text-xs text-${mood?.color}-400">${mood?.label}</span></td>
                  <td class="td"><span class="badge ${e.stress > 7 ? 'bg-red-500/20 text-red-400' : e.stress > 4 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}">${e.stress || '-'}/10</span></td>
                  <td class="td text-xs">${e.sleep ? e.sleep + ' saat' : '-'}</td>
                  <td class="td text-xs text-slate-400 max-w-[200px] truncate">${e.note || '-'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  renderDeptWellnessChart(entries);
  document.getElementById('wellness-add-btn').onclick = () => showWellnessModal(personnel);
}

function wellnessStatCard(icon, label, value, sub, color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5">
    <p class="text-sm text-${color}-300">${icon} ${label}</p>
    <p class="text-2xl font-bold text-white mt-1">${value}</p>
    <p class="text-xs text-${color}-400/60 mt-1">${sub}</p>
  </div>`;
}

function renderDeptWellnessChart(entries) {
  const el = document.getElementById('wellness-dept-chart');
  if (!el) return;
  const deptScores = {};
  entries.forEach(e => {
    const p = getPersonnelById(e.personnelId);
    if (!p) return;
    if (!deptScores[p.department]) deptScores[p.department] = { total: 0, count: 0 };
    deptScores[p.department].total += (e.mood || 3);
    deptScores[p.department].count++;
  });
  const sorted = Object.entries(deptScores)
    .map(([dept, d]) => ({ dept, avg: Math.round(d.total / d.count * 10) / 10, count: d.count }))
    .sort((a, b) => b.avg - a.avg);
  const maxAvg = 5;
  el.innerHTML = sorted.length ? sorted.map(d => `
    <div class="flex items-center gap-3">
      <span class="text-sm text-slate-300 w-28 truncate">${d.dept}</span>
      <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
        <div class="h-full rounded-lg transition-all flex items-center pl-2" style="width:${Math.round(d.avg/maxAvg*100)}%; background: ${d.avg >= 4 ? 'rgba(34,197,94,0.4)' : d.avg >= 3 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}">
          <span class="text-xs font-bold text-white">${d.avg}</span>
        </div>
      </div>
      <span class="text-xs text-slate-500 w-12 text-right">${d.count} kayıt</span>
    </div>
  `).join('') : '<p class="text-slate-500 text-sm text-center py-4">Henüz veri yok</p>';
}

function showWellnessModal(personnel) {
  const existing = document.getElementById('wellness-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'wellness-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">💆 Bugünkü Wellness Kaydı</h3>
      <div class="space-y-4">
        <div>
          <label class="label">Personel</label>
          <select id="w-person" class="input-field w-full">
            ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname} (${p.department})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="label">Ruh Hali</label>
          <div class="flex gap-2" id="w-mood-selector">
            ${MOODS.map(m => `
              <button class="flex-1 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-center w-mood-btn" data-score="${m.score}">
                <span class="text-2xl block">${m.emoji}</span>
                <span class="text-[10px] text-slate-400">${m.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <div>
          <label class="label">Stres Seviyesi (1-10)</label>
          <input id="w-stress" type="range" min="1" max="10" value="5" class="w-full accent-red-500">
          <div class="flex justify-between text-xs text-slate-500"><span>1 Düşük</span><span id="w-stress-val">5</span><span>10 Yüksek</span></div>
        </div>
        <div>
          <label class="label">Uyku Süresi (saat)</label>
          <input id="w-sleep" type="number" min="0" max="16" step="0.5" value="7" class="input-field w-full">
        </div>
        <div>
          <label class="label">Not (opsiyonel)</label>
          <textarea id="w-note" class="input-field w-full" rows="2" placeholder="Bugün kendinizi nasıl hissediyorsunuz?"></textarea>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="w-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="w-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.id === 'wellness-modal') modal.remove(); };
  document.getElementById('w-cancel').onclick = () => modal.remove();

  let selectedMood = 3;
  document.querySelectorAll('.w-mood-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.w-mood-btn').forEach(b => b.classList.remove('border-cyan-500/50', 'bg-cyan-500/10'));
      btn.classList.add('border-cyan-500/50', 'bg-cyan-500/10');
      selectedMood = parseInt(btn.dataset.score);
    };
  });

  const stressInput = document.getElementById('w-stress');
  const stressVal = document.getElementById('w-stress-val');
  stressInput.oninput = () => { stressVal.textContent = stressInput.value; };

  document.getElementById('w-save').onclick = () => {
    const entry = {
      id: Date.now(),
      personnelId: parseInt(document.getElementById('w-person').value),
      date: new Date().toISOString().split('T')[0],
      mood: selectedMood,
      stress: parseInt(stressInput.value),
      sleep: parseFloat(document.getElementById('w-sleep').value) || null,
      note: document.getElementById('w-note').value.trim(),
      timestamp: new Date().toISOString(),
    };
    const entries = getWellnessEntries();
    entries.push(entry);
    saveWellnessEntries(entries);
    modal.remove();
    showToast('Wellness kaydı eklendi!', 'success');
    renderWellnessPage(document.getElementById('content'));
  };
}

function getWellnessEntries() { try { return JSON.parse(localStorage.getItem('hospital_wellness') || '[]'); } catch { return []; } }
function saveWellnessEntries(entries) { localStorage.setItem('hospital_wellness', JSON.stringify(entries)); }
function thisWeek(entries) { const d = new Date(Date.now() - 7*86400000).toISOString().split('T')[0]; return entries.filter(e => e.date >= d); }
function calcAvgScore(entries) { if (!entries.length) return '0.0'; return (entries.reduce((s, e) => s + (e.mood || 3), 0) / entries.length).toFixed(1); }
function uniqueParticipants(entries, weekEntries) { return new Set(weekEntries.map(e => e.personnelId)).size; }
function bestDept(entries) { return deptRanking(entries, true); }
function worstDept(entries) { return deptRanking(entries, false); }
function deptRanking(entries, best) {
  const scores = {};
  entries.forEach(e => { const p = getPersonnelById(e.personnelId); if (p) { if (!scores[p.department]) scores[p.department] = []; scores[p.department].push(e.mood || 3); } });
  const avgs = Object.entries(scores).map(([d, s]) => ({ dept: d, avg: s.reduce((a,b)=>a+b,0)/s.length }));
  if (!avgs.length) return 'Veri yok';
  avgs.sort((a,b) => best ? b.avg - a.avg : a.avg - b.avg);
  return avgs[0].dept;
}
function generateRecommendations(entries) {
  const recs = [];
  const avgStress = entries.length ? entries.reduce((s, e) => s + (e.stress||5), 0) / entries.length : 5;
  const avgSleep = entries.filter(e=>e.sleep).length ? entries.filter(e=>e.sleep).reduce((s,e)=>s+e.sleep,0)/entries.filter(e=>e.sleep).length : 7;
  const avgMood = entries.length ? entries.reduce((s,e)=>s+(e.mood||3),0)/entries.length : 3;
  if (avgStress > 6) recs.push({ icon: '🧘', title: 'Stres Yönetimi', desc: 'Ortalama stres yüksek. Gevşeme egzersizleri önerin.', color: 'red' });
  else recs.push({ icon: '💪', title: 'Stres Kontrolü', desc: 'Stres seviyeleri normal aralıkta, devam edin!', color: 'green' });
  if (avgSleep < 6.5) recs.push({ icon: '😴', title: 'Uyku Kalitesi', desc: 'Ortalama uyku süresi düşük. Vardiya düzenlemesi düşünün.', color: 'amber' });
  else recs.push({ icon: '🌙', title: 'Uyku Düzeni', desc: 'Uyku süresi yeterli seviyede.', color: 'blue' });
  if (avgMood < 3) recs.push({ icon: '🤝', title: 'Ekip Moral', desc: 'Ruh hali düşük. Ekip etkinlikleri düzenleyin.', color: 'purple' });
  else recs.push({ icon: '🎉', title: 'Ekip Ruhu', desc: 'Genel moral iyi seviyede, pozitif atmosferi koruyun!', color: 'cyan' });
  return recs;
}
