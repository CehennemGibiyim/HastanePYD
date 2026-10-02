// ===== BORDRO OLUŞTURUCU (PAYSLIP) =====

import { getPersonnel, getMonthlyReport, getSalaryRates, getOvertimeWarnings, PERSONNEL_TYPES, WORK_PROFILES, getDefaultProfileForType } from '../state.js';
import { showToast } from '../notifications.js';
import { createPDF, addPDFHeader, addPDFFooter, addPDFTable, addPDFSummaryCards, downloadPDF, isPDFAvailable } from '../utils/pdf.js';

export function renderPayslipPage(el) {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📄 Bordro Oluşturucu</h1>
      <p class="text-slate-400 text-sm mt-1">Aylık detaylı bordro ve PDF dışa aktarma</p>
    </div>

    <!-- Ay Seçimi -->
    <div class="card mb-6 fade-in">
      <div class="flex flex-wrap items-center gap-4">
        <div>
          <label class="label">Ay Seçin</label>
          <input type="month" id="payslip-month" class="input-field" value="${defaultMonth}">
        </div>
        <div>
          <label class="label">Departman Filtresi</label>
          <select id="payslip-dept" class="input-field">
            <option value="">Tüm Departmanlar</option>
          </select>
        </div>
        <button id="payslip-generate" class="btn-primary mt-5">📄 Bordro Oluştur</button>
        <button id="payslip-export" class="btn-secondary mt-5">📥 CSV İndir</button>
        ${isPDFAvailable() ? '<button id="payslip-pdf" class="btn-secondary mt-5">📑 PDF İndir</button>' : ''}
      </div>
    </div>

    <!-- Bordro Listesi -->
    <div id="payslip-list"></div>`;

  // Populate departments
  const depts = [...new Set(getPersonnel().map(p => p.department))].sort();
  const deptSelect = document.getElementById('payslip-dept');
  depts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d;
    deptSelect.appendChild(opt);
  });

  document.getElementById('payslip-generate').onclick = () => generatePayslips();
  document.getElementById('payslip-export').onclick = () => exportCSV();
  document.getElementById('payslip-pdf')?.addEventListener('click', () => generatePayslipPDF());
  generatePayslips();
}

function generatePayslips() {
  const month = document.getElementById('payslip-month').value;
  const dept = document.getElementById('payslip-dept').value;
  const container = document.getElementById('payslip-list');
  if (!month || !container) return;

  const rates = getSalaryRates();
  const report = getMonthlyReport(month);
  let filtered = [...report];
  if (dept) filtered = filtered.filter(r => r.department === dept);

  const now = new Date();
  const [y, m] = month.split('-').map(Number);
  const monthLabel = new Date(y, m - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
  const workDays = isCurrentMonth ? now.getDate() : new Date(y, m, 0).getDate();

  // Resmi tatiller (basit)
  const holidays = getHolidays(y, m);

  const payslips = filtered.map(r => {
    const hourlyRate = rates[r.type] || rates.default || 50;
    const profile = WORK_PROFILES[r.workProfile] || WORK_PROFILES[getDefaultProfileForType(r.type)];
    const weeklyHours = profile?.weeklyHours || PERSONNEL_TYPES[r.type]?.weeklyHours || 40;

    // Gece vardiyası ek ücreti (22:00-06:00 arası çalışmalar için %25 ek)
    const nightShiftHours = estimateNightHours(r);
    const nightPremium = nightShiftHours * hourlyRate * 0.25;

    // Fazla mesai (normal saatlik ücretin 1.5x)
    const overtimeRate = hourlyRate * (rates.overtimeMultiplier || 1.5);
    const overtimePay = r.overtimeHours * overtimeRate;

    // Resmi tatil çalışması (%50 ek)
    const holidayHours = Math.min(r.totalHours, holidays.length * (weeklyHours / 5));
    const holidayPay = holidayHours * hourlyRate * 0.5;

    // Brüt maaş
    const basePay = r.totalHours * hourlyRate;
    const grossSalary = basePay + overtimePay + nightPremium + holidayPay;

    // Kesintiler
    const sgkEmployee = grossSalary * 0.14; // %14 işçi payı
    const sgkUnemployment = grossSalary * 0.01; // %1 işsizlik
    const totalSGK = sgkEmployee + sgkUnemployment;
    const taxBase = grossSalary - totalSGK;
    const incomeTax = calculateIncomeTax(taxBase);
    const stampTax = grossSalary * 0.00759;
    const totalDeductions = totalSGK + incomeTax + stampTax;

    const netSalary = grossSalary - totalDeductions;

    return {
      ...r,
      hourlyRate,
      basePay: Math.round(basePay * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      nightPremium: Math.round(nightPremium * 100) / 100,
      holidayPay: Math.round(holidayPay * 100) / 100,
      grossSalary: Math.round(grossSalary * 100) / 100,
      sgkEmployee: Math.round(sgkEmployee * 100) / 100,
      sgkUnemployment: Math.round(sgkUnemployment * 100) / 100,
      totalSGK: Math.round(totalSGK * 100) / 100,
      incomeTax: Math.round(incomeTax * 100) / 100,
      stampTax: Math.round(stampTax * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      nightShiftHours,
      holidayHours,
      weeklyHours,
    };
  });

  const totalGross = payslips.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet = payslips.reduce((s, p) => s + p.netSalary, 0);
  const totalSGK = payslips.reduce((s, p) => s + p.totalSGK, 0);

  container.innerHTML = `
    <!-- Özet -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-cyan-300">${payslips.length}</p>
        <p class="text-xs text-cyan-400">Bordro Sayısı</p>
      </div>
      <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
        <p class="text-lg font-bold text-green-300">₺${totalGross.toLocaleString('tr-TR')}</p>
        <p class="text-xs text-green-400">Toplam Brüt</p>
      </div>
      <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
        <p class="text-lg font-bold text-red-300">₺${totalSGK.toLocaleString('tr-TR')}</p>
        <p class="text-xs text-red-400">Toplam SGK + Vergi</p>
      </div>
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
        <p class="text-lg font-bold text-amber-300">₺${totalNet.toLocaleString('tr-TR')}</p>
        <p class="text-xs text-amber-400">Toplam Net</p>
      </div>
    </div>

    <p class="text-sm text-slate-400 mb-4">📅 ${monthLabel} · ${holidays.length} resmi tatil</p>

    <!-- Bordro Tablosu -->
    <div class="card fade-in overflow-x-auto">
      <table class="w-full">
        <thead><tr>
          <th class="th">Personel</th>
          <th class="th">Tür</th>
          <th class="th text-right">Saat Ücreti</th>
          <th class="th text-right">Çalışma</th>
          <th class="th text-right">Fazla Mesai</th>
          <th class="th text-right">Gece Primi</th>
          <th class="th text-right">Brüt</th>
          <th class="th text-right">SGK</th>
          <th class="th text-right">Vergi</th>
          <th class="th text-right">Net</th>
        </tr></thead>
        <tbody>
          ${payslips.map(p => `
            <tr class="border-t border-white/5 hover:bg-white/5 cursor-pointer" data-payslip-id="${p.id}">
              <td class="td font-medium text-white">${p.name} ${p.surname}</td>
              <td class="td text-xs">${PERSONNEL_TYPES[p.type]?.label || p.type}</td>
              <td class="td text-right">₺${p.hourlyRate}</td>
              <td class="td text-right">${p.totalHours}s</td>
              <td class="td text-right ${p.overtimeHours > 0 ? 'text-amber-400' : ''}">${p.overtimeHours > 0 ? '+' + p.overtimeHours + 's' : '-'}</td>
              <td class="td text-right ${p.nightPremium > 0 ? 'text-purple-400' : ''}">${p.nightPremium > 0 ? '₺' + p.nightPremium : '-'}</td>
              <td class="td text-right font-medium text-white">₺${p.grossSalary.toLocaleString('tr-TR')}</td>
              <td class="td text-right text-red-400">₺${p.totalSGK.toLocaleString('tr-TR')}</td>
              <td class="td text-right text-red-400">₺${(p.incomeTax + p.stampTax).toLocaleString('tr-TR')}</td>
              <td class="td text-right font-bold text-green-400">₺${p.netSalary.toLocaleString('tr-TR')}</td>
            </tr>
            <tr class="hidden payslip-detail" id="payslip-detail-${p.id}">
              <td colspan="10" class="p-0">
                <div class="bg-white/5 p-4 mx-4 mb-2 rounded-xl border border-white/5">
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span class="text-slate-500">Haftalık Saat:</span> <span class="text-white">${p.weeklyHours}s</span></div>
                    <div><span class="text-slate-500">Temel Ücret:</span> <span class="text-white">₺${p.basePay}</span></div>
                    <div><span class="text-slate-500">Fazla Mesai Ücreti:</span> <span class="text-amber-400">₺${p.overtimePay}</span></div>
                    <div><span class="text-slate-500">Tatil Ücreti:</span> <span class="text-blue-400">₺${p.holidayPay}</span></div>
                    <div><span class="text-slate-500">SGK İşçi (%14):</span> <span class="text-red-400">₺${p.sgkEmployee}</span></div>
                    <div><span class="text-slate-500">İşsizlik (%1):</span> <span class="text-red-400">₺${p.sgkUnemployment}</span></div>
                    <div><span class="text-slate-500">Gelir Vergisi:</span> <span class="text-red-400">₺${p.incomeTax}</span></div>
                    <div><span class="text-slate-500">Damga Vergisi:</span> <span class="text-red-400">₺${p.stampTax}</span></div>
                  </div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;

  // Toggle detail
  container.querySelectorAll('[data-payslip-id]').forEach(row => {
    row.onclick = () => {
      const detail = document.getElementById(`payslip-detail-${row.dataset.payslipId}`);
      if (detail) detail.classList.toggle('hidden');
    };
  });
}

function calculateIncomeTax(taxable) {
  // 2024 gelir vergisi dilimleri (yıllık)
  const annual = taxable * 12;
  let tax = 0;
  const brackets = [
    { limit: 110000, rate: 0.15 },
    { limit: 230000, rate: 0.20 },
    { limit: 580000, rate: 0.27 },
    { limit: 3000000, rate: 0.35 },
    { limit: Infinity, rate: 0.40 },
  ];
  let remaining = annual;
  let prevLimit = 0;
  for (const b of brackets) {
    const bracketAmount = Math.min(remaining, b.limit - prevLimit);
    if (bracketAmount <= 0) break;
    tax += bracketAmount * b.rate;
    remaining -= bracketAmount;
    prevLimit = b.limit;
  }
  return Math.round((tax / 12) * 100) / 100;
}

function estimateNightHours(report) {
  // Tahmini gece vardiyası saatleri (tam veri yoksa yaklaşık)
  return Math.round(report.totalHours * 0.15 * 10) / 10; // ~%15 gece çalışması
}

function getHolidays(year, month) {
  // Basitleştirilmiş resmi tatiller
  const fixed = [
    `${year}-01-01`, // Yılbaşı
    `${year}-04-23`, // Ulusal Egemenlik
    `${year}-05-01`, // İşçi Bayramı
    `${year}-05-19`, // Gençlik Spor
    `${year}-07-15`, // Demokrasi
    `${year}-08-30`, // Zafer Bayramı
    `${year}-10-29`, // Cumhuriyet
  ];
  return fixed.filter(d => d.startsWith(`${year}-${String(month).padStart(2, '0')}`));
}

function exportCSV() {
  const month = document.getElementById('payslip-month').value;
  const dept = document.getElementById('payslip-dept').value;
  if (!month) return;

  const rates = getSalaryRates();
  const report = getMonthlyReport(month);
  let filtered = [...report];
  if (dept) filtered = filtered.filter(r => r.department === dept);

  const rows = [['Ad Soyad', 'Departman', 'Tür', 'Saatlik Ücret', 'Toplam Saat', 'Fazla Mesai', 'Brüt Maaş', 'SGK', 'Vergi', 'Net Maaş']];
  filtered.forEach(r => {
    const hr = rates[r.type] || rates.default || 50;
    const otPay = r.overtimeHours * hr * 1.5;
    const gross = r.totalHours * hr + otPay;
    const sgk = gross * 0.15;
    const tax = (gross - sgk) * 0.15;
    const net = gross - sgk - tax;
    rows.push([`${r.name} ${r.surname}`, r.department, PERSONNEL_TYPES[r.type]?.label || r.type, hr, r.totalHours.toFixed(1), r.overtimeHours.toFixed(1), gross.toFixed(2), sgk.toFixed(2), tax.toFixed(2), net.toFixed(2)]);
  });

  const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bordo_${month}.csv`;
  a.click();
  showToast('Bordro CSV dosyası indirildi', 'success');
}

// ===== BORDRO PDF =====
function generatePayslipPDF() {
  if (!isPDFAvailable()) { showToast('PDF yuklenemedi', 'error'); return; }
  const month = document.getElementById('payslip-month').value;
  const dept = document.getElementById('payslip-dept').value;
  if (!month) return;

  const rates = getSalaryRates();
  const report = getMonthlyReport(month);
  let filtered = [...report];
  if (dept) filtered = filtered.filter(r => r.department === dept);

  const [y, m] = month.split('-').map(Number);
  const monthLabel = new Date(y, m - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const doc = createPDF('landscape');
  if (!doc) return;
  let startY = addPDFHeader(doc, 'Aylik Bordro Raporu', monthLabel);

  const totalGross = filtered.reduce((s, r) => {
    const hr = rates[r.type] || rates.default || 50;
    return s + r.totalHours * hr;
  }, 0);
  const totalPersonnel = filtered.length;

  startY = addPDFSummaryCards(doc, [
    { value: totalPersonnel, label: 'Personel' },
    { value: Math.round(totalGross) + ' TL', label: 'Toplam Brut' },
    { value: filtered.reduce((s, r) => s + r.overtimeHours, 0).toFixed(1) + 's', label: 'Fazla Mesai' },
  ], startY);

  const headers = ['Ad Soyad', 'Departman', 'Tur', 'Saat Ucreti', 'Toplam Saat', 'Fazla Mesai', 'Brut Maaş', 'SGK', 'Net Maaş'];
  const rows = filtered.map(r => {
    const hr = rates[r.type] || rates.default || 50;
    const otPay = r.overtimeHours * hr * 1.5;
    const gross = r.totalHours * hr + otPay;
    const sgk = gross * 0.15;
    const tax = (gross - sgk) * 0.15;
    const net = gross - sgk - tax;
    return [
      r.name + ' ' + r.surname, r.department,
      PERSONNEL_TYPES[r.type]?.label || r.type,
      hr + ' TL', r.totalHours.toFixed(1) + 's',
      r.overtimeHours > 0 ? '+' + r.overtimeHours.toFixed(1) + 's' : '-',
      Math.round(gross) + ' TL', Math.round(sgk) + ' TL', Math.round(net) + ' TL',
    ];
  });

  addPDFTable(doc, headers, rows, startY);
  addPDFFooter(doc);
  downloadPDF(doc, 'bordro_' + month);
  showToast('Bordro PDF indirildi', 'success');
}
