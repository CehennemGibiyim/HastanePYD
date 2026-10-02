// ===== MAAŞ HESAPLAMA SAYFASI =====

import {
  getPersonnel, getAttendance, getMonthlyReport, PERSONNEL_TYPES, WORK_PROFILES,
  getDefaultProfileForType, getCurrentUser, isDepartmentRestricted, getUserDepartment,
  getDepartments, getSalaryRates, saveSalaryRates,
} from '../state.js';
import { showToast } from '../notifications.js';

const TR_TAX_BRACKETS = [
  { limit: 110000, rate: 0.15 },
  { limit: 230000, rate: 0.20 },
  { limit: 580000, rate: 0.27 },
  { limit: 3000000, rate: 0.35 },
  { limit: Infinity, rate: 0.40 },
];

const SGK_EMPLOYEE = 0.14;
const SGK_UNEMPLOYMENT = 0.01;
const STAMP_TAX = 0.00759;

function calcGrossTax(annualGross) {
  let remaining = annualGross;
  let tax = 0;
  let prevLimit = 0;
  for (const bracket of TR_TAX_BRACKETS) {
    const bracketAmount = Math.min(remaining, bracket.limit - prevLimit);
    if (bracketAmount <= 0) break;
    tax += bracketAmount * bracket.rate;
    remaining -= bracketAmount;
    prevLimit = bracket.limit;
  }
  return tax;
}

function calcNetSalary(grossMonthly) {
  const sgk = grossMonthly * SGK_EMPLOYEE;
  const unemployment = grossMonthly * SGK_UNEMPLOYMENT;
  const sgkTotal = sgk + unemployment;
  const taxable = grossMonthly - sgkTotal;
  const annualTax = calcGrossTax(taxable * 12);
  const monthlyTax = annualTax / 12;
  const stamp = grossMonthly * STAMP_TAX;
  const net = grossMonthly - sgkTotal - monthlyTax - stamp;
  return {
    gross: Math.round(grossMonthly),
    sgk: Math.round(sgkTotal),
    tax: Math.round(monthlyTax),
    stamp: Math.round(stamp),
    net: Math.round(net),
  };
}

