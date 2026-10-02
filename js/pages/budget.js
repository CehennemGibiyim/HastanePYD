// ===== DEPARTMAN BUTCESI & FAZLA MESAI LIMITI =====
import { getDepartmentCosts, getDepartmentBudget, saveDepartmentBudget, checkOvertimeBudget, saveOvertimeBudget } from '../state-extensions.js';
import { getDepartments, getMonthlyReport } from '../state.js';
import { showToast } from '../notifications.js';

export function renderBudgetPage(el) {
  const now = new Date();
  const month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const depts = getDepartments();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Departman Bütçesi</h1>
      <p class="text-slate-400 text-sm mt-1">Departman bazlı maliyet ve fazla mesai bütçe takibi</p>
    </div>
    <div class="flex flex-wrap gap-3 mb-6 fade-in">
      <input type="month" id="budget-month" class="input-field" value="${month}">
      <button id="budget-refresh" class="btn-primary text-sm">🔄 Güncelle</button>
    </div>
    <div id="budget-content" class="fade-in"></div>`;

  renderBudgetContent(month);

  document.getElementById('budget-month').onchange = () => renderBudgetContent(document.getElementById('budget-month').value);
  document.getElementById('budget-refresh').onclick = () => renderBudgetContent(document.getElementById('budget-month').value);
}

function renderBudgetContent(month) {
  const container = document.getElementById('budget-content');
  const depts = getDepartments();
  let totalCost = 0, totalSalary = 0, totalOvertime = 0;

  const rows = depts.map(dept => {
    const costs = getDepartmentCosts(dept, month);
    const budget = getDepartmentBudget(dept, month);
    const otCheck = checkOvertimeBudget(dept, month);
    totalCost += costs.totalCost;
    totalSalary += costs.totalSalary;
    totalOvertime += costs.totalOvertimeCost;
    return { dept, costs, budget, otCheck };
  }).filter(r => r.costs.personnelCount > 0);

  container.innerHTML = `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-cyan-300">₺${totalCost.toLocaleString('tr-TR')}</p>
        <p class="text-xs text-cyan-400">Toplam Maliyet</p>
      </div>
      <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-blue-300">₺${totalSalary.toLocaleString('tr-TR')}</p>
        <p class="text-xs text-blue-400">Maaş Maliyeti</p>
      </div>
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-amber-300">₺${totalOvertime.toLocaleString('tr-TR')}</p>
        <p class="text-xs text-amber-400">Fazla Mesai Maliyeti</p>
      </div>
      <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-purple-300">${rows.length}</p>
        <p class="text-xs text-purple-400">Aktif Departman</p>
      </div>
    </div>
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">Departman</th>
            <th class="th">Personel</th>
            <th class="th">Toplam Maliyet</th>
            <th class="th">Maaş</th>
            <th class="th">Fazla Mesai</th>
            <th class="th">Mesai Limiti</th>
            <th class="th">Kullanım</th>
            <th class="th">İşlem</th>
          </tr></thead>
          <tbody>
            ${rows.map(r => {
              const pctColor = r.otCheck.percentUsed > 100 ? 'text-red-400' : r.otCheck.percentUsed > 80 ? 'text-amber-400' : 'text-emerald-400';
              return `<tr class="border-b border-white/5 hover:bg-white/5">
                <td class="td font-medium text-white">${r.dept}</td>
                <td class="td">${r.costs.personnelCount}</td>
                <td class="td font-medium text-cyan-300">₺${r.costs.totalCost.toLocaleString('tr-TR')}</td>
                <td class="td">₺${r.costs.totalSalary.toLocaleString('tr-TR')}</td>
                <td class="td text-amber-300">₺${r.costs.totalOvertimeCost.toLocaleString('tr-TR')}</td>
                <td class="td">${r.otCheck.limitHours}s</td>
                <td class="td"><span class="${pctColor} font-bold">${r.otCheck.percentUsed}%</span> <span class="text-xs text-slate-500">(${r.otCheck.usedHours}s)</span></td>
                <td class="td"><button data-edit-budget="${r.dept}" class="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/10">⚙️</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  document.querySelectorAll('[data-edit-budget]').forEach(btn => {
    btn.onclick = () => openBudgetModal(btn.dataset.editBudget, month);
  });
}

function openBudgetModal(dept, month) {
  const budget = getDepartmentBudget(dept, month);
  const ot = checkOvertimeBudget(dept, month);
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-lg font-bold text-white mb-4">⚙️ ${dept} Bütçesi</h3>
      <p class="text-xs text-slate-400 mb-4">${month} dönemi</p>
      <div class="space-y-3">
        <div>
          <label class="label">Aylık Mesai Limiti (saat)</label>
          <input id="ot-limit" type="number" class="input-field w-full" value="${budget.overtimeLimit || 200}">
        </div>
        <div>
          <label class="label">Notlar</label>
          <input id="ot-notes" class="input-field w-full" value="${budget.notes || ''}" placeholder="Bütçe notu...">
        </div>
        <div class="rounded-lg bg-white/5 p-3 text-xs text-slate-400">
          <p>Kullanılan mesai: <strong class="text-white">${ot.usedHours}s</strong> / ${ot.limitHours}s</p>
          <p>Kullanım oranı: <strong class="${ot.exceeded ? 'text-red-400' : 'text-emerald-400'}">${ot.percentUsed}%</strong></p>
        </div>
      </div>
      <div class="flex gap-3 mt-5">
        <button id="budget-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="budget-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.getElementById('budget-cancel').onclick = () => modal.remove();
  document.getElementById('budget-save').onclick = () => {
    saveDepartmentBudget({ department: dept, month, overtimeLimit: parseInt(document.getElementById('ot-limit').value) || 200, notes: document.getElementById('ot-notes').value });
    modal.remove();
    showToast('Bütçe güncellendi', 'success');
    renderBudgetContent(month);
  };
}
