// ===== BORDRO & MAAS HESAPLAMA =====
import { getPersonnel } from '../state.js';

const TAX_BRACKETS = [
  { limit: 110000, rate: 0.15 },
  { limit: 230000, rate: 0.20 },
  { limit: 580000, rate: 0.27 },
  { limit: 3000000, rate: 0.35 },
  { limit: Infinity, rate: 0.40 },
];

const SGK_EMPLOYEE = 0.14;
const SGK_UNEMPLOYMENT = 0.01;
const STAMP_TAX = 0.00759;

function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_payroll') || '{}'); } catch { return {}; }
}
function setStorage(d) { localStorage.setItem('hospital_payroll', JSON.stringify(d)); }

function calcPayroll(gross, mealAllowance = 0, transportAllowance = 0) {
  const sgk = Math.round(gross * SGK_EMPLOYEE);
  const unemployment = Math.round(gross * SGK_UNEMPLOYMENT);
  const sgkTotal = sgk + unemployment;
  const exemptMeal = Math.min(mealAllowance, 120 * 30);
  const exemptTransport = Math.min(transportAllowance, 116 * 30);
  const taxableIncome = gross - sgkTotal - exemptMeal - exemptTransport;
  let remainingTaxable = Math.max(0, taxableIncome);
  let totalTax = 0;
  let prevLimit = 0;
  for (const bracket of TAX_BRACKETS) {
    const taxableInBracket = Math.min(remainingTaxable, bracket.limit - prevLimit);
    if (taxableInBracket <= 0) break;
    totalTax += taxableInBracket * bracket.rate;
    remainingTaxable -= taxableInBracket;
    prevLimit = bracket.limit;
  }
  const stampTax = Math.round(gross * STAMP_TAX);
  const totalDeduction = sgkTotal + Math.round(totalTax) + stampTax;
  const net = gross - totalDeduction + exemptMeal + exemptTransport;
  return {
    gross, sgk, unemployment, sgkTotal,
    incomeTax: Math.round(totalTax), stampTax,
    totalDeduction, net,
    mealAllowance: exemptMeal, transportAllowance: exemptTransport,
    effectiveTaxRate: gross > 0 ? ((totalDeduction / gross) * 100).toFixed(1) : '0',
  };
}

