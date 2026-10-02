// ===== KALITE GOSTERGELERI (KPI DASHBOARD) =====
import { getPersonnel } from '../state.js';

function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_quality_kpi') || '{"kpis":[],"history":[],"settings":{}}'); } catch { return { kpis: [], history: [], settings: {} }; }
}
function setStorage(d) { localStorage.setItem('hospital_quality_kpi', JSON.stringify(d)); }

const KPI_CATEGORIES = [
  { id: 'patient_safety', label: 'Hasta Güvenliği', icon: '🛡️', color: 'blue' },
  { id: 'infection', label: 'Enfeksiyon Kontrolü', icon: '🦠', color: 'red' },
  { id: 'satisfaction', label: 'Hasta Memnuniyeti', icon: '😊', color: 'emerald' },
  { id: 'mortality', label: 'Mortalite', icon: '📊', color: 'slate' },
  { id: 'efficiency', label: 'Operasyonel Verimlilik', icon: '⚙️', color: 'amber' },
  { id: 'staff', label: 'Personel Göstergeleri', icon: '👥', color: 'purple' },
];

function seedKPIs() {
  const data = getStorage();
  if (data.kpis.length > 0) return;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  data.kpis = [
    { id: 1, category: 'patient_safety', name: 'Hasta Düşme Oranı', value: 0.8, target: 1.0, unit: '%', direction: 'lower', period: month, trend: 'down', icon: '🛡️' },
    { id: 2, category: 'patient_safety', name: 'İlaç Hatası Oranı', value: 0.3, target: 0.5, unit: '%', direction: 'lower', period: month, trend: 'stable', icon: '💊' },
    { id: 3, category: 'patient_safety', name: 'Ameliyat Sonrası Enfeksiyon', value: 1.2, target: 2.0, unit: '%', direction: 'lower', period: month, trend: 'down', icon: '🔪' },
    { id: 4, category: 'patient_safety', name: 'Yanlış Hasta/Yanlış Site Olayı', value: 0, target: 0, unit: 'adet', direction: 'lower', period: month, trend: 'stable', icon: '⚠️' },
    { id: 5, category: 'infection', name: 'Hastane Enfeksiyon Oranı', value: 2.1, target: 3.0, unit: '%', direction: 'lower', period: month, trend: 'down', icon: '🦠' },
    { id: 6, category: 'infection', name: 'El Hijyemi Uyum Oranı', value: 87, target: 90, unit: '%', direction: 'higher', period: month, trend: 'up', icon: '🧼' },
    { id: 7, category: 'infection', name: 'Kan Kültürü Kontaminasyonu', value: 1.5, target: 2.0, unit: '%', direction: 'lower', period: month, trend: 'stable', icon: '🩸' },
    { id: 8, category: 'satisfaction', name: 'Hasta Memnuniyet Skoru', value: 4.2, target: 4.5, unit: '/5', direction: 'higher', period: month, trend: 'up', icon: '⭐' },
    { id: 9, category: 'satisfaction', name: 'Şikayet Oranı', value: 3.5, target: 5.0, unit: '%', direction: 'lower', period: month, trend: 'down', icon: '📝' },
    { id: 10, category: 'satisfaction', name: 'Ortalama Bekleme Süresi', value: 22, target: 30, unit: 'dk', direction: 'lower', period: month, trend: 'down', icon: '⏱️' },
    { id: 11, category: 'mortality', name: 'Hastane Mortalite Oranı', value: 1.8, target: 2.0, unit: '%', direction: 'lower', period: month, trend: 'stable', icon: '📊' },
    { id: 12, category: 'mortality', name: 'Yoğun Bakım Mortalite', value: 8.5, target: 10.0, unit: '%', direction: 'lower', period: month, trend: 'down', icon: '❤️‍🩹' },
    { id: 13, category: 'mortality', name: '48 Saatlik Rehospitalizasyon', value: 4.2, target: 5.0, unit: '%', direction: 'lower', period: month, trend: 'stable', icon: '🔄' },
    { id: 14, category: 'efficiency', name: 'Yatak Doluluk Oranı', value: 78, target: 85, unit: '%', direction: 'higher', period: month, trend: 'up', icon: '🛏️' },
    { id: 15, category: 'efficiency', name: 'Ortalama Yatış Süresi', value: 4.5, target: 5.0, unit: 'gün', direction: 'lower', period: month, trend: 'down', icon: '📅' },
    { id: 16, category: 'efficiency', name: 'Acil Servis Bekleme', value: 18, target: 25, unit: 'dk', direction: 'lower', period: month, trend: 'down', icon: '🚨' },
    { id: 17, category: 'staff', name: 'Personel Devir Oranı', value: 8.5, target: 10.0, unit: '%', direction: 'lower', period: month, trend: 'stable', icon: '🔄' },
    { id: 18, category: 'staff', name: 'Hemşire/Hasta Oranı', value: 1.6, target: 1.5, unit: '/hasta', direction: 'higher', period: month, trend: 'up', icon: '👩‍⚕️' },
    { id: 19, category: 'staff', name: 'Personel Memnuniyeti', value: 3.8, target: 4.0, unit: '/5', direction: 'higher', period: month, trend: 'up', icon: '😊' },
  ];
  data.history = [
    { month: '2025-01', scores: { patient_safety: 82, infection: 78, satisfaction: 85, mortality: 90, efficiency: 75, staff: 80 } },
    { month: '2025-02', scores: { patient_safety: 84, infection: 80, satisfaction: 83, mortality: 91, efficiency: 77, staff: 82 } },
    { month: '2025-03', scores: { patient_safety: 86, infection: 82, satisfaction: 86, mortality: 90, efficiency: 79, staff: 81 } },
    { month: '2025-04', scores: { patient_safety: 85, infection: 84, satisfaction: 88, mortality: 92, efficiency: 81, staff: 83 } },
    { month: '2025-05', scores: { patient_safety: 88, infection: 85, satisfaction: 87, mortality: 91, efficiency: 83, staff: 85 } },
    { month: '2025-06', scores: { patient_safety: 90, infection: 87, satisfaction: 89, mortality: 93, efficiency: 85, staff: 86 } },
  ];
  setStorage(data);
}

