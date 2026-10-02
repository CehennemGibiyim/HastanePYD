// ===== MAAS ZAM SIMULASYONU =====
import { simulateSalaryRaise } from '../state-extensions.js';
import { getDepartments, getSalaryRates } from '../state.js';

export function renderSalarySimPage(el) {
  const depts = getDepartments();
  const rates = getSalaryRates();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">💰 Maaş Zam Simülasyonu</h1>
      <p class="text-slate-400 text-sm mt-1">Zam senaryoları ve departman maliyet etkisi</p>
    </div>
    <div class="card mb-6 fade-in">
      <div class="flex flex-wrap gap-4 items-end">
        <div><label class="label">Zam Oranı (%)</label><input id="sim-rate" type="number" class="input-field w-32" value="10" min="1" max="100"></div>
        <div><label class="label">Departman</label><select id="sim-dept" class="input-field w-48"><option value="">Tüm Departmanlar</option>${depts.map(d => '<option>' + d + '</option>').join('')}</select></div>
        <button id="sim-btn" class="btn-primary">🔄 Simüle Et</button>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-in">
      <div id="sim-card-1" class="card text-center"></div>
      <div id="sim-card-2" class="card text-center"></div>
      <div id="sim-card-3" class="card text-center"></div>
      <div id="sim-card-4" class="card text-center"></div>
    </div>
    <div id="sim-comparison" class="fade-in"></div>
    <div id="sim-scenarios" class="card mt-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Çoklu Senaryo Karşılaştırma</h3>
      <div id="sim-scenarios-list"></div>
    </div>`;

  function runSim() {
    const rate = parseFloat(document.getElementById('sim-rate').value) || 10;
    const dept = document.getElementById('sim-dept').value;
    const result = simulateSalaryRaise(rate, dept);
    document.getElementById('sim-card-1').innerHTML = `<p class="text-2xl font-bold text-white">${result.personnelCount}</p><p class="text-xs text-slate-400">Etkilenen Personel</p>`;
    document.getElementById('sim-card-2').innerHTML = `<p class="text-2xl font-bold text-green-300">₺${result.currentCost.toLocaleString('tr-TR')}</p><p class="text-xs text-slate-400">Mevcut Maliyet</p>`;
    document.getElementById('sim-card-3').innerHTML = `<p class="text-2xl font-bold text-cyan-300">₺${result.raisedCost.toLocaleString('tr-TR')}</p><p class="text-xs text-slate-400">Yeni Maliyet</p>`;
    document.getElementById('sim-card-4').innerHTML = `<p class="text-2xl font-bold text-amber-300">+₺${result.increase.toLocaleString('tr-TR')}</p><p class="text-xs text-slate-400">Artış (kişi başı: ₺${result.perPerson.toLocaleString('tr-TR')})</p>`;

    // Comparison bar
    document.getElementById('sim-comparison').innerHTML = `
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-4">📈 Maliyet Karşılaştırma</h3>
        <div class="space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1"><span class="text-slate-400">Mevcut</span><span class="text-white font-medium">₺${result.currentCost.toLocaleString('tr-TR')}</span></div>
            <div class="h-8 rounded-lg bg-white/10 overflow-hidden"><div class="h-full rounded-lg bg-slate-500" style="width:100%"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-sm mb-1"><span class="text-slate-400">%${rate} Zam Sonrası</span><span class="text-cyan-300 font-medium">₺${result.raisedCost.toLocaleString('tr-TR')}</span></div>
            <div class="h-8 rounded-lg bg-white/10 overflow-hidden"><div class="h-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500" style="width:${Math.round(result.raisedCost / result.currentCost * 100)}%"></div></div>
          </div>
        </div>
      </div>`;

    // Multi-scenario
    const scenarios = [5, 10, 15, 20, 25].map(p => ({ ...simulateSalaryRaise(p, dept), pct: p }));
    document.getElementById('sim-scenarios-list').innerHTML = `
      <div class="overflow-x-auto"><table class="w-full text-sm">
        <thead><tr class="border-b border-white/10 bg-white/5"><th class="th">Zam Oranı</th><th class="th">Yeni Maliyet</th><th class="th">Artış</th><th class="th">Kişi Başı</th></tr></thead>
        <tbody>${scenarios.map(s => `
          <tr class="border-b border-white/5 ${s.pct === rate ? 'bg-cyan-500/10' : ''}">
            <td class="td font-medium text-white">%${s.pct}</td>
            <td class="td">₺${s.raisedCost.toLocaleString('tr-TR')}</td>
            <td class="td text-amber-300">+₺${s.increase.toLocaleString('tr-TR')}</td>
            <td class="td">₺${s.perPerson.toLocaleString('tr-TR')}</td>
          </tr>`).join('')}</tbody></table></div>`;
  }

  document.getElementById('sim-btn').onclick = runSim;
  runSim();
}
