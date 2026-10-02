// ===== RAPORLAMA MERKEZİ SAYFASI =====

import {
  getPersonnel, getMonthlyReport, getAttendance, getSchedules,
  getCurrentUser, isDepartmentRestricted, getUserDepartment,
  getDepartments, PERSONNEL_TYPES, getPersonnelById,
  getLeaveRecords,
} from '../state.js';
import { showToast } from '../notifications.js';
import { createPDF, addPDFHeader, addPDFFooter, addPDFTable, addPDFSummaryCards, downloadPDF, isPDFAvailable } from '../utils/pdf.js';
import { exportSchedulesToICal } from '../utils/ical.js';

export function renderReportsPage(el) {
  const user = getCurrentUser();
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Raporlama Merkezi</h1>
      <p class="text-slate-400 text-sm mt-1">Detaylı raporlar, QR kodlar ve dışa aktarma</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 fade-in">
      <button data-report="personnel-list" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">👥</p>
        <p class="text-sm font-medium text-white">Personel Listesi</p>
        <p class="text-xs text-slate-400">CSV / Yazdır</p>
      </button>
      <button data-report="attendance-report" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">⏰</p>
        <p class="text-sm font-medium text-white">Puantaj Raporu</p>
        <p class="text-xs text-slate-400">Aylık detay</p>
      </button>
      <button data-report="schedule-report" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">📅</p>
        <p class="text-sm font-medium text-white">Nöbet Raporu</p>
        <p class="text-xs text-slate-400">Vardiya dağılımı</p>
      </button>
      <button data-report="qr-cards" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">🏷️</p>
        <p class="text-sm font-medium text-white">QR Kartları</p>
        <p class="text-xs text-slate-400">Personel kimlik</p>
      </button>
      <button data-report="overtime-report" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">⚠️</p>
        <p class="text-sm font-medium text-white">Fazla Mesai Raporu</p>
        <p class="text-xs text-slate-400">Limit aşım analizi</p>
      </button>
      <button data-report="leave-report" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">🏖️</p>
        <p class="text-sm font-medium text-white">İzin Raporu</p>
        <p class="text-xs text-slate-400">İzin bakiye takibi</p>
      </button>
      <button data-report="department-report" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">🏢</p>
        <p class="text-sm font-medium text-white">Departman Raporu</p>
        <p class="text-xs text-slate-400">Karşılaştırmalı</p>
      </button>
      <button data-report="contact-list" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">📞</p>
        <p class="text-sm font-medium text-white">İletişim Listesi</p>
        <p class="text-xs text-slate-400">Telefon rehberi</p>
      </button>
      <button data-report="schedule-ical" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-2">📅</p>
        <p class="text-sm font-medium text-white">iCal Takvim</p>
        <p class="text-xs text-slate-400">Google Calendar</p>
      </button>
      ${isPDFAvailable() ? `<button data-report="all-pdf" class="card hover:bg-white/10 transition text-center cursor-pointer border-cyan-500/30">
        <p class="text-3xl mb-2">📑</p>
        <p class="text-sm font-medium text-white">Toplu PDF</p>
        <p class="text-xs text-slate-400">Tüm raporlar</p>
      </button>` : ''}
    </div>

    <div id="report-output" class="fade-in"></div>
    <div id="qr-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"></div>`;

  document.querySelectorAll('[data-report]').forEach(btn => {
    btn.onclick = () => generateReport(btn.dataset.report);
  });

  function generateReport(type) {
    const output = document.getElementById('report-output');
    let personnel = getPersonnel({ status: 'active' });
    if (isDepartmentRestricted()) personnel = personnel.filter(p => p.department === getUserDepartment());

    switch (type) {
      case 'personnel-list': generatePersonnelCSV(personnel); break;
      case 'attendance-report': generateAttendanceReport(output, personnel, monthStr); break;
      case 'schedule-report': generateScheduleReport(output, personnel, monthStr); break;
      case 'qr-cards': generateQRCards(output, personnel); break;
      case 'overtime-report': generateOvertimeReport(output, personnel, monthStr); break;
      case 'leave-report': generateLeaveReport(output, personnel); break;
      case 'department-report': generateDeptReport(output, personnel, monthStr); break;
      case 'contact-list': generateContactCSV(personnel); break;
      case 'schedule-ical': generateScheduleICal(personnel, monthStr); break;
      case 'all-pdf': generateAllPDF(personnel, monthStr); break;
    }
  }
}

function generatePersonnelCSV(personnel) {
  const headers = ['ID', 'Ad', 'Soyad', 'TC', 'Telefon', 'E-posta', 'Departman', 'Tür', 'Görev', 'Başlangıç'];
  const rows = personnel.map(p => [p.id, p.name, p.surname, p.tc, p.phone, p.email || '', p.department, PERSONNEL_TYPES[p.type]?.label || p.type, p.title, p.startDate]);
  downloadCSV([headers, ...rows], 'personel_listesi');
  showToast('Personel listesi indirildi', 'success');
}

function generateContactCSV(personnel) {
  const headers = ['Ad Soyad', 'Telefon', 'E-posta', 'Departman', 'Görev'];
  const rows = personnel.map(p => [`${p.name} ${p.surname}`, p.phone, p.email || '', p.department, p.title]);
  downloadCSV([headers, ...rows], 'iletisim_listesi');
  showToast('İletişim listesi indirildi', 'success');
}

function generateAttendanceReport(container, personnel, monthStr) {
  const report = getMonthlyReport(monthStr);
  const filtered = report.filter(r => personnel.some(p => p.id === r.id));

  container.innerHTML = `
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">⏰ Puantaj Raporu - ${monthStr}</h3>
        <button id="att-csv" class="btn-secondary text-sm">📥 CSV İndir</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">Personel</th><th class="th">Departman</th><th class="th">Profil</th>
            <th class="th text-right">Toplam Saat</th><th class="th text-right">Beklenen</th>
            <th class="th text-right">Fazla Mesai</th><th class="th text-right">Nöbet Puantaj</th>
          </tr></thead>
          <tbody>${filtered.map(r => `<tr class="border-b border-white/5">
            <td class="td font-medium text-white">${r.name} ${r.surname}</td>
            <td class="td text-xs">${r.department}</td>
            <td class="td text-xs">${r.profileName}</td>
            <td class="td text-right">${r.totalHours.toFixed(1)}</td>
            <td class="td text-right">${r.expectedHours.toFixed(1)}</td>
            <td class="td text-right ${r.overtimeHours > 0 ? 'text-amber-400' : ''}">${r.overtimeHours.toFixed(1)}</td>
            <td class="td text-right">${r.scheduleHours.toFixed(1)}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;

  document.getElementById('att-csv').onclick = () => {
    const headers = ['Personel', 'Departman', 'Profil', 'Toplam Saat', 'Beklenen', 'Fazla Mesai'];
    const rows = filtered.map(r => [`${r.name} ${r.surname}`, r.department, r.profileName, r.totalHours.toFixed(1), r.expectedHours.toFixed(1), r.overtimeHours.toFixed(1)]);
    downloadCSV([headers, ...rows], 'puantaj_raporu');
  };
}

function generateScheduleReport(container, personnel, monthStr) {
  const schedules = getSchedules({ month: monthStr });
  const personIds = new Set(personnel.map(p => p.id));
  const filtered = schedules.filter(s => personIds.has(s.personnelId));

  const byType = {};
  filtered.forEach(s => { byType[s.type] = (byType[s.type] || 0) + 1; });

  container.innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">📅 Nöbet Raporu - ${monthStr}</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        ${Object.entries(byType).map(([type, count]) => `
          <div class="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p class="text-xl font-bold text-white">${count}</p>
            <p class="text-xs text-slate-400">${type === 'nurse' ? '👩‍⚕️ Hemşire' : type === 'doctor' ? '🩺 Doktor' : type === 'security' ? '🛡️ Güvenlik' : '🧹 Temizlik'}</p>
          </div>`).join('')}
      </div>
      <p class="text-sm text-slate-400">Toplam ${filtered.length} nöbet kaydı</p>
    </div>`;
}

function generateQRCards(container, personnel) {
  container.innerHTML = `
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">🏷️ QR Kod Kartları</h3>
        <button id="qr-print" class="btn-secondary text-sm">🖨️ Yazdır</button>
      </div>
      <div id="qr-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
    </div>`;

  const grid = document.getElementById('qr-grid');
  personnel.forEach(p => {
    const card = document.createElement('div');
    card.className = 'rounded-xl bg-white/5 border border-white/10 p-4 text-center';
    const qrData = JSON.stringify({ id: p.id, name: `${p.name} ${p.surname}`, dept: p.department, title: p.title, phone: p.phone });
    card.innerHTML = `
      <canvas id="qr-${p.id}" class="mx-auto mb-2"></canvas>
      <svg id="bc-${p.id}" class="mx-auto mb-2" style="max-width:120px"></svg>
      <p class="text-xs font-medium text-white">${p.name} ${p.surname}</p>
      <p class="text-[10px] text-slate-400">${p.department}</p>
      <p class="text-[10px] text-slate-500">${p.title}</p>`;
    grid.appendChild(card);

    setTimeout(() => {
      const canvas = document.getElementById(`qr-${p.id}`);
      if (canvas && typeof qrcode !== 'undefined') {
        try {
          const qr = qrcode(0, 'M');
          qr.addData(qrData);
          qr.make();
          const ctx = canvas.getContext('2d');
          const cellSize = 3;
          const margin = 4;
          const moduleCount = qr.getModuleCount();
          const size = moduleCount * cellSize + margin * 2;
          canvas.width = size;
          canvas.height = size;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = '#f1f5f9';
          for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
              if (qr.isDark(row, col)) {
                ctx.fillRect(col * cellSize + margin, row * cellSize + margin, cellSize, cellSize);
              }
            }
          }
        } catch (e) { /* QR generation failed */ }
      }
      // Barkod olustur
      if (typeof JsBarcode !== 'undefined') {
        try {
          JsBarcode('#bc-' + p.id, String(p.id).padStart(6, '0'), {
            format: 'CODE128', width: 1.5, height: 30, fontSize: 10,
            margin: 2, displayValue: true, background: 'transparent', lineColor: '#94a3b8',
          });
        } catch (e) { /* Barcode generation failed */ }
      }
    }, 100);
  });

  document.getElementById('qr-print').onclick = () => window.print();
}