export function renderQualityKPIPage(el) {
  seedKPIs();
  const data = getStorage();
  const activeCat = data._cat || 'all';

  // Overall score
  const latest = data.history[data.history.length - 1];
  const overallScore = latest ? Math.round(Object.values(latest.scores).reduce((s, v) => s + v, 0) / Object.values(latest.scores).length) : 0;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Kalite Göstergeleri (KPI)</h1>
      <p class="text-slate-400 text-sm mt-1">Hasta güvenliği, enfeksiyon kontrolü ve operasyonel kalite takibi</p>
    </div>

    <!-- Genel Skor -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5 text-center">
        <p class="text-sm text-cyan-300">🎯 Genel Kalite Skoru</p>
        <p class="text-4xl font-bold text-white mt-1">${overallScore}</p>
        <p class="text-xs text-cyan-400/60">/100</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-5 text-center">
        <p class="text-sm text-emerald-300">✅ Hedef Altı</p>
        <p class="text-4xl font-bold text-white mt-1">${data.kpis.filter(k => { const met = k.direction === 'lower' ? k.value <= k.target : k.value >= k.target; return met; }).length}</p>
        <p class="text-xs text-emerald-400/60">/${data.kpis.length} KPI</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5 text-center">
        <p class="text-sm text-amber-300">⚠️ Uyarı</p>
        <p class="text-4xl font-bold text-white mt-1">${data.kpis.filter(k => { const met = k.direction === 'lower' ? k.value <= k.target : k.value >= k.target; return !met; }).length}</p>
        <p class="text-xs text-amber-400/60">hedef dışı</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 p-5 text-center">
        <p class="text-sm text-blue-300">📈 Trend</p>
        <p class="text-4xl font-bold text-white mt-1">${data.kpis.filter(k => k.trend === 'up' || k.trend === 'down').length}</p>
        <p class="text-xs text-blue-400/60">iyileşen</p>
      </div>
    </div>

    <!-- Kategori Filtre -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 fade-in">
      <button class="${activeCat === 'all' ? 'tab-active' : 'tab-inactive'}" data-cat="all">📊 Tümü</button>
      ${KPI_CATEGORIES.map(c => `<button class="${activeCat === c.id ? 'tab-active' : 'tab-inactive'}" data-cat="${c.id}">${c.icon} ${c.label}</button>`).join('')}
    </div>

    <!-- KPI Grid -->
    <div id="kpi-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in"></div>

    <!-- Trend Grafiği -->
    <div class="card mt-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📈 6 Aylık Kalite Trendi</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr>
            <th class="th">Kategori</th>
            ${data.history.map(h => `<th class="th text-center">${h.month}</th>`).join('')}
            <th class="th text-center">Trend</th>
          </tr></thead>
          <tbody>
            ${KPI_CATEGORIES.map(cat => {
              const scores = data.history.map(h => h.scores[cat.id] || 0);
              const last = scores[scores.length - 1] || 0;
              const prev = scores[scores.length - 2] || 0;
              const diff = last - prev;
              return `<tr class="border-t border-white/5">
                <td class="td font-medium text-white">${cat.icon} ${cat.label}</td>
                ${scores.map(s => `<td class="td text-center"><span class="badge ${s >= 85 ? 'bg-emerald-500/15 text-emerald-300' : s >= 70 ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300'}">${s}</span></td>`).join('')}
                <td class="td text-center"><span class="text-${diff > 0 ? 'emerald' : diff < 0 ? 'red' : 'slate'}-300">${diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️'} ${diff > 0 ? '+' : ''}${diff}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  renderKPIGrid(activeCat, data);
  el.querySelectorAll('[data-cat]').forEach(btn => {
    btn.onclick = () => {
      const d = getStorage(); d._cat = btn.dataset.cat; setStorage(d);
      el.querySelectorAll('[data-cat]').forEach(b => { b.className = b.dataset.cat === btn.dataset.cat ? 'tab-active' : 'tab-inactive'; });
      renderKPIGrid(btn.dataset.cat, d);
    };
  });
}

function renderKPIGrid(cat, data) {
  const container = document.getElementById('kpi-grid');
  if (!container) return;
  const kpis = cat === 'all' ? data.kpis : data.kpis.filter(k => k.category === cat);

  container.innerHTML = kpis.map(kpi => {
    const met = kpi.direction === 'lower' ? kpi.value <= kpi.target : kpi.value >= kpi.target;
    const diff = kpi.direction === 'lower' ? ((kpi.target - kpi.value) / kpi.target * 100).toFixed(0) : ((kpi.value - kpi.target) / kpi.target * 100).toFixed(0);
    const trendIcon = kpi.trend === 'up' ? '📈' : kpi.trend === 'down' ? '📉' : '➡️';
    const catInfo = KPI_CATEGORIES.find(c => c.id === kpi.category);

    return `<div class="card ${met ? 'border-emerald-500/20' : 'border-amber-500/20'}">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-xl">${kpi.icon}</span>
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-white">${kpi.name}</h4>
          <p class="text-[10px] text-slate-400">${catInfo?.label || ''}</p>
        </div>
        <span class="text-lg">${trendIcon}</span>
      </div>
      <div class="flex items-end gap-3 mb-3">
        <span class="text-3xl font-bold ${met ? 'text-emerald-300' : 'text-amber-300'}">${kpi.value}</span>
        <span class="text-sm text-slate-400 mb-1">${kpi.unit}</span>
      </div>
      <div class="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
        <div class="h-full rounded-full ${met ? 'bg-emerald-500' : 'bg-amber-500'} transition-all" style="width:${Math.min(100, Math.abs(diff) + 50)}%"></div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-xs text-slate-400">Hedef: ${kpi.target}${kpi.unit}</span>
        <span class="text-xs ${met ? 'text-emerald-300' : 'text-amber-300'} font-medium">${met ? '✅ Hedef altında' : '⚠️ Hedef üstünde'}</span>
      </div>
    </div>`;
  }).join('');
}
