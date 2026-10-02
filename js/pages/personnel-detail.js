// ===== PERSONEL DETAY SAYFASI =====

import { getPersonnelById, updatePersonnel, hasPermission, PERSONNEL_TYPES, DEPARTMENTS, canAccessDepartment, isDepartmentRestricted,
         getAttendance, getSchedules, getLeaveRecords, addLeaveRecord, updateLeaveStatus } from '../state.js?build=v90';
import { navigate } from '../app.js';
import { showToast, resizeImage } from '../notifications.js';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Yıllık İzin', icon: '🏖️' },
  { value: 'sick', label: 'Raporlu', icon: '🏥' },
  { value: 'excuse', label: 'Mazeret İzni', icon: '📋' },
  { value: 'maternity', label: 'Doğum İzni', icon: '👶' },
  { value: 'unpaid', label: 'Ücretsiz İzin', icon: '⏸️' },
];

export function renderPersonnelDetailPage(el, personnelId) {
  const person = getPersonnelById(personnelId);
  if (!person) {
    el.innerHTML = `<div class="empty-state fade-in">
      <p class="text-4xl mb-3">🔍</p>
      <p class="title text-white">Personel bulunamadı</p>
      <p class="desc">Bu personel silinmiş veya mevcut değil.</p>
      <button onclick="location.hash='personnel'" class="btn-primary mt-4">← Personel Listesine Dön</button>
    </div>`;
    return;
  }

  const canWrite = hasPermission('write');
  const deptRestricted = isDepartmentRestricted();

  if (deptRestricted && !canAccessDepartment(person.department)) {
    el.innerHTML = `<div class="empty-state fade-in">
      <p class="text-4xl mb-3">🔒</p>
      <p class="title text-white">Erişim Yetkiniz Yok</p>
      <p class="desc">Bu personelin departmanına erişim yetkiniz bulunmuyor.</p>
      <button onclick="location.hash='personnel'" class="btn-primary mt-4">← Personel Listesine Dön</button>
    </div>`;
    return;
  }
  const typeInfo = PERSONNEL_TYPES[person.type] || {};
  const isWorker = typeInfo.category === 'worker';

  // Puantaj verileri
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [yNum, mNum] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(yNum, mNum, 0).getDate();
  const firstDayOfWeek = new Date(yNum, mNum - 1, 1).getDay();
  const todayDate = now.getDate();
  const isCurrentMonth = now.getMonth() + 1 === mNum && now.getFullYear() === yNum;

  const attendance = getAttendance({ personnelId: person.id, month: monthStr });
  const totalHours = attendance.reduce((s, a) => s + (a.hours || 0), 0);
  const overtimeHours = attendance.filter(a => a.note?.includes('Fazla')).reduce((s, a) => {
    const daily = (typeInfo.weeklyHours || 40) / 5;
    return s + Math.max(0, (a.hours || 0) - daily);
  }, 0);
  const dailyExpected = (typeInfo.weeklyHours || 40) / 5;

  // Nöbet verileri
  const schedules = getSchedules({ personnelId: person.id, month: monthStr });
  const shiftCounts = { morning: 0, evening: 0, night: 0 };
  schedules.forEach(s => { if (shiftCounts[s.shift] !== undefined) shiftCounts[s.shift]++; });

  // İzin verileri
  const leaveRecords = getLeaveRecords({ personnelId: person.id });
  const leaveBalance = person.leaveBalance || 14;
  const leaveUsed = person.leaveUsed || 0;
  const leaveRemaining = leaveBalance - leaveUsed;

  // Baş harfler
  const initials = (person.name.charAt(0) + (person.surname?.charAt(0) || '')).toUpperCase();

  // Renk paleti
  const typeColors = {
    doctor: 'from-blue-500 to-blue-700',
    nurse: 'from-cyan-500 to-cyan-700',
    worker: 'from-green-500 to-green-700',
    security: 'from-amber-500 to-amber-700',
    technical: 'from-purple-500 to-purple-700',
    officer: 'from-emerald-500 to-emerald-700',
  };
  const gradientClass = typeColors[person.type] || 'from-slate-500 to-slate-700';

  const avatarContent = person.photo
    ? `<img src="${person.photo}" alt="${person.name}">`
    : initials;

  // Aylık takvim verisi
  const attendanceMap = {};
  attendance.forEach(a => {
    const day = parseInt(a.date.split('-')[2]);
    attendanceMap[day] = a;
  });

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const adjFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  let calendarCells = '';
  for (let i = 0; i < adjFirstDay; i++) {
    calendarCells += '<div class="att-calendar-day att-day-empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(yNum, mNum - 1, d);
    const dow = dt.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const rec = attendanceMap[d];
    const isToday = isCurrentMonth && d === todayDate;

    let cls = 'att-day-empty';
    let hoursText = '';
    if (rec) {
      const isOver = rec.hours > dailyExpected;
      cls = isOver ? 'att-day-overtime' : 'att-day-normal';
      hoursText = `${rec.hours}s`;
    } else if (isWeekend) {
      cls = 'att-day-weekend';
    } else if (!isCurrentMonth || d < todayDate) {
      cls = 'att-day-absent';
    }
    if (isToday) cls += ' att-day-today';

    calendarCells += `
      <div class="att-calendar-day ${cls}" title="${rec ? rec.note || 'Normal mesai' : isWeekend ? 'Hafta sonu' : 'Kayıt yok'}">
        <span class="day-num">${d}</span>
        ${hoursText ? `<span class="day-hours">${hoursText}</span>` : ''}
      </div>`;
  }

  el.innerHTML = `
    <div class="fade-in">
      <!-- Geri Butonu -->
      <div class="mb-6">
        <a href="#personnel" class="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-300 transition">
          ← Personel Listesine Dön
        </a>
      </div>

      <!-- Profil Kartı -->
      <div class="card mb-6 overflow-hidden">
        <div class="bg-gradient-to-r ${gradientClass} h-24 -mx-5 -mt-5 mb-6 flex items-end px-5 pb-4 relative">
          <div class="flex items-end gap-4">
            <div class="profile-avatar bg-slate-900" id="detail-avatar">
              ${avatarContent}
            </div>
            <div class="pb-1">
              <h1 class="text-2xl font-bold text-white">${person.name} ${person.surname}</h1>
              <p class="text-sm text-white/80">${person.title}</p>
            </div>
          </div>
          ${canWrite ? `
          <div class="absolute top-3 right-3">
            <button id="change-photo-btn" class="text-xs bg-black/30 hover:bg-black/50 text-white px-3 py-1.5 rounded-lg backdrop-blur transition">📷 Fotoğraf</button>
            <input type="file" id="detail-photo-input" accept="image/*" class="hidden">
          </div>` : ''}
        </div>

        <!-- Temel Bilgi Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div class="rounded-xl bg-white/5 border border-white/5 p-4">
            <p class="text-xs text-slate-500 mb-1">🏢 Departman</p>
            <p class="text-sm font-medium text-white">${person.department}</p>
          </div>
          <div class="rounded-xl bg-white/5 border border-white/5 p-4">
            <p class="text-xs text-slate-500 mb-1">👷 Personel Türü</p>
            <p class="text-sm font-medium text-white">${typeInfo.label || person.type}</p>
            <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isWorker ? 'bg-blue-500/15 text-blue-300' : 'bg-emerald-500/15 text-emerald-300'}">${isWorker ? 'İşçi Sınıfı' : 'Memur Sınıfı'} · ${typeInfo.weeklyHours}s/hafta</span>
          </div>
          <div class="rounded-xl bg-white/5 border border-white/5 p-4">
            <p class="text-xs text-slate-500 mb-1">📅 İşe Başlama</p>
            <p class="text-sm font-medium text-white">${person.startDate ? new Date(person.startDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
            ${person.startDate ? `<p class="text-[10px] text-slate-500 mt-1">${calculateSeniority(person.startDate)}</p>` : ''}
          </div>
        </div>

        <!-- İletişim Bilgileri -->
        <h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">📞 İletişim Bilgileri</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div class="rounded-xl bg-white/5 border border-white/5 p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">📱</div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-slate-500">Telefon</p>
              <a href="tel:${person.phone}" class="text-sm font-medium text-white hover:text-cyan-300 transition">${person.phone}</a>
            </div>
            <button onclick="navigator.clipboard.writeText('${person.phone}');this.textContent='✓';setTimeout(()=>this.textContent='📋',1000)" class="text-slate-400 hover:text-cyan-300 transition p-2" title="Kopyala">📋</button>
          </div>
          <div class="rounded-xl bg-white/5 border border-white/5 p-4 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">✉️</div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-slate-500">E-posta</p>
              ${person.email ? `<a href="mailto:${person.email}" class="text-sm font-medium text-white hover:text-cyan-300 transition truncate block">${person.email}</a>` : '<p class="text-sm text-slate-500 italic">Belirtilmemiş</p>'}
            </div>
            ${person.email ? `<button onclick="navigator.clipboard.writeText('${person.email}');this.textContent='✓';setTimeout(()=>this.textContent='📋',1000)" class="text-slate-400 hover:text-cyan-300 transition p-2" title="Kopyala">📋</button>` : ''}
          </div>
        </div>

        ${person.address ? `
        <h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">🏠 Adres</h3>
        <div class="rounded-xl bg-white/5 border border-white/5 p-4 mb-6">
          <p class="text-sm text-slate-300">${person.address}</p>
        </div>` : ''}

        ${person.tc ? `
        <h3 class="text-sm font-semibold text-white mb-3 flex items-center gap-2">🆔 Kimlik Bilgileri</h3>
        <div class="rounded-xl bg-white/5 border border-white/5 p-4 mb-6">
          <p class="text-xs text-slate-500">TC Kimlik No</p>
          <p class="text-sm font-medium text-white">${person.tc}</p>
        </div>` : ''}
      </div>

      <!-- Eğitim & Sertifikalar -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">🎓 Eğitim Bilgileri</h3>
          ${person.education ? `
            <div class="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
              <p class="text-sm font-medium text-emerald-300">${person.education}</p>
            </div>
          ` : '<p class="text-sm text-slate-500 italic py-4 text-center">Eğitim bilgisi girilmemiş</p>'}
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">📋 Sertifikalar</h3>
          ${person.certificates?.length ? `
            <div class="flex flex-wrap gap-2">
              ${person.certificates.map(c => `
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300">
                  <span>📜</span> ${c}
                </span>
              `).join('')}
            </div>
          ` : '<p class="text-sm text-slate-500 italic py-4 text-center">Sertifika kaydı yok</p>'}
        </div>
      </div>

      <!-- Puantaj & Nöbet Özeti -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">⏰ Bu Ayki Puantaj</h3>
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
              <p class="text-xl font-bold text-cyan-300">${totalHours.toFixed(1)}s</p>
              <p class="text-[10px] text-cyan-400">Toplam Çalışma</p>
            </div>
            <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
              <p class="text-xl font-bold text-amber-300">${overtimeHours.toFixed(1)}s</p>
              <p class="text-[10px] text-amber-400">Fazla Mesai</p>
            </div>
            <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
              <p class="text-xl font-bold text-blue-300">${attendance.length}</p>
              <p class="text-[10px] text-blue-400">Gün Kayıt</p>
            </div>
          </div>
          ${attendance.length > 0 ? `
            <div class="max-h-40 overflow-y-auto space-y-1">
              ${attendance.slice(-7).map(a => `
                <div class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                  <span class="text-xs text-slate-400">${new Date(a.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                  <span class="text-xs text-white font-medium">${a.hours}s</span>
                  <span class="text-[10px] ${a.note?.includes('Fazla') ? 'text-amber-400' : 'text-slate-500'}">${a.note || ''}</span>
                </div>
              `).join('')}
            </div>
          ` : '<p class="text-sm text-slate-500 italic text-center py-2">Kayıt yok</p>'}
        </div>

        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">📅 Bu Ayki Nöbetler</h3>
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-center">
              <p class="text-xl font-bold text-yellow-300">${shiftCounts.morning}</p>
              <p class="text-[10px] text-yellow-400">🌅 Sabah</p>
            </div>
            <div class="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center">
              <p class="text-xl font-bold text-orange-300">${shiftCounts.evening}</p>
              <p class="text-[10px] text-orange-400">🌆 Akşam</p>
            </div>
            <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
              <p class="text-xl font-bold text-blue-300">${shiftCounts.night}</p>
              <p class="text-[10px] text-blue-400">🌙 Gece</p>
            </div>
          </div>
          <div class="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
            <p class="text-2xl font-bold text-white">${schedules.length}</p>
            <p class="text-xs text-slate-400">Toplam Nöbet Günü</p>
          </div>
        </div>
      </div>

      <!-- Aylık Puantaj Takvimi -->
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">📅 Aylık Puantaj Takvimi</h3>
        <div class="flex flex-wrap gap-3 mb-4">
          <span class="att-legend-item"><span class="att-legend-dot" style="background:rgba(34,197,94,0.3)"></span> Normal</span>
          <span class="att-legend-item"><span class="att-legend-dot" style="background:rgba(245,158,11,0.3)"></span> Fazla Mesai</span>
          <span class="att-legend-item"><span class="att-legend-dot" style="background:rgba(100,116,139,0.3)"></span> Hafta Sonu</span>
          <span class="att-legend-item"><span class="att-legend-dot" style="background:rgba(239,68,68,0.2)"></span> Kayıt Yok</span>
        </div>
        <div class="att-calendar">
          ${dayNames.map(d => `<div class="att-calendar-header">${d}</div>`).join('')}
          ${calendarCells}
        </div>
        <div class="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
          <span>Günlük hedef: <strong class="text-white">${dailyExpected.toFixed(1)}s</strong></span>
          <span>Toplam: <strong class="text-cyan-400">${totalHours.toFixed(1)}s</strong></span>
          <span>Fazla mesai: <strong class="text-amber-400">${overtimeHours.toFixed(1)}s</strong></span>
        </div>
      </div>

      <!-- İzin Yönetimi -->
      <div class="card mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white flex items-center gap-2">🏖️ İzin Yönetimi</h3>
          ${canWrite ? `<button id="add-leave-btn" class="btn-secondary text-xs px-3 py-1.5">+ İzin Ekle</button>` : ''}
        </div>
        <div class="grid grid-cols-3 gap-3 mb-4">
          <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
            <p class="text-xl font-bold text-green-300">${leaveBalance}</p>
            <p class="text-[10px] text-green-400">Toplam Hak</p>
          </div>
          <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
            <p class="text-xl font-bold text-red-300">${leaveUsed}</p>
            <p class="text-[10px] text-red-400">Kullanılan</p>
          </div>
          <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
            <p class="text-xl font-bold text-cyan-300">${leaveRemaining}</p>
            <p class="text-[10px] text-cyan-400">Kalan</p>
          </div>
        </div>
        <div class="mb-4">
          <div class="flex justify-between text-xs text-slate-400 mb-1">
            <span>Kullanım Oranı</span>
            <span>${leaveBalance > 0 ? Math.round((leaveUsed / leaveBalance) * 100) : 0}%</span>
          </div>
          <div class="h-3 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full rounded-full ${leaveUsed / leaveBalance > 0.8 ? 'bg-red-500' : leaveUsed / leaveBalance > 0.5 ? 'bg-amber-500' : 'bg-green-500'} transition-all" style="width:${leaveBalance > 0 ? Math.min(100, Math.round((leaveUsed / leaveBalance) * 100)) : 0}%"></div>
          </div>
        </div>
        ${leaveRecords.length > 0 ? `
          <div class="space-y-2">
            ${leaveRecords.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).slice(0, 10).map(r => {
              const lt = LEAVE_TYPES.find(t => t.value === r.type);
              const statusColors = { approved: 'bg-green-500/15 text-green-400', pending: 'bg-amber-500/15 text-amber-400', rejected: 'bg-red-500/15 text-red-400' };
              const statusLabels = { approved: 'Onaylı', pending: 'Beklemede', rejected: 'Reddedildi' };
              return `<div class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-3">
                <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">${lt?.icon || '📋'}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-white">${lt?.label || r.type}</p>
                  <p class="text-xs text-slate-400">${r.startDate} → ${r.endDate} · ${r.days} gün</p>
                  ${r.reason ? `<p class="text-[10px] text-slate-500 truncate">${r.reason}</p>` : ''}
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[r.status] || statusColors.pending}">${statusLabels[r.status] || r.status}</span>
                ${canWrite && r.status === 'pending' ? `
                  <div class="flex gap-1">
                    <button onclick="window.__approveLeave(${r.id})" class="text-green-400 hover:text-green-300 text-xs px-2 py-1 rounded hover:bg-green-500/10">✓</button>
                    <button onclick="window.__rejectLeave(${r.id})" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10">✕</button>
                  </div>` : ''}
              </div>`;
            }).join('')}
          </div>
        ` : '<p class="text-sm text-slate-500 italic text-center py-6">İzin kaydı bulunmuyor</p>'}
      </div>

      ${canWrite ? `
      <div id="leave-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-white">🏖️ İzin Talebi Oluştur</h3>
            <button id="leave-close-x" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">✕</button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="label">İzin Türü</label>
              <select id="l-type" class="input-field w-full">
                ${LEAVE_TYPES.map(lt => `<option value="${lt.value}">${lt.icon} ${lt.label}</option>`).join('')}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Başlangıç</label>
                <input id="l-start" type="date" class="input-field w-full">
              </div>
              <div>
                <label class="label">Bitiş</label>
                <input id="l-end" type="date" class="input-field w-full">
              </div>
            </div>
            <div>
              <label class="label">Gün Sayısı</label>
              <input id="l-days" type="number" class="input-field w-full" min="1" value="1">
            </div>
            <div>
              <label class="label">Açıklama</label>
              <textarea id="l-reason" class="input-field w-full h-16 resize-none" placeholder="İzin sebebi (opsiyonel)"></textarea>
            </div>
          </div>
          <div class="flex gap-3 mt-4 pt-4 border-t border-white/10">
            <button id="l-save" class="btn-primary flex-1">💾 Kaydet</button>
            <button id="l-cancel" class="btn-secondary flex-1">İptal</button>
          </div>
        </div>
      </div>` : ''}
    </div>`;

  // Photo change
  if (canWrite) {
    document.getElementById('change-photo-btn')?.addEventListener('click', () => {
      document.getElementById('detail-photo-input')?.click();
    });
    document.getElementById('detail-photo-input')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const photoData = await resizeImage(file, 150);
        updatePersonnel(person.id, { photo: photoData });
        showToast('Fotoğraf güncellendi', 'success');
        renderPersonnelDetailPage(el, personnelId);
      } catch { showToast('Fotoğraf yüklenemedi', 'error'); }
    });
  }

  // Leave actions
  window.__approveLeave = (id) => {
    updateLeaveStatus(id, 'approved');
    showToast('İzin onaylandı', 'success');
    renderPersonnelDetailPage(el, personnelId);
  };
  window.__rejectLeave = (id) => {
    updateLeaveStatus(id, 'rejected');
    showToast('İzin reddedildi', 'error');
    renderPersonnelDetailPage(el, personnelId);
  };

  if (canWrite) {
    document.getElementById('add-leave-btn')?.addEventListener('click', () => {
      document.getElementById('leave-modal').classList.remove('hidden');
    });
    document.getElementById('leave-close-x')?.addEventListener('click', () => {
      document.getElementById('leave-modal').classList.add('hidden');
    });
    document.getElementById('l-cancel')?.addEventListener('click', () => {
      document.getElementById('leave-modal').classList.add('hidden');
    });
    // Only close via Cancel/X buttons, no backdrop click

    const lStart = document.getElementById('l-start');
    const lEnd = document.getElementById('l-end');
    const lDays = document.getElementById('l-days');
    const calcDays = () => {
      if (lStart.value && lEnd.value) {
        const diff = Math.ceil((new Date(lEnd.value) - new Date(lStart.value)) / 86400000) + 1;
        if (diff > 0) lDays.value = diff;
      }
    };
    lStart?.addEventListener('change', calcDays);
    lEnd?.addEventListener('change', calcDays);

    document.getElementById('l-save')?.addEventListener('click', () => {
      const type = document.getElementById('l-type').value;
      const startDate = document.getElementById('l-start').value;
      const endDate = document.getElementById('l-end').value;
      const days = parseInt(document.getElementById('l-days').value) || 1;
      const reason = document.getElementById('l-reason').value.trim();
      if (!startDate || !endDate) { showToast('Başlangıç ve bitiş tarihi gerekli', 'error'); return; }
      addLeaveRecord({ personnelId: person.id, type, startDate, endDate, days, reason, status: 'approved' });
      document.getElementById('leave-modal').classList.add('hidden');
      showToast(`${days} gün izin eklendi`, 'success');
      renderPersonnelDetailPage(el, personnelId);
    });
  }
}

function calculateSeniority(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  const totalMonths = years * 12 + months;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const parts = [];
  if (y > 0) parts.push(`${y} yıl`);
  if (m > 0) parts.push(`${m} ay`);
  return parts.length ? `Kıdem: ${parts.join(' ')}` : 'Yeni personel';
}
