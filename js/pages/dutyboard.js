// ===== GÖREV PANOSU - BUGÜNKÜ TÜM GÖREVLER =====

import { getPersonnel, getTodaySchedules, PERSONNEL_TYPES, getSchedules } from '../state.js';

const SHIFT_LABELS = { morning: '🌅 Sabah (07-15)', evening: '🌆 Akşam (15-23)', night: '🌙 Gece (23-07)' };
const SHIFT_TIMES = { morning: '07:00 - 15:00', evening: '15:00 - 23:00', night: '23:00 - 07:00' };

export function renderDutyBoardPage(el) {
  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todaySchedules = getTodaySchedules();
  const allActive = getPersonnel().filter(p => p.status === 'active');

  // Kategorilere ayır
  const nurseSchedules = todaySchedules.filter(s => s.type === 'nurse');
  const cleaningSchedules = todaySchedules.filter(s => s.type === 'cleaning');
  const securitySchedules = todaySchedules.filter(s => s.type === 'security');
  const doctorSchedules = todaySchedules.filter(s => s.type === 'doctor');

  // Teknisyen nöbetçileri
  const technicalPersonnel = allActive.filter(p => p.type === 'technical');
  const techOnDuty = technicalPersonnel.filter((_, i) => {
    const day = new Date().getDate();
    return (day + i) % 3 !== 0;
  });

  // Kat atamaları
  const floorAssignments = {
    'Zemin Kat': ['Acil Servis', 'Laboratuvar', 'Eczane'],
    '1. Kat': ['Dahiliye', 'Radyoloji'],
    '2. Kat': ['Cerrahi', 'Ameliyathane'],
    '3. Kat': ['Çocuk Sağlığı', 'Kadın Doğum'],
    '4. Kat': ['Göz', 'KBB', 'Ortopedi'],
    '5. Kat': ['Yoğun Bakım', 'Fizik Tedavi'],
    'Genel Alan': ['Temizlik', 'Güvenlik', 'Teknik Servis', 'Mutfak', 'İdari'],
  };

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">📋 Görev Panosu</h1>
        <p class="text-slate-400 text-sm mt-1">Bugünkü görev atamaları ve nöbet listesi</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2">
          <span class="text-lg">📅</span>
          <span class="text-sm text-white font-medium">${todayStr}</span>
        </div>
        <button id="refresh-board" class="btn-secondary text-xs">🔄 Yenile</button>
        <button id="print-board" class="btn-secondary text-xs">🖨️ Yazdır</button>
      </div>
    </div>

    <!-- Özet Banner -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-white">${todaySchedules.length}</p>
        <p class="text-xs text-cyan-300">📋 Toplam Nöbetçi</p>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-white">${doctorSchedules.length}</p>
        <p class="text-xs text-blue-300">🩺 Doktor</p>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-white">${nurseSchedules.length}</p>
        <p class="text-xs text-cyan-300">👩‍⚕️ Hemşire</p>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-white">${cleaningSchedules.length}</p>
        <p class="text-xs text-green-300">🧹 Temizlik</p>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-white">${securitySchedules.length}</p>
        <p class="text-xs text-amber-300">🛡️ Güvenlik</p>
      </div>
    </div>

    <!-- Sekmeler -->
    <div class="flex flex-wrap gap-2 mb-6 fade-in">
      <button class="tab-active duty-tab" data-tab="overview">📊 Genel Bakış</button>
      <button class="tab-inactive duty-tab" data-tab="floors">🏢 Kat Bazlı</button>
      <button class="tab-inactive duty-tab" data-tab="shifts">⏰ Vardiya Bazlı</button>
      <button class="tab-inactive duty-tab" data-tab="personnel">👤 Kişi Bazlı</button>
    </div>

    <!-- Sekme İçeriği -->
    <div id="duty-content" class="fade-in">${buildOverviewTab(todaySchedules, allActive, techOnDuty, doctorSchedules, floorAssignments)}</div>`;

  // Sekme tıklamaları
  document.querySelectorAll('.duty-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.duty-tab').forEach(t => t.className = 'tab-inactive duty-tab');
      tab.className = 'tab-active duty-tab';
      const content = document.getElementById('duty-content');
      const tabId = tab.dataset.tab;
      if (tabId === 'overview') content.innerHTML = buildOverviewTab(todaySchedules, allActive, techOnDuty, doctorSchedules, floorAssignments);
      else if (tabId === 'floors') content.innerHTML = buildFloorsTab(todaySchedules, allActive, floorAssignments);
      else if (tabId === 'shifts') content.innerHTML = buildShiftsTab(todaySchedules, allActive);
      else content.innerHTML = buildPersonnelTab(todaySchedules, allActive);
    };
  });

  // Butonlar
  document.getElementById('refresh-board').onclick = () => window.location.reload();
  document.getElementById('print-board').onclick = () => window.print();
}

function buildOverviewTab(schedules, allActive, techOnDuty, doctorSchedules, floorAssignments) {
  const morningShift = schedules.filter(s => s.shift === 'morning');
  const eveningShift = schedules.filter(s => s.shift === 'evening');
  const nightShift = schedules.filter(s => s.shift === 'night');

  // Kat bazlı temizlik özeti
  const cleaningByFloor = {};
  const cleaningSchedules = schedules.filter(s => s.type === 'cleaning');
  cleaningSchedules.forEach(s => {
    const person = allActive.find(p => p.id === s.personnelId);
    if (!person) return;
    const floors = ['Zemin', '1. Kat', '2. Kat', '3. Kat', '4. Kat', '5. Kat'];
    const assignedFloor = floors[(person.id - 1) % floors.length];
    if (!cleaningByFloor[assignedFloor]) cleaningByFloor[assignedFloor] = [];
    cleaningByFloor[assignedFloor].push(person);
  });

  // Branş bazlı doktor grupları
  const doctorByBranch = {};
  doctorSchedules.forEach(s => {
    const person = allActive.find(p => p.id === s.personnelId);
    if (!person) return;
    const branch = person.department;
    if (!doctorByBranch[branch]) doctorByBranch[branch] = [];
    if (!doctorByBranch[branch].find(d => d.id === person.id)) {
      doctorByBranch[branch].push({ ...person, shift: s.shift });
    }
  });

  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Nöbetçi Doktorlar -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🩺 Nöbetçi Doktorlar</h3>
        <div class="space-y-3">
          ${Object.keys(doctorByBranch).length ? Object.entries(doctorByBranch).map(([branch, docs]) => `
            <div class="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-blue-300">🏥 ${branch}</span>
                <span class="text-xs text-slate-400">${docs.length} doktor</span>
              </div>
              <div class="flex flex-wrap gap-2">
                ${docs.map(d => `
                  <span class="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs text-blue-200">
                    <span class="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold">${d.name.charAt(0)}</span>
                    ${d.name} ${d.surname}
                    <span class="text-[9px] px-1 py-0.5 rounded bg-white/10 text-slate-400">${d.shift === 'morning' ? 'Gündüz' : d.shift === 'evening' ? 'Akşam' : 'Gece'}</span>
                  </span>
                `).join('')}
              </div>
            </div>
          `).join('') : '<p class="text-slate-500 text-center py-4 text-sm">Bugün nöbetçi doktor bulunmuyor</p>'}
        </div>
      </div>

      <!-- Vardiya Kartları -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">⏰ Vardiya Dağılımı</h3>
        <div class="space-y-4">
          ${buildShiftCard('🌅 Sabah Vardiyası', '07:00 - 15:00', morningShift, allActive, 'yellow')}
          ${buildShiftCard('🌆 Akşam Vardiyası', '15:00 - 23:00', eveningShift, allActive, 'orange')}
          ${buildShiftCard('🌙 Gece Vardiyası', '23:00 - 07:00', nightShift, allActive, 'blue')}
        </div>
      </div>

      <!-- Temizlik Kat Atamaları -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🧹 Temizlik - Kat Atamaları</h3>
        <div class="space-y-3">
          ${Object.entries(cleaningByFloor).map(([floor, persons]) => `
            <div class="rounded-xl bg-white/5 border border-white/5 p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-white">🏢 ${floor}</span>
                <span class="text-xs text-slate-400">${persons.length} kişi</span>
              </div>
              <div class="flex flex-wrap gap-2">
                ${persons.map(p => `
                  <span class="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-2.5 py-1 text-xs text-green-300">
                    <span class="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-bold">${p.name.charAt(0)}</span>
                    ${p.name} ${p.surname}
                  </span>
                `).join('')}
              </div>
            </div>
          `).join('')}
          ${Object.keys(cleaningByFloor).length === 0 ? '<p class="text-slate-500 text-center py-4 text-sm">Bugün temizlik görevlisi bulunmuyor</p>' : ''}
        </div>
      </div>

      <!-- Teknisyen Nöbetçileri -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🔧 Teknik Servis - Nöbetçiler</h3>
        <div class="space-y-2.5">
          ${techOnDuty.length ? techOnDuty.map(p => `
            <div class="flex items-center gap-3 rounded-xl bg-purple-500/5 border border-purple-500/10 p-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
                ${p.name.charAt(0)}${p.surname.charAt(0)}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-white">${p.name} ${p.surname}</p>
                <p class="text-xs text-slate-400">${p.title}</p>
              </div>
              <div class="text-right shrink-0">
                <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/15 text-purple-300">Nöbetçi</span>
                <p class="text-[10px] text-slate-500 mt-0.5">08:00-17:00</p>
              </div>
            </div>
          `).join('') : '<p class="text-slate-500 text-center py-4 text-sm">Bugün teknisyen nöbeti bulunmuyor</p>'}
        </div>
      </div>

      <!-- Güvenlik Noktaları -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🛡️ Güvenlik - Nöbet Noktaları</h3>
        <div class="space-y-2.5">
          ${buildSecurityPoints(schedules, allActive)}
        </div>
      </div>
    </div>

    <!-- Hemşire Servis Dağılımı -->
    <div class="card mt-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">👩‍⚕️ Hemşire - Servis Dağılımı</h3>
      ${buildNurseServiceTable(schedules, allActive)}
    </div>`;
}