function generateOvertimeReport(container, personnel, monthStr) {
  const report = getMonthlyReport(monthStr);
  const withOvertime = report.filter(r => r.overtimeHours > 0).sort((a, b) => b.overtimeHours - a.overtimeHours);

  container.innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">⚠️ Fazla Mesai Raporu - ${monthStr}</h3>
      ${withOvertime.length ? `
        <div class="space-y-2">
          ${withOvertime.map(r => {
            const profile = PERSONNEL_TYPES[r.type];
            const weeklyLimit = profile?.weeklyHours || 40;
            const monthlyLimit = weeklyLimit * 4.33;
            const severity = r.totalHours > monthlyLimit * 1.2 ? 'critical' : r.totalHours > monthlyLimit ? 'warning' : 'normal';
            return `<div class="card flex items-center gap-3 ${severity === 'critical' ? 'border-red-500/30' : severity === 'warning' ? 'border-amber-500/30' : ''}">
              <div class="w-10 h-10 rounded-xl ${severity === 'critical' ? 'bg-red-500/20' : 'bg-amber-500/20'} flex items-center justify-center text-lg shrink-0">${severity === 'critical' ? '🔴' : '🟡'}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white">${r.name} ${r.surname}</p>
                <p class="text-xs text-slate-400">${r.department} · ${r.profileName}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-lg font-bold ${severity === 'critical' ? 'text-red-400' : 'text-amber-400'}">${r.overtimeHours.toFixed(1)}s</p>
                <p class="text-[10px] text-slate-500">/ ${Math.round(monthlyLimit)}s limit</p>
              </div>
            </div>`;
          }).join('')}
        </div>` : '<div class="text-center py-8 text-slate-500">Fazla mesai kaydı yok</div>'}
    </div>`;
}

function generateLeaveReport(container, personnel) {
  container.innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">🏖️ İzin Raporu</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">Personel</th><th class="th">Departman</th>
            <th class="th text-right">Toplam Hak</th><th class="th text-right">Kullanılan</th>
            <th class="th text-right">Kalan</th><th class="th text-right">Kullanım %</th>
          </tr></thead>
          <tbody>${personnel.sort((a, b) => (b.leaveUsed || 0) / (b.leaveBalance || 14) - (a.leaveUsed || 0) / (a.leaveBalance || 14)).map(p => {
            const total = p.leaveBalance || 14;
            const used = p.leaveUsed || 0;
            const remaining = total - used;
            const pct = Math.round((used / total) * 100);
            return `<tr class="border-b border-white/5">
              <td class="td font-medium text-white">${p.name} ${p.surname}</td>
              <td class="td text-xs">${p.department}</td>
              <td class="td text-right">${total}</td>
              <td class="td text-right text-amber-400">${used}</td>
              <td class="td text-right text-green-400">${remaining}</td>
              <td class="td text-right"><div class="flex items-center gap-2 justify-end"><div class="w-16 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full ${pct > 70 ? 'bg-red-400' : pct > 40 ? 'bg-amber-400' : 'bg-green-400'}" style="width:${pct}%"></div></div><span class="text-xs">${pct}%</span></div></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
}

