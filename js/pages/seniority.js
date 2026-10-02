// ===== KIDEM TAZMİNATI HESAPLAMA =====

import { getPersonnel, getPersonnelById, PERSONNEL_TYPES, getSalaryRates, getMonthlyReport } from '../state.js';
import { showToast } from '../notifications.js';

export function renderSeniorityPage(el) {
  const personnel = getPersonnel().filter(p => p.status === 'active');
  const now = new Date();
  const rates = getSalaryRates();

  const enriched = personnel.map(p => {
    const startDate = new Date(p.startDate);
    const years = (now - startDate) / (365.25 * 86400000);
    const fullYears = Math.floor(years);
    const months = Math.floor((years - fullYears) * 12);
    const days = Math.floor(((years - fullYears) * 12 - months) * 30);
    
    // Kıdem tazminatı: her tam yıl için 30 günlük brüt ücret
    const hourlyRate = rates[p.type] || rates.default || 50;
    const monthlySalary = hourlyRate * (PERSONNEL_TYPES[p.type]?.weeklyHours || 40) * 4.33;
    const dailyWage = monthlySalary / 30;
    const severancePay = fullYears * 30 * dailyWage;
    
    // Emeklilik yaşı (varsayım: 65)
    const birthYear = 1970 + (p.id % 30); // Seed: approx birth year
    const retirementAge = 65;
    const currentAge = now.getFullYear() - birthYear;
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);

    return {
      ...p,
      years: years.toFixed(1),
      fullYears,
      months,
      days,
      severancePay: Math.round(severancePay),
      dailyWage: Math.round(dailyWage),
      monthlySalary: Math.round(monthlySalary),
      yearsToRetirement,
      currentAge,
      retirementAge,
    };
  }).sort((a, b) => b.fullYears - a.fullYears);

  const totalSeverance = enriched.reduce((s, p) => s + p.severancePay, 0);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">⏰ Kıdem Tazminatı Hesaplama</h1>
      <p class="text-slate-400 text-sm mt-1">Personel kıdem süresi ve tazminat tahmini</p>
    </div>

    <!-- Özet -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-cyan-300">${enriched.length}</p>
        <p class="text-xs text-cyan-400">Aktif Personel</p>
      </div>
      <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
        <p class="text-lg font-bold text-green-300">₺${totalSeverance.toLocaleString('tr-TR')}</p>
        <p class="text-xs text-green-400">Toplam Tazminat Tahmini</p>
      </div>
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-amber-300">${enriched.filter(p => p.fullYears >= 10).length}</p>
        <p class="text-xs text-amber-400">10+ Yıl Kıdemli</p>
      </div>
      <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-purple-300">${enriched.filter(p => p.yearsToRetirement <= 5).length}</p>
        <p class="text-xs text-purple-400">Emekliliğe Yakın</p>
      </div>
    </div>

    <!-- Kıdem Dağılımı -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Kıdem Dağılımı</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        ${[
          { label: '0-2 Yıl', filter: p => p.fullYears < 3, color: 'blue' },
          { label: '3-5 Yıl', filter: p => p.fullYears >= 3 && p.fullYears < 6, color: 'cyan' },
          { label: '6-10 Yıl', filter: p => p.fullYears >= 6 && p.fullYears < 11, color: 'green' },
          { label: '11-15 Yıl', filter: p => p.fullYears >= 11 && p.fullYears < 16, color: 'amber' },
          { label: '15+ Yıl', filter: p => p.fullYears >= 16, color: 'purple' },
        ].map(g => {
          const count = enriched.filter(g.filter).length;
          return `
          <div class="rounded-xl bg-${g.color}-500/10 border border-${g.color}-500/20 p-4 text-center">
            <p class="text-2xl font-bold text-${g.color}-300">${count}</p>
            <p class="text-xs text-${g.color}-400">${g.label}</p>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Personel Tablosu -->
    <div class="card fade-in overflow-x-auto">
      <h3 class="text-lg font-semibold text-white mb-4">👥 Personel Kıdem Listesi</h3>
      <table class="w-full">
        <thead><tr>
          <th class="th">Personel</th>
          <th class="th">Departman</th>
          <th class="th">İşe Giriş</th>
          <th class="th text-right">Kıdem</th>
          <th class="th text-right">Günlük Ücret</th>
          <th class="th text-right">Tazminat</th>
          <th class="th text-right">Emeklilik</th>
          <th class="th">İşlem</th>
        </tr></thead>
        <tbody>
          ${enriched.map(p => `
            <tr class="border-t border-white/5 hover:bg-white/5">
              <td class="td">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-[10px] font-bold shrink-0">
                    ${p.photo ? `<img src="${p.photo}" class="w-full h-full object-cover rounded-lg">` : (p.name[0] + p.surname[0])}
                  </div>
                  <span class="text-sm text-white">${p.name} ${p.surname}</span>
                </div>
              </td>
              <td class="td text-xs">${p.department}</td>
              <td class="td text-xs">${p.startDate}</td>
              <td class="td text-right">
                <span class="text-white font-medium">${p.fullYears}</span>
                <span class="text-slate-500 text-xs"> yıl ${p.months} ay</span>
              </td>
              <td class="td text-right">₺${p.dailyWage.toLocaleString('tr-TR')}</td>
              <td class="td text-right font-bold text-green-400">₺${p.severancePay.toLocaleString('tr-TR')}</td>
              <td class="td text-right">
                ${p.yearsToRetirement <= 5 ? `<span class="text-amber-400 font-medium">${p.yearsToRetirement} yıl</span>` :
                  `<span class="text-slate-400">${p.yearsToRetirement} yıl</span>`}
              </td>
              <td class="td">
                <button data-seniority-detail="${p.id}" class="text-xs text-cyan-400 hover:text-cyan-300">📋 Detay</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;

  el.querySelectorAll('[data-seniority-detail]').forEach(btn => {
    btn.onclick = () => {
      const p = enriched.find(x => x.id === parseInt(btn.dataset.seniorityDetail));
      if (p) showSeniorityDetail(p);
    };
  });
}

function showSeniorityDetail(p) {
  const existing = document.getElementById('seniority-detail-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'seniority-detail-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📋 ${p.name} ${p.surname} - Kıdem Detayı</h3>
      <div class="space-y-3">
        <div class="rounded-xl bg-white/5 p-3">
          <p class="text-xs text-slate-400">İşe Giriş Tarihi</p>
          <p class="text-sm text-white">${new Date(p.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg bg-cyan-500/10 p-3 text-center">
            <p class="text-xl font-bold text-cyan-300">${p.fullYears}</p>
            <p class="text-[10px] text-cyan-400">Yıl</p>
          </div>
          <div class="rounded-lg bg-cyan-500/10 p-3 text-center">
            <p class="text-xl font-bold text-cyan-300">${p.months}</p>
            <p class="text-[10px] text-cyan-400">Ay</p>
          </div>
          <div class="rounded-lg bg-cyan-500/10 p-3 text-center">
            <p class="text-xl font-bold text-cyan-300">${p.days}</p>
            <p class="text-[10px] text-cyan-400">Gün</p>
          </div>
        </div>
        <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
          <p class="text-xs text-green-400 mb-1">Tahmini Kıdem Tazminatı</p>
          <p class="text-2xl font-bold text-green-300">₺${p.severancePay.toLocaleString('tr-TR')}</p>
          <p class="text-[10px] text-slate-500 mt-1">Her yıl için 30 günlük ücret × ${p.fullYears} yıl</p>
        </div>
        <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3">
          <p class="text-xs text-purple-400">Emeklilik: ${p.yearsToRetirement > 0 ? `${p.yearsToRetirement} yıl kaldı` : 'Emekliliğe uygun'}</p>
        </div>
      </div>
      <button id="seniority-close" class="btn-secondary w-full mt-5">Kapat</button>
    </div>`;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.id === 'seniority-detail-modal') modal.remove(); };
  document.getElementById('seniority-close').onclick = () => modal.remove();
}