export function renderPayrollPage(el) {
  const personnel = getPersonnel({}).filter(p => p.status === 'active');
  const saved = getStorage();
  const selectedId = saved.selectedId || (personnel[0]?.id ?? null);
  const sel = personnel.find(p => p.id === selectedId) || personnel[0];
  const gross = saved.gross || sel?.grossSalary || 25000;
  const meal = saved.meal || 0;
  const transport = saved.transport || 0;
  const result = calcPayroll(gross, meal, transport);
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">💰 Bordro & Maaş Hesaplama</h1>
      <p class="text-slate-400 text-sm mt-1">Brüt-net hesaplama, kesintiler ve yan haklar</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
      <!-- Sol Panel: Girdiler -->
      <div class="card lg:col-span-1">
        <h3 class="text-lg font-semibold text-white mb-4">📋 Hesaplama Parametreleri</h3>
        <div class="space-y-4">
          <div>
            <label class="label">Personel Seç</label>
            <select id="payroll-person" class="input-field w-full">
              ${personnel.map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name} ${p.surname} — ${p.title}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="label">Brüt Maaş (₺)</label>
            <input id="payroll-gross" type="number" class="input-field w-full" value="${gross}" min="0">
          </div>
          <div>
            <label class="label">Yemek Yardımı (₺/ay)</label>
            <input id="payroll-meal" type="number" class="input-field w-full" value="${meal}" min="0">
          </div>
          <div>
            <label class="label">Ulaşım Yardımı (₺/ay)</label>
            <input id="payroll-transport" type="number" class="input-field w-full" value="${transport}" min="0">
          </div>
          <div>
            <label class="label">Dönem</label>
            <select id="payroll-month" class="input-field w-full">
              ${months.map((m, i) => `<option value="${i}" ${i === new Date().getMonth() ? 'selected' : ''}>${m} ${new Date().getFullYear()}</option>`).join('')}
            </select>
          </div>
          <button id="payroll-calc" class="btn-primary w-full">💰 Hesapla</button>
          <button id="payroll-export" class="btn-secondary w-full">📄 PDF Bordro İndir</button>
        </div>

        <!-- Vergi Dilimleri Bilgi -->
        <div class="mt-6 pt-4 border-t border-white/10">
          <p class="text-xs font-semibold text-slate-400 mb-2">📊 2025 Vergi Dilimleri</p>
          <div class="space-y-1">
            ${TAX_BRACKETS.map((b, i) => {
              const prev = i > 0 ? TAX_BRACKETS[i-1].limit : 0;
              const label = b.limit === Infinity ? `${(prev/1000).toFixed(0)}K+` : `${(prev/1000).toFixed(0)}K-${(b.limit/1000).toFixed(0)}K`;
              return `<div class="flex items-center justify-between text-xs">
                <span class="text-slate-400">${label}</span>
                <span class="text-cyan-300 font-medium">%${(b.rate*100).toFixed(0)}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Orta Panel: Sonuçlar -->
      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">📊 Bordro Sonucu</h3>
          <span class="badge">${sel ? sel.name + ' ' + sel.surname : ''}</span>
        </div>

        <!-- Net Maaş Büyük Kart -->
        <div class="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-6 mb-6 text-center">
          <p class="text-sm text-emerald-300 mb-1">Net Maaş</p>
          <p class="text-4xl font-bold text-white">₺${result.net.toLocaleString('tr-TR')}</p>
          <p class="text-xs text-emerald-400/60 mt-1">Efektif Vergi Oranı: %${result.effectiveTaxRate}</p>
        </div>

        <!-- Detay Tablosu -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="space-y-3">
            <h4 class="text-sm font-semibold text-green-400">➕ Eklemeler</h4>
            <div class="flex justify-between text-sm"><span class="text-slate-400">Brüt Maaş</span><span class="text-white font-medium">₺${result.gross.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-400">Yemek Yardımı</span><span class="text-white">₺${result.mealAllowance.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-400">Ulaşım Yardımı</span><span class="text-white">₺${result.transportAllowance.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between text-sm border-t border-white/10 pt-2"><span class="text-slate-300 font-medium">Toplam Gelir</span><span class="text-green-400 font-bold">₺${(result.gross + result.mealAllowance + result.transportAllowance).toLocaleString('tr-TR')}</span></div>
          </div>
          <div class="space-y-3">
            <h4 class="text-sm font-semibold text-red-400">➖ Kesintiler</h4>
            <div class="flex justify-between text-sm"><span class="text-slate-400">SGK Primi (%14)</span><span class="text-white">₺${result.sgk.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-400">İşsizlik Sig. (%1)</span><span class="text-white">₺${result.unemployment.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-400">Gelir Vergisi</span><span class="text-white">₺${result.incomeTax.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-400">Damga Vergisi</span><span class="text-white">₺${result.stampTax.toLocaleString('tr-TR')}</span></div>
            <div class="flex justify-between text-sm border-t border-white/10 pt-2"><span class="text-slate-300 font-medium">Toplam Kesinti</span><span class="text-red-400 font-bold">₺${result.totalDeduction.toLocaleString('tr-TR')}</span></div>
          </div>
        </div>

        <!-- SGK İşveren Maliyeti -->
        <div class="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
          <h4 class="text-sm font-semibold text-amber-400 mb-3">🏢 İşveren Maliyeti</h4>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div>
              <p class="text-xs text-slate-400">SGK İşveren (%15.5)</p>
              <p class="text-lg font-bold text-white">₺${Math.round(gross * 0.155).toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">İşveren İşsizlik (%2)</p>
              <p class="text-lg font-bold text-white">₺${Math.round(gross * 0.02).toLocaleString('tr-TR')}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400">Toplam İşveren Maliyeti</p>
              <p class="text-lg font-bold text-amber-300">₺${Math.round(gross * 1.175).toLocaleString('tr-TR')}</p>
            </div>
          </div>
        </div>

        <!-- Grafik -->
        <div class="rounded-xl bg-white/5 border border-white/10 p-4">
          <h4 class="text-sm font-semibold text-white mb-3">📈 Maaş Dağılım Grafiği</h4>
          <div class="h-8 rounded-full overflow-hidden flex">
            <div class="bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white" style="width:${(result.net / (result.gross + result.mealAllowance + result.transportAllowance) * 100).toFixed(0)}%">Net %${(result.net / (result.gross + result.mealAllowance + result.transportAllowance) * 100).toFixed(0)}</div>
            <div class="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white" style="width:${(result.totalDeduction / (result.gross + result.mealAllowance + result.transportAllowance) * 100).toFixed(0)}%">Kesinti %${(result.totalDeduction / (result.gross + result.mealAllowance + result.transportAllowance) * 100).toFixed(0)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toplu Maaş Tablosu -->
    <div class="card mt-6 fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">👥 Toplu Maaş Görüntüleme</h3>
        <button id="payroll-bulk-export" class="btn-secondary text-xs">📊 Toplu CSV</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr>
            <th class="th">Personel</th>
            <th class="th">Departman</th>
            <th class="th">Brüt</th>
            <th class="th">SGK</th>
            <th class="th">Vergi</th>
            <th class="th">Net</th>
            <th class="th">İşveren Maliyeti</th>
          </tr></thead>
          <tbody>
            ${personnel.map(p => {
              const sal = p.grossSalary || 25000;
              const r = calcPayroll(sal);
              return `<tr class="border-t border-white/5 hover:bg-white/5">
                <td class="td font-medium text-white">${p.name} ${p.surname}</td>
                <td class="td">${p.department}</td>
                <td class="td">₺${sal.toLocaleString('tr-TR')}</td>
                <td class="td text-red-300">₺${r.sgkTotal.toLocaleString('tr-TR')}</td>
                <td class="td text-red-300">₺${(r.incomeTax + r.stampTax).toLocaleString('tr-TR')}</td>
                <td class="td text-green-300 font-medium">₺${r.net.toLocaleString('tr-TR')}</td>
                <td class="td text-amber-300">₺${Math.round(sal * 1.175).toLocaleString('tr-TR')}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  // Event listeners
  const calcBtn = document.getElementById('payroll-calc');
  const saveAndRecalc = () => {
    setStorage({
      selectedId: parseInt(document.getElementById('payroll-person').value),
      gross: parseInt(document.getElementById('payroll-gross').value) || 0,
      meal: parseInt(document.getElementById('payroll-meal').value) || 0,
      transport: parseInt(document.getElementById('payroll-transport').value) || 0,
    });
    renderPayrollPage(el);
  };
  calcBtn?.addEventListener('click', saveAndRecalc);
  document.getElementById('payroll-export')?.addEventListener('click', () => {
    const csv = ['Personel,Brüt,SGK,Vergi,Net,İşveren Maliyeti'];
    personnel.forEach(p => {
      const s = p.grossSalary || 25000;
      const r = calcPayroll(s);
      csv.push(`${p.name} ${p.surname},${s},${r.sgkTotal},${r.incomeTax + r.stampTax},${r.net},${Math.round(s * 1.175)}`);
    });
    downloadCSV(csv.join('\n'), 'bordro_raporu.csv');
  });
  document.getElementById('payroll-bulk-export')?.addEventListener('click', () => {
    const csv = ['Sicil,Ad Soyad,Departman,Unvan,Brüt,SGK İşçi,İşsizlik,Gelir Vergisi,Damga Vergisi,Toplam Kesinti,Net'];
    personnel.forEach(p => {
      const s = p.grossSalary || 25000;
      const r = calcPayroll(s);
      csv.push(`${p.id},${p.name} ${p.surname},${p.department},${p.title},${s},${r.sgk},${r.unemployment},${r.incomeTax},${r.stampTax},${r.totalDeduction},${r.net}`);
    });
    downloadCSV(csv.join('\n'), 'toplu_bordro.csv');
  });
}

function downloadCSV(content, filename) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