function generateDeptReport(container, personnel, monthStr) {
  const report = getMonthlyReport(monthStr);
  const depts = {};
  report.forEach(r => {
    if (!depts[r.department]) depts[r.department] = { total: 0, overtime: 0, count: 0 };
    depts[r.department].total += r.totalHours;
    depts[r.department].overtime += r.overtimeHours;
    depts[r.department].count++;
  });

  container.innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Raporu - ${monthStr}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${Object.entries(depts).sort((a, b) => b[1].total - a[1].total).map(([dept, d]) => `
          <div class="rounded-xl bg-white/5 border border-white/10 p-4">
            <p class="text-sm font-medium text-white mb-2">${dept}</p>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between"><span class="text-slate-400">Personel</span><span class="text-white">${d.count}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Toplam Saat</span><span class="text-white">${d.total.toFixed(0)}s</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Ortalama</span><span class="text-cyan-400">${(d.total / d.count).toFixed(1)}s</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Fazla Mesai</span><span class="text-amber-400">${d.overtime.toFixed(1)}s</span></div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function downloadCSV(data, filename) {
  const BOM = '\uFEFF';
  const csv = BOM + data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// ===== ICAL DISA AKTARMA =====
function generateScheduleICal(personnel, monthStr) {
  const schedules = getSchedules({ month: monthStr });
  const personIds = new Set(personnel.map(p => p.id));
  const filtered = schedules.filter(s => personIds.has(s.personnelId));
  const personnelMap = {};
  personnel.forEach(p => { personnelMap[p.id] = p; });
  exportSchedulesToICal(filtered, personnelMap, 'nobet_takvimi_' + monthStr);
  showToast('iCal dosyasi indirildi - Google Calendar\'a aktarabilirsiniz', 'success');
}

// ===== TOPLU PDF RAPOR =====
function generateAllPDF(personnel, monthStr) {
  if (!isPDFAvailable()) {
    showToast('PDF kutuphanesi yuklenemedi', 'error');
    return;
  }
  const report = getMonthlyReport(monthStr);
  const filtered = report.filter(r => personnel.some(p => p.id === r.id));
  const doc = createPDF('landscape');
  if (!doc) return;

  let y = addPDFHeader(doc, 'Kapsamli Personel Raporu', 'Donem: ' + monthStr);
  const totalH = filtered.reduce((s, r) => s + r.totalHours, 0);
  const totalOT = filtered.reduce((s, r) => s + r.overtimeHours, 0);
  y = addPDFSummaryCards(doc, [
    { value: filtered.length, label: 'Personel' },
    { value: Math.round(totalH) + 's', label: 'Toplam Saat' },
    { value: totalOT.toFixed(1) + 's', label: 'Fazla Mesai' },
    { value: filtered.filter(r => r.status === 'overtime').length, label: 'Fazla Mesai Olan' },
    { value: filtered.filter(r => r.status === 'no_data').length, label: 'Kayit Yok' },
  ], y);

  const headers = ['Ad Soyad', 'Departman', 'Tur', 'Sinif', 'Haftalik', 'Ay Toplam', 'Hedef', 'Fazla Mesai', 'Durum'];
  const rows = filtered.map(r => [
    r.name + ' ' + r.surname, r.department,
    PERSONNEL_TYPES[r.type]?.label || r.type,
    PERSONNEL_TYPES[r.type]?.category === 'worker' ? 'Isci' : 'Memur',
    r.weeklyHours + 's', r.totalHours.toFixed(1) + 's', r.expectedHours.toFixed(1) + 's',
    r.overtimeHours > 0 ? '+' + r.overtimeHours.toFixed(1) + 's' : '-',
    r.status === 'normal' ? 'Normal' : r.status === 'overtime' ? 'Fazla Mesai' : 'Kayit Yok',
  ]);
  y = addPDFTable(doc, headers, rows, y);

  doc.addPage();
  y = addPDFHeader(doc, 'Izin Raporu', monthStr);
  const leaveHeaders = ['Ad Soyad', 'Departman', 'Toplam Hak', 'Kullanilan', 'Kalan', 'Oran %'];
  const leaveRows = personnel.map(p => {
    const total = p.leaveBalance || 14;
    const used = p.leaveUsed || 0;
    return [p.name + ' ' + p.surname, p.department, String(total), String(used), String(total - used), Math.round((used / total) * 100) + '%'];
  });
  addPDFTable(doc, leaveHeaders, leaveRows, y);
  addPDFFooter(doc);
  downloadPDF(doc, 'toplu_rapor_' + monthStr);
  showToast('Toplu PDF raporu indirildi', 'success');
}