export function renderSalaryPage(el) {
  const user = getCurrentUser();
  const rates = getSalaryRates();
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const report = getMonthlyReport(monthStr);

  let filteredReport = report;
  if (isDepartmentRestricted()) {
    const dept = getUserDepartment();
    filteredReport = report.filter(r => r.department === dept);
  }

  const isAdmin = user?.role === 'admin';
  const depts = [...new Set(filteredReport.map(r => r.department))].sort();
  const sortedDepts = getDepartments().slice().sort();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">💰 Maaş Hesaplama</h1>
          <p class="text-slate-400 text-sm mt-1">Personel maaş tahmini ve puantaj bazlı hesaplama</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="month" id="salary-month" class="input-field text-sm" value="${monthStr}">
          <select id="salary-dept-filter" class="input-field text-sm">
            <option value="">Tüm Departmanlar</option>
            ${sortedDepts.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
          ${isAdmin ? '<button id="salary-rates-btn" class="btn-secondary text-sm">⚙️ Ücret Oranları</button>' : ''}
        </div>
      </div>
    </div>

    ${isAdmin ? `
    <div id="salary-rates-panel" class="hidden card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">⚙️ Ücret Oranları (Saatlik ₺)</h3>
      <p class="text-xs text-slate-400 mb-4">Asgari ücret değiştiğinde bu oranları güncelleyin. Tüm hesaplamalar otomatik adapte olur.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="rates-grid"></div>
      <div class="flex gap-3 mt-4">
        <button id="rates-save" class="btn-primary text-sm">💾 Kaydet</button>
        <button id="rates-cancel" class="btn-secondary text-sm">İptal</button>
      </div>
    </div>` : ''}

    <div id="salary-summary" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in"></div>
    <div id="salary-table" class="fade-in"></div>
    <div id="salary-detail-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"></div>`;

  renderSalarySummary(filteredReport, rates, monthStr);
  renderSalaryTable(filteredReport, rates);

  document.getElementById('salary-month').onchange = () => refreshSalary();
  document.getElementById('salary-dept-filter').onchange = () => refreshSalary();

  if (isAdmin) {
    document.getElementById('salary-rates-btn').onclick = () => toggleRatesPanel(rates);
    document.getElementById('rates-cancel').onclick = () => {
      document.getElementById('salary-rates-panel').classList.add('hidden');
    };
    document.getElementById('rates-save').onclick = () => saveRatesFromPanel();
  }

  function refreshSalary() {
    const m = document.getElementById('salary-month').value;
    const dept = document.getElementById('salary-dept-filter').value;
    let r = getMonthlyReport(m);
    if (isDepartmentRestricted()) r = r.filter(x => x.department === getUserDepartment());
    if (dept) r = r.filter(x => x.department === dept);
    const newRates = getSalaryRates();
    renderSalarySummary(r, newRates, m);
    renderSalaryTable(r, newRates);
  }
}

function renderSalarySummary(report, rates, monthStr) {
  const container = document.getElementById('salary-summary');
  if (!container) return;

  let totalGross = 0, totalNet = 0, totalOvertimeCost = 0, count = 0;
  report.forEach(r => {
    const hourlyRate = rates[r.type] || rates.default;
    const gross = r.totalHours * hourlyRate;
    const overtimeRate = hourlyRate * 1.5;
    const overtimeCost = r.overtimeHours * overtimeRate;
    totalGross += gross;
    totalOvertimeCost += overtimeCost;
    totalNet += calcNetSalary(gross).net;
    count++;
  });

  container.innerHTML = `
    <div class="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-5">
      <p class="text-sm text-emerald-300">💵 Toplam Brüt</p>
      <p class="text-2xl font-bold text-white mt-1">₺${totalGross.toLocaleString('tr-TR')}</p>
      <p class="text-xs text-emerald-400/60 mt-1">${count} personel</p>
    </div>
    <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5">
      <p class="text-sm text-cyan-300">💰 Toplam Net</p>
      <p class="text-2xl font-bold text-white mt-1">₺${totalNet.toLocaleString('tr-TR')}</p>
      <p class="text-xs text-cyan-400/60 mt-1">Kesintiler sonrası</p>
    </div>
    <div class="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5">
      <p class="text-sm text-amber-300">⏰ Fazla Mesai Maliyeti</p>
      <p class="text-2xl font-bold text-white mt-1">₺${totalOvertimeCost.toLocaleString('tr-TR')}</p>
      <p class="text-xs text-amber-400/60 mt-1">%50 zamlı</p>
    </div>
    <div class="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 p-5">
      <p class="text-sm text-purple-300">📊 Ortalama Net</p>
      <p class="text-2xl font-bold text-white mt-1">₺${count ? Math.round(totalNet / count).toLocaleString('tr-TR') : 0}</p>
      <p class="text-xs text-purple-400/60 mt-1">Kişi başı</p>
    </div>`;
}

function renderSalaryTable(report, rates) {
  const container = document.getElementById('salary-table');
  if (!container) return;

  const sorted = [...report].sort((a, b) => {
    const netA = calcNetSalary(a.totalHours * (rates[a.type] || rates.default)).net;
    const netB = calcNetSalary(b.totalHours * (rates[b.type] || rates.default)).net;
    return netB - netA;
  });

  container.innerHTML = `
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">Personel</th>
            <th class="th">Departman</th>
            <th class="th">Profil</th>
            <th class="th text-right">Saat</th>
            <th class="th text-right">Saatlik ₺</th>
            <th class="th text-right">Brüt ₺</th>
            <th class="th text-right">SGK</th>
            <th class="th text-right">Vergi</th>
            <th class="th text-right">Net ₺</th>
            <th class="th">Detay</th>
          </tr></thead>
          <tbody>${sorted.map(r => {
            const hourlyRate = rates[r.type] || rates.default;
            const gross = r.totalHours * hourlyRate;
            const breakdown = calcNetSalary(gross);
            return `<tr class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="td font-medium text-white">${r.name} ${r.surname}</td>
              <td class="td text-xs">${r.department}</td>
              <td class="td text-xs">${r.profileName}</td>
              <td class="td text-right">${r.totalHours.toFixed(1)}</td>
              <td class="td text-right">₺${hourlyRate}</td>
              <td class="td text-right font-medium">₺${breakdown.gross.toLocaleString('tr-TR')}</td>
              <td class="td text-right text-red-400">₺${breakdown.sgk.toLocaleString('tr-TR')}</td>
              <td class="td text-right text-amber-400">₺${breakdown.tax.toLocaleString('tr-TR')}</td>
              <td class="td text-right text-green-400 font-bold">₺${breakdown.net.toLocaleString('tr-TR')}</td>
              <td class="td"><button data-salary-detail="${r.id}" class="text-cyan-400 hover:text-cyan-300 text-xs">📊 Detay</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;

  container.querySelectorAll('[data-salary-detail]').forEach(btn => {
    btn.onclick = () => {
      const pid = parseInt(btn.dataset.salaryDetail);
      const r = report.find(x => x.id === pid);
      if (r) showSalaryDetail(r, rates);
    };
  });
}

function showSalaryDetail(r, rates) {
  const modal = document.getElementById('salary-detail-modal');
  const hourlyRate = rates[r.type] || rates.default;
  const overtimeRate = hourlyRate * 1.5;
  const basePay = (r.totalHours - r.overtimeHours) * hourlyRate;
  const overtimePay = r.overtimeHours * overtimeRate;
  const gross = basePay + overtimePay;
  const breakdown = calcNetSalary(gross);

  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-white">💰 ${r.name} ${r.surname}</h3>
        <button id="salary-detail-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">✕</button>
      </div>
      <div class="space-y-3 text-sm">
        <div class="rounded-xl bg-white/5 p-3">
          <p class="text-xs text-slate-400 mb-2">📋 Çalışma Bilgileri</p>
          <div class="grid grid-cols-2 gap-2">
            <div><span class="text-slate-400">Profil:</span> <span class="text-white">${r.profileName}</span></div>
            <div><span class="text-slate-400">Departman:</span> <span class="text-white">${r.department}</span></div>
            <div><span class="text-slate-400">Toplam Saat:</span> <span class="text-white">${r.totalHours.toFixed(1)}s</span></div>
            <div><span class="text-slate-400">Fazla Mesai:</span> <span class="text-amber-400">${r.overtimeHours.toFixed(1)}s</span></div>
          </div>
        </div>
        <div class="rounded-xl bg-white/5 p-3">
          <p class="text-xs text-slate-400 mb-2">💵 Ücret Hesaplaması</p>
          <div class="space-y-1.5">
            <div class="flex justify-between"><span class="text-slate-400">Normal Mesai (${(r.totalHours - r.overtimeHours).toFixed(1)}s × ₺${hourlyRate})</span><span class="text-white">₺${Math.round(basePay).toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Fazla Mesai (${r.overtimeHours.toFixed(1)}s × ₺${overtimeRate})</span><span class="text-amber-400">₺${Math.round(overtimePay).toLocaleString('tr-TR')}</span></div>
            <div class="border-t border-white/10 pt-1.5 flex justify-between font-medium"><span class="text-white">Brüt Maaş</span><span class="text-white">₺${breakdown.gross.toLocaleString('tr-TR')}</span></div>
          </div>
        </div>
        <div class="rounded-xl bg-red-500/5 border border-red-500/15 p-3">
          <p class="text-xs text-red-400 mb-2">🔻 Kesintiler</p>
          <div class="space-y-1.5">
            <div class="flex justify-between"><span class="text-slate-400">SGK Primi (%15)</span><span class="text-red-400">-₺${breakdown.sgk.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Gelir Vergisi</span><span class="text-red-400">-₺${breakdown.tax.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Damga Vergisi</span><span class="text-red-400">-₺${breakdown.stamp.toLocaleString('tr-TR')}</span></div>
          </div>
        </div>
        <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
          <div class="flex justify-between items-center">
            <span class="text-green-300 font-medium">💰 Net Maaş</span>
            <span class="text-2xl font-bold text-green-400">₺${breakdown.net.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>
    </div>`;

  modal.classList.remove('hidden');
  modal.onclick = (e) => { if (e.target.id === 'salary-detail-modal') modal.classList.add('hidden'); };
  document.getElementById('salary-detail-close').onclick = () => modal.classList.add('hidden');
}

function toggleRatesPanel(rates) {
  const panel = document.getElementById('salary-rates-panel');
  const grid = document.getElementById('rates-grid');
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    const types = Object.entries(PERSONNEL_TYPES);
    grid.innerHTML = `
      <div class="rounded-xl bg-white/5 border border-white/10 p-3">
        <label class="label">Varsayılan Saatlik Ücret (₺)</label>
        <input id="rate-default" type="number" class="input-field w-full" value="${rates.default || 50}" min="1">
      </div>
      ${types.map(([key, t]) => `
        <div class="rounded-xl bg-white/5 border border-white/10 p-3">
          <label class="label">${t.label} (${t.weeklyHours}s/hafta)</label>
          <input id="rate-${key}" type="number" class="input-field w-full" value="${rates[key] || rates.default || 50}" min="1">
        </div>`).join('')}
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
        <label class="label">Fazla Mesai Çarpanı</label>
        <input id="rate-overtime" type="number" class="input-field w-full" value="${rates.overtimeMultiplier || 1.5}" min="1" max="3" step="0.1">
        <p class="text-[10px] text-slate-500 mt-1">Normal ücretin katı (1.5 = %50 zamlı)</p>
      </div>`;
  }
}

function saveRatesFromPanel() {
  const types = Object.keys(PERSONNEL_TYPES);
  const rates = {
    default: parseInt(document.getElementById('rate-default')?.value) || 50,
    overtimeMultiplier: parseFloat(document.getElementById('rate-overtime')?.value) || 1.5,
  };
  types.forEach(key => {
    const val = parseInt(document.getElementById(`rate-${key}`)?.value);
    if (val) rates[key] = val;
  });
  saveSalaryRates(rates);
  showToast('Ücret oranları kaydedildi', 'success');
  document.getElementById('salary-rates-panel').classList.add('hidden');
}
