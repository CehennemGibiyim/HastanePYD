// ===== GELISMIS RAPOR OLUSTURUCU =====
import { getPersonnel, getDepartmentStats, getMonthlyReport, DEPARTMENTS, PERSONNEL_TYPES } from '../state.js';
import { showToast } from '../notifications.js';

export function renderReportBuilderPage(el) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🔧 Gelişmiş Rapor Oluşturucu</h1>
      <p class="text-slate-400 text-sm mt-1">Özel raporlar oluşturun, filtreleyin ve dışa aktarın</p>
    </div>
    <div class="card fade-in mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Rapor Parametreleri</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div><label class="label">Rapor Türü</label><select id="rb-type" class="input-field w-full">
          <option value="department">Departman Bazlı</option>
          <option value="personnel">Personel Bazlı</option>
          <option value="overtime">Fazla Mesai</option>
          <option value="leave">İzin Raporu</option>
          <option value="performance">Performans</option>
          <option value="salary">Maaş Analizi</option>
        </select></div>
        <div><label class="label">Ay</label><input id="rb-month" type="month" class="input-field w-full" value="${currentMonth}"></div>
        <div><label class="label">Departman</label><select id="rb-dept" class="input-field w-full"><option value="">Tümü</option>${DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('')}</select></div>
      </div>
      <div class="flex gap-2">
        <button id="rb-generate" class="btn-primary">📊 Rapor Oluştur</button>
        <button id="rb-csv" class="btn-secondary">📄 CSV İndir</button>
        <button id="rb-pdf" class="btn-secondary">📑 PDF İndir</button>
      </div>
    </div>
    <div id="rb-preview" class="fade-in"></div>`;

  let currentData = [];

  function generateReport() {
    const type = document.getElementById('rb-type').value;
    const month = document.getElementById('rb-month').value;
    const dept = document.getElementById('rb-dept').value;
    const report = getMonthlyReport(month).filter(r => dept ? r.department === dept : true);
    let headers = [], rows = [];

    switch (type) {
      case 'department':
        const stats = {};
        report.forEach(r => {
          if (!stats[r.department]) stats[r.department] = { count: 0, total: 0, overtime: 0, expected: 0 };
          stats[r.department].count++;
          stats[r.department].total += r.totalHours;
          stats[r.department].overtime += r.overtimeHours;
          stats[r.department].expected += r.expectedHours;
        });
        headers = ['Departman', 'Personel', 'Toplam Saat', 'Beklenen', 'Fazla Mesai', 'Verimlilik'];
        rows = Object.entries(stats).map(([d, s]) => [d, s.count, s.total.toFixed(1), s.expected.toFixed(1), s.overtime.toFixed(1), s.expected ? '%' + Math.round(s.total / s.expected * 100) : '-']);
        break;
      case 'personnel':
        headers = ['Ad Soyad', 'Departman', 'Ünvan', 'Toplam Saat', 'Fazla Mesai', 'Beklenen'];
        rows = report.map(r => [r.name + ' ' + r.surname, r.department, r.title, r.totalHours.toFixed(1), r.overtimeHours.toFixed(1), r.expectedHours.toFixed(1)]);
        break;
      case 'overtime':
        headers = ['Ad Soyad', 'Departman', 'Fazla Mesai (s)', 'Toplam Saat', 'Limit Oranı'];
        rows = report.filter(r => r.overtimeHours > 0).sort((a, b) => b.overtimeHours - a.overtimeHours).map(r => [r.name + ' ' + r.surname, r.department, r.overtimeHours.toFixed(1), r.totalHours.toFixed(1), '%' + Math.round(r.overtimeHours / (r.expectedHours || 1) * 100)]);
        break;
      case 'leave':
        const personnel = getPersonnel({ status: 'active' }).filter(p => dept ? p.department === dept : true);
        headers = ['Ad Soyad', 'Departman', 'İzin Hakkı', 'Kullanılan', 'Kalan', 'Kullanım %'];
        rows = personnel.map(p => [p.name + ' ' + p.surname, p.department, p.leaveBalance || 14, p.leaveUsed || 0, (p.leaveBalance || 14) - (p.leaveUsed || 0), '%' + Math.round(((p.leaveUsed || 0) / (p.leaveBalance || 14)) * 100)]);
        break;
      case 'performance':
        headers = ['Ad Soyad', 'Departman', 'Çalışma (s)', 'Fazla Mesai (s)', 'Düzenlilik'];
        rows = report.map(r => [r.name + ' ' + r.surname, r.department, r.totalHours.toFixed(1), r.overtimeHours.toFixed(1), r.status === 'normal' ? '✅ Normal' : r.status === 'overtime' ? '⚠️ Fazla' : '❓ Veri Yok']);
        break;
      case 'salary':
        const rates = { default: 50, worker: 45, officer: 50, nurse: 55, doctor: 80, security: 45, technical: 50, overtimeMultiplier: 1.5 };
        headers = ['Ad Soyad', 'Departman', 'Tür', 'Saatlik Ücret', 'Toplam Ücret', 'Mesai Ücreti'];
        rows = report.map(r => {
          const rate = rates[r.type] || rates.default;
          return [r.name + ' ' + r.surname, r.department, PERSONNEL_TYPES[r.type]?.label || r.type, rate + '₺', Math.round(r.totalHours * rate) + '₺', Math.round(r.overtimeHours * rate * rates.overtimeMultiplier) + '₺'];
        });
        break;
    }
    currentData = { headers, rows, type, month, dept };
    const preview = document.getElementById('rb-preview');
    preview.innerHTML = `
      <div class="card fade-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">📊 ${type.charAt(0).toUpperCase() + type.slice(1)} Raporu - ${month}</h3>
          <span class="badge">${rows.length} kayıt</span>
        </div>
        <div class="overflow-x-auto"><table class="w-full">
          <thead><tr>${headers.map(h => `<th class="th">${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td class="td">${c}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>
      </div>`;
    showToast(rows.length + ' kayıt raporlandı', 'success');
  }

  document.getElementById('rb-generate').onclick = generateReport;
  document.getElementById('rb-csv').onclick = () => {
    if (!currentData.rows?.length) { showToast('Önce rapor oluşturun', 'error'); return; }
    const csv = [currentData.headers.join(','), ...currentData.rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rapor_${currentData.type}_${currentData.month}.csv`; a.click();
    URL.revokeObjectURL(url); showToast('CSV indirildi', 'success');
  };
  document.getElementById('rb-pdf').onclick = () => {
    if (!currentData.rows?.length) { showToast('Önce rapor oluşturun', 'error'); return; }
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: currentData.headers.length > 5 ? 'landscape' : 'portrait' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Hastane PYS - ' + currentData.type.charAt(0).toUpperCase() + currentData.type.slice(1) + ' Raporu', 14, 20);
      doc.setFontSize(10);
      doc.text('Dönem: ' + currentData.month + ' | Kayıt: ' + currentData.rows.length, 14, 28);
      doc.autoTable({ head: [currentData.headers], body: currentData.rows, startY: 35, styles: { fontSize: 8 } });
      doc.save('rapor_' + currentData.type + '_' + currentData.month + '.pdf');
      showToast('PDF indirildi', 'success');
    } catch (e) { showToast('PDF oluşturulamadı: ' + e.message, 'error'); }
  };
}