function buildFloorsTab(schedules, allActive, floorAssignments) {
  const floors = Object.entries(floorAssignments);
  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${floors.map(([floor, depts]) => {
        const floorPersonnel = allActive.filter(p => depts.includes(p.department));
        const floorSchedules = schedules.filter(s => {
          const person = allActive.find(p => p.id === s.personnelId);
          return person && depts.includes(person.department);
        });
        const doctorCount = floorPersonnel.filter(p => p.type === 'doctor').length;
        const nurseCount = floorPersonnel.filter(p => p.type === 'nurse').length;
        const otherCount = floorPersonnel.length - doctorCount - nurseCount;

        return `
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-base font-semibold text-white">🏢 ${floor}</h4>
            <span class="text-xs text-slate-400">${floorPersonnel.length} personel</span>
          </div>
          <div class="flex flex-wrap gap-1.5 mb-3">
            ${depts.map(d => `<span class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">${d}</span>`).join('')}
          </div>
          <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 text-center">
              <p class="text-lg font-bold text-blue-300">${doctorCount}</p>
              <p class="text-[10px] text-blue-400">Doktor</p>
            </div>
            <div class="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2 text-center">
              <p class="text-lg font-bold text-cyan-300">${nurseCount}</p>
              <p class="text-[10px] text-cyan-400">Hemşire</p>
            </div>
            <div class="rounded-lg bg-slate-500/10 border border-slate-500/20 p-2 text-center">
              <p class="text-lg font-bold text-slate-300">${otherCount}</p>
              <p class="text-[10px] text-slate-400">Diğer</p>
            </div>
          </div>
          <div class="space-y-1.5 max-h-40 overflow-y-auto">
            ${floorPersonnel.slice(0, 8).map(p => {
              const isOnDuty = floorSchedules.some(s => s.personnelId === p.id);
              const typeColors = { doctor: 'text-blue-300', nurse: 'text-cyan-300', worker: 'text-green-300', security: 'text-amber-300', technical: 'text-purple-300', officer: 'text-emerald-300' };
              return `<div class="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5">
                <span class="text-xs ${typeColors[p.type] || 'text-slate-300'} truncate">${p.name} ${p.surname}</span>
                ${isOnDuty ? '<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">Aktif</span>' : '<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-500">-</span>'}
              </div>`;
            }).join('')}
            ${floorPersonnel.length > 8 ? `<p class="text-[10px] text-slate-500 text-center">+${floorPersonnel.length - 8} kişi daha...</p>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function buildShiftsTab(schedules, allActive) {
  const shifts = ['morning', 'evening', 'night'];
  const shiftInfo = {
    morning: { label: '🌅 Sabah Vardiyası', time: '07:00 - 15:00', color: 'yellow' },
    evening: { label: '🌆 Akşam Vardiyası', time: '15:00 - 23:00', color: 'orange' },
    night: { label: '🌙 Gece Vardiyası', time: '23:00 - 07:00', color: 'blue' },
  };

  return shifts.map(shift => {
    const shiftSchedules = schedules.filter(s => s.shift === shift);
    const byType = { doctor: [], nurse: [], cleaning: [], security: [] };
    shiftSchedules.forEach(s => { if (byType[s.type]) byType[s.type].push(s); });
    const info = shiftInfo[shift];

    return `
    <div class="card mb-4 fade-in">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h4 class="text-base font-semibold text-white">${info.label}</h4>
          <p class="text-xs text-slate-400">${info.time}</p>
        </div>
        <span class="text-2xl font-bold text-${info.color}-400">${shiftSchedules.length}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${['doctor', 'nurse', 'cleaning', 'security'].map(type => {
          const typeLabels = { doctor: '🩺 Doktorlar', nurse: '👩‍⚕️ Hemşireler', cleaning: '🧹 Temizlik', security: '🛡️ Güvenlik' };
          const typeColors = { doctor: 'blue', nurse: 'cyan', cleaning: 'green', security: 'amber' };
          const items = byType[type];
          return `
          <div class="rounded-xl bg-white/5 border border-white/5 p-3">
            <h5 class="text-sm font-medium text-${typeColors[type]}-300 mb-2">${typeLabels[type]} (${items.length})</h5>
            <div class="space-y-1.5">
              ${items.length ? items.map(s => {
                const p = allActive.find(x => x.id === s.personnelId);
                return `<div class="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
                  <span class="w-6 h-6 rounded-full bg-${typeColors[type]}-500/20 flex items-center justify-center text-[10px] font-bold text-${typeColors[type]}-300 shrink-0">${p ? p.name.charAt(0) : '?'}</span>
                  <span class="text-xs text-slate-300 truncate">${p ? p.name + ' ' + p.surname : 'Bilinmeyen'}</span>
                  ${s.department ? `<span class="text-[9px] text-slate-500 ml-auto shrink-0">${s.department}</span>` : ''}
                </div>`;
              }).join('') : '<p class="text-xs text-slate-600 text-center py-2">Görevli yok</p>'}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

function buildPersonnelTab(schedules, allActive) {
  const grouped = {};
  allActive.forEach(p => {
    if (!grouped[p.department]) grouped[p.department] = [];
    grouped[p.department].push(p);
  });

  return `
    <div class="card fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">👤 Tüm Personel - Bugünkü Durum</h3>
        <div class="flex gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">Nöbet</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-500">İzin/Ofis</span>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${Object.entries(grouped).sort((a, b) => b[1].length - a[1].length).map(([dept, persons]) => `
          <div class="rounded-xl bg-white/5 border border-white/5 p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-white">${dept}</span>
              <span class="text-xs text-slate-500">${persons.length} kişi</span>
            </div>
            <div class="space-y-1.5">
              ${persons.map(p => {
                const duty = schedules.find(s => s.personnelId === p.id);
                const typeColors = { doctor: 'text-blue-300', nurse: 'text-cyan-300', worker: 'text-green-300', security: 'text-amber-300', technical: 'text-purple-300', officer: 'text-emerald-300' };
                return `<div class="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5">
                  <div class="min-w-0 flex-1">
                    <span class="text-xs ${typeColors[p.type] || 'text-slate-300'} truncate block">${p.name} ${p.surname}</span>
                    <span class="text-[9px] text-slate-600">${p.title}</span>
                  </div>
                  ${duty ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 shrink-0 ml-1">${duty.shift === 'morning' ? 'Gündüz' : duty.shift === 'evening' ? 'Akşam' : 'Gece'}</span>` : `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/15 text-slate-500 shrink-0 ml-1">Ofis</span>`}
                </div>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function buildShiftCard(label, time, shiftSchedules, allActive, color) {
  const byType = { doctor: [], nurse: [], cleaning: [], security: [] };
  shiftSchedules.forEach(s => { if (byType[s.type]) byType[s.type].push(s); });

  return `
  <div class="rounded-xl bg-${color}-500/5 border border-${color}-500/10 p-3">
    <div class="flex items-center justify-between mb-2">
      <div>
        <p class="text-sm font-medium text-white">${label}</p>
        <p class="text-[10px] text-slate-400">${time}</p>
      </div>
      <span class="text-xl font-bold text-${color}-400">${shiftSchedules.length}</span>
    </div>
    <div class="flex flex-wrap gap-1.5">
      ${shiftSchedules.slice(0, 6).map(s => {
        const p = allActive.find(x => x.id === s.personnelId);
        return `<span class="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
          <span class="w-4 h-4 rounded-full bg-${color}-500/20 flex items-center justify-center text-[8px] font-bold text-${color}-300">${p ? p.name.charAt(0) : '?'}</span>
          ${p ? p.name : '?'}
        </span>`;
      }).join('')}
      ${shiftSchedules.length > 6 ? `<span class="text-[10px] text-slate-500">+${shiftSchedules.length - 6}</span>` : ''}
    </div>
  </div>`;
}

function buildSecurityPoints(schedules, allActive) {
  const securitySchedules = schedules.filter(s => s.type === 'security');
  const points = [
    { name: 'Ana Giriş Kapısı', icon: '🚪' },
    { name: 'Acil Servis Girişi', icon: '🚑' },
    { name: 'Poliklinik Girişi', icon: '🏥' },
    { name: 'Otopark', icon: '🅿️' },
    { name: 'Yönetim Katı', icon: '🏢' },
  ];

  if (!securitySchedules.length) return '<p class="text-slate-500 text-center py-4 text-sm">Bugün güvenlik nöbeti bulunmuyor</p>';

  return points.map((point, i) => {
    const assigned = securitySchedules[i % securitySchedules.length];
    const person = allActive.find(p => p.id === assigned?.personnelId);
    return `
    <div class="flex items-center gap-3 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
      <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
        ${point.icon}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-white">${point.name}</p>
        <p class="text-xs text-slate-400">${person ? person.name + ' ' + person.surname : 'Atanmamış'}</p>
      </div>
      <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 shrink-0">${assigned?.shift === 'morning' ? 'Gündüz' : assigned?.shift === 'evening' ? 'Akşam' : 'Gece'}</span>
    </div>`;
  }).join('');
}

function buildNurseServiceTable(schedules, allActive) {
  const nurseSchedules = schedules.filter(s => s.type === 'nurse');
  if (!nurseSchedules.length) return '<p class="text-slate-500 text-center py-4">Bugün hemşire nöbeti bulunmuyor</p>';

  const services = ['Acil Servis', 'Dahiliye', 'Cerrahi', 'Yoğun Bakım', 'Ameliyathane', 'Çocuk Sağlığı', 'Kadın Doğum', 'Fizik Tedavi'];

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      ${services.map(service => {
        const serviceNurses = nurseSchedules.filter(s => {
          const person = allActive.find(p => p.id === s.personnelId);
          return person && (person.department === service || person.department === 'Hemşirelik');
        });
        const nurses = serviceNurses.map(s => allActive.find(p => p.id === s.personnelId)).filter(Boolean);
        const unique = [...new Map(nurses.map(n => [n.id, n])).values()];

        return `
        <div class="rounded-xl bg-cyan-500/5 border border-cyan-500/10 p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-cyan-300">${service}</span>
            <span class="text-lg font-bold text-cyan-400">${unique.length}</span>
          </div>
          <div class="space-y-1.5">
            ${unique.length ? unique.slice(0, 3).map(n => `
              <div class="flex items-center gap-2 rounded bg-white/5 px-2 py-1">
                <span class="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[9px] font-bold text-cyan-300">${n.name.charAt(0)}</span>
                <span class="text-[10px] text-slate-300 truncate">${n.name} ${n.surname}</span>
              </div>
            `).join('') : '<p class="text-[10px] text-slate-600 text-center">-</p>'}
            ${unique.length > 3 ? `<p class="text-[9px] text-slate-500 text-center">+${unique.length - 3} daha</p>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}
