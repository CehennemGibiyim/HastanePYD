// ===== NÖBET LİSTESİ SAYFASI =====

import { getPersonnel, getSchedules, addSchedule, deleteSchedule, hasPermission, PERSONNEL_TYPES, DEPARTMENTS, WORK_PROFILES, getDefaultProfileForType, getShiftDurationOptions, isDepartmentRestricted, getUserDepartment, checkDutyConflict, checkLeaveConflict, bulkCreateSchedule, generateTemplateSchedule } from '../state.js';
import { navigate } from '../app.js';
import { showToast } from '../notifications.js';
import { exportSchedulesToICal } from '../utils/ical.js';

const SHIFT_LABELS = { morning: '🌅 Sabah', evening: '🌆 Akşam', night: '🌙 Gece' };
const SHIFT_COLORS = { morning: 'bg-yellow-500/20 text-yellow-300', evening: 'bg-orange-500/20 text-orange-300', night: 'bg-blue-500/20 text-blue-300' };
const SHIFT_SHORT = { morning: 'S', evening: 'A', night: 'G' };

const TYPE_CONFIG = {
  doctor:   { label: 'Doktor',   icon: '🩺', color: 'blue',   tab: 'doctor' },
  nurse:    { label: 'Hemşire',  icon: '👩‍⚕️', color: 'cyan',   tab: 'nurse' },
  cleaning: { label: 'Temizlik', icon: '🧹', color: 'green',  tab: 'clean' },
  security: { label: 'Güvenlik', icon: '🛡️', color: 'amber',  tab: 'security' },
};

export function renderSchedulePage(el) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
  const days = new Date(y, m + 1, 0).getDate();
  const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const canWrite = hasPermission('write');

  const deptRestricted = isDepartmentRestricted();
  const myDept = getUserDepartment();
  const allActive = deptRestricted
    ? getPersonnel().filter(p => p.status === 'active' && p.department === myDept)
    : getPersonnel().filter(p => p.status === 'active');

  const doctors = allActive.filter(p => p.type === 'doctor');
  const nurses = allActive.filter(p => p.type === 'nurse');
  const cleaners = allActive.filter(p => p.type === 'worker' || (p.type === 'officer' && p.department === 'Temizlik'));
  const securityGuards = allActive.filter(p => p.type === 'security');

  const doctorSched = getSchedules({ type: 'doctor', month: monthStr });
  const nurseSched = getSchedules({ type: 'nurse', month: monthStr });
  const cleanSched = getSchedules({ type: 'cleaning', month: monthStr });
  const securitySched = getSchedules({ type: 'security', month: monthStr });

  // Branş bazlı doktor grupları
  const doctorBranches = {};
  doctors.forEach(d => {
    if (!doctorBranches[d.department]) doctorBranches[d.department] = [];
    doctorBranches[d.department].push(d);
  });

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">📋 Nöbet Listesi</h1>
        <p class="text-slate-400 text-sm mt-1">${monthName} · ${doctors.length + nurses.length + cleaners.length + securityGuards.length} nöbetçi personel</p>
      </div>
      <div class="flex flex-wrap gap-2">
        ${canWrite ? '<button id="add-shift-btn" class="btn-primary text-xs">+ Nöbet Ekle</button>' : ''}
        ${canWrite ? '<button id="bulk-plan-btn" class="btn-secondary text-xs">📋 Toplu Planla</button>' : ''}
        <button id="schedule-pdf-btn" class="btn-secondary text-xs">📄 PDF Rapor</button>
        <button id="schedule-ical-btn" class="btn-secondary text-xs">📅 iCal İndir</button>
      </div>
    </div>

    <!-- Nöbet Türü Sekmeleri -->
    <div class="flex flex-wrap gap-2 mb-6 fade-in">
      <button id="tab-doctor" class="tab-active" onclick="window._schedTab('doctor')">🩺 Doktor</button>
      <button id="tab-nurse" class="tab-inactive" onclick="window._schedTab('nurse')">👩‍⚕️ Hemşire</button>
      <button id="tab-clean" class="tab-inactive" onclick="window._schedTab('clean')">🧹 Temizlik</button>
      <button id="tab-security" class="tab-inactive" onclick="window._schedTab('security')">🛡️ Güvenlik</button>
    </div>

    <!-- Özet Kartları -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="card text-center" id="sum-doctor">
        <p class="text-2xl font-bold text-blue-400">${doctors.length}</p>
        <p class="text-xs text-slate-400">🩺 Doktor</p>
      </div>
      <div class="card text-center" id="sum-nurse">
        <p class="text-2xl font-bold text-cyan-400">${nurses.length}</p>
        <p class="text-xs text-slate-400">👩‍⚕️ Hemşire</p>
      </div>
      <div class="card text-center" id="sum-clean">
        <p class="text-2xl font-bold text-green-400">${cleaners.length}</p>
        <p class="text-xs text-slate-400">🧹 Temizlik</p>
      </div>
      <div class="card text-center" id="sum-security">
        <p class="text-2xl font-bold text-amber-400">${securityGuards.length}</p>
        <p class="text-xs text-slate-400">🛡️ Güvenlik</p>
      </div>
    </div>

    <div id="sched-area" class="fade-in">${buildDoctorBranchTable(doctors, doctorBranches, doctorSched, days, monthStr, canWrite)}</div>

    <!-- Nöbet Ekleme Modalı -->
    <div id="shift-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white mb-4">Nöbet Ekle</h3>
        <div class="space-y-3">
          <div>
            <label class="label">Nöbet Türü</label>
            <select id="s-type" class="input-field w-full">
              <option value="doctor">🩺 Doktor Nöbeti</option>
              <option value="nurse">👩‍⚕️ Hemşire Nöbeti</option>
              <option value="cleaning">🧹 Temizlik Nöbeti</option>
              <option value="security">🛡️ Güvenlik Nöbeti</option>
            </select>
          </div>
          <div id="s-branch-wrap" class="hidden">
            <label class="label">Branş / Servis</label>
            <select id="s-branch" class="input-field w-full">
              ${Object.keys(doctorBranches).map(b => `<option value="${b}">${b}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="label">Personel</label>
            <select id="s-person" class="input-field w-full"></select>
          </div>
          <div>
            <label class="label">Tarih</label>
            <input id="s-date" type="date" class="input-field w-full" value="${now.getFullYear()}-${String(m + 1).padStart(2, '0')}-01">
          </div>
          <div>
            <label class="label">Vardiya</label>
            <select id="s-shift" class="input-field w-full">
              <option value="morning">🌅 Sabah (07:00 - 15:00)</option>
              <option value="evening">🌆 Akşam (15:00 - 23:00)</option>
              <option value="night">🌙 Gece (23:00 - 07:00)</option>
              <option value="custom">⏰ Özel Saat Aralığı</option>
            </select>
          </div>
          <div id="s-custom-time" class="hidden space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Başlangıç Saati</label>
                <input id="s-start-time" type="time" class="input-field w-full" value="07:00">
              </div>
              <div>
                <label class="label">Bitiş Saati</label>
                <input id="s-end-time" type="time" class="input-field w-full" value="15:00">
              </div>
            </div>
            <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
              💡 Gece 00:00'ı aşan vardiyalar için bitiş saatini ertesi gün olarak girin. Örn: 23:00 → 07:00
            </div>
          </div>
          <div>
            <label class="label">Çalışma Süresi</label>
            <select id="s-duration" class="input-field w-full">
              <option value="8">8 Saat — Normal Mesai</option>
              <option value="7.5">7.5 Saat — Kısa Nöbet (puantaj: 8s)</option>
              <option value="9">9 Saat — Uzun Vardiya (1s mola → 8s)</option>
              <option value="12">12 Saat — Tam Gün (1s mola → 11s)</option>
            </select>
          </div>
          <div id="s-calc-info" class="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3 text-xs text-cyan-300 hidden">
            <div class="flex items-center gap-2 mb-1">
              <span>📊</span>
              <span class="font-semibold">Puantaj Hesaplaması</span>
            </div>
            <div id="s-calc-detail"></div>
          </div>
          <div>
            <label class="label">📝 Nöbet Notu</label>
            <textarea id="s-notes" class="input-field w-full h-20 resize-none" placeholder="Örn: Acil servis nöbeti 08:00-20:00 arası, Dr. Mehmet ile birlikte. Ekstra sorumluluk: Yoğun bakım nöbeti."></textarea>
            <p class="text-[10px] text-slate-500 mt-1">Nöbet saat aralığı, özel görevler veya ek bilgileri buraya yazabilirsiniz. Yetkili kişi bu notu referans alarak puantaj işlemi yapar.</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="s-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="s-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>
    </div>`;

  // Sekme tıklama
  window._schedTab = (tab) => {
    const tabs = ['doctor', 'nurse', 'clean', 'security'];
    tabs.forEach(t => {
      document.getElementById(`tab-${t}`).className = t === tab ? 'tab-active' : 'tab-inactive';
    });
    const area = document.getElementById('sched-area');
    if (tab === 'doctor') area.innerHTML = buildDoctorBranchTable(doctors, doctorBranches, doctorSched, days, monthStr, canWrite);
    else if (tab === 'nurse') area.innerHTML = buildTable(nurses, nurseSched, days, monthStr, canWrite, 'nurse');
    else if (tab === 'clean') area.innerHTML = buildTable(cleaners, cleanSched, days, monthStr, canWrite, 'cleaning');
    else area.innerHTML = buildTable(securityGuards, securitySched, days, monthStr, canWrite, 'security');
  };

  // Nöbet ekleme modalı
  if (canWrite) {
    const updatePersonOptions = () => {
      const type = document.getElementById('s-type').value;
      const branchWrap = document.getElementById('s-branch-wrap');
      let filtered;

      if (type === 'doctor') {
        branchWrap.classList.remove('hidden');
        const branch = document.getElementById('s-branch')?.value;
        filtered = doctors.filter(d => !branch || d.department === branch);
      } else {
        branchWrap.classList.add('hidden');
        if (type === 'nurse') filtered = nurses;
        else if (type === 'cleaning') filtered = cleaners;
        else filtered = securityGuards;
      }

      document.getElementById('s-person').innerHTML = filtered.length
        ? filtered.map(p => `<option value="${p.id}">${p.name} ${p.surname} (${p.department})</option>`).join('')
        : '<option value="">Bu kategoride personel yok</option>';
      updateDurationOptions();
    };

    const updateDurationOptions = () => {
      const personId = parseInt(document.getElementById('s-person')?.value);
      const person = getPersonnel({}).find(p => p.id === personId);
      const profileId = person?.workProfile || getDefaultProfileForType(person?.type || 'worker');
      const profile = WORK_PROFILES[profileId];
      const sel = document.getElementById('s-duration');
      if (!sel || !profile) return;
      sel.innerHTML = Object.entries(profile.shifts).map(([dur, rule]) =>
        `<option value="${dur}">${dur}s — ${rule.label}${rule.breakMin > 0 ? ' (' + rule.breakMin + 'dk mola → ' + rule.record + 's puantaj)' : ' → ' + rule.record + 's puantaj'}</option>`
      ).join('');
      updateCalcInfo();
    };

    const updateCalcInfo = () => {
      const personId = parseInt(document.getElementById('s-person')?.value);
      const person = getPersonnel({}).find(p => p.id === personId);
      const profileId = person?.workProfile || getDefaultProfileForType(person?.type || 'worker');
      const profile = WORK_PROFILES[profileId];
      const duration = parseFloat(document.getElementById('s-duration')?.value);
      const infoBox = document.getElementById('s-calc-info');
      const detail = document.getElementById('s-calc-detail');
      if (!profile || !duration || !infoBox || !detail) return;
      const rule = profile.shifts[duration];
      if (!rule) { infoBox.classList.add('hidden'); return; }
      infoBox.classList.remove('hidden');
      detail.innerHTML = `
        <div class="flex items-center justify-between">
          <span>Profil: <strong>${profile.name}</strong></span>
          <span>${profile.weeklyHours}s/hafta</span>
        </div>
        <div class="flex items-center justify-between mt-1">
          <span>Vardiya: <strong>${duration}s</strong>${rule.breakMin > 0 ? ' − ' + rule.breakMin + 'dk mola' : ''}</span>
          <span class="text-lg font-bold">${rule.record}s</span>
        </div>
        <p class="text-[10px] text-cyan-400/70 mt-1">Puantaja ${rule.record} saat olarak işlenecektir.</p>`;
    };

    const toggleCustomTime = () => {
      const shiftVal = document.getElementById('s-shift')?.value;
      const customWrap = document.getElementById('s-custom-time');
      if (!customWrap) return;
      if (shiftVal === 'custom') {
        customWrap.classList.remove('hidden');
      } else {
        customWrap.classList.add('hidden');
      }
    };

    document.getElementById('add-shift-btn').onclick = () => {
      updatePersonOptions();
      toggleCustomTime();
      document.getElementById('shift-modal').classList.remove('hidden');
    };
    document.getElementById('s-type').onchange = updatePersonOptions;
    document.getElementById('s-branch')?.addEventListener('change', updatePersonOptions);
    document.getElementById('s-person')?.addEventListener('change', updateDurationOptions);
    document.getElementById('s-duration')?.addEventListener('change', updateCalcInfo);
    document.getElementById('s-cancel').onclick = () => document.getElementById('shift-modal').classList.add('hidden');
    document.getElementById('s-shift').addEventListener('change', toggleCustomTime);
    document.getElementById('s-save').onclick = () => {
      const personId = parseInt(document.getElementById('s-person').value);
      const date = document.getElementById('s-date').value;
      const shift = document.getElementById('s-shift').value;
      const type = document.getElementById('s-type').value;
      const duration = parseFloat(document.getElementById('s-duration').value) || 8;
      const notes = document.getElementById('s-notes')?.value?.trim() || '';
      const customStart = document.getElementById('s-start-time')?.value || '';
      const customEnd = document.getElementById('s-end-time')?.value || '';
      const person = getPersonnel({}).find(p => p.id === personId);
      if (!date || !person) { alert('Tarih ve personel seçimi gereklidir'); return; }

      // Conflict checks
      const dutyConflict = checkDutyConflict(personId, date);
      if (dutyConflict.length > 0) {
        const existing = dutyConflict[0];
        const existingShift = SHIFT_LABELS[existing.shift] || existing.shift;
        if (!confirm(`⚠️ ${person.name} ${person.surname} bu tarihte zaten "${existingShift}" nöbetinde kayıtlı!\n\nYine de eklemek istiyor musunuz?`)) return;
      }

      const leaveConflict = checkLeaveConflict(personId, date);
      if (leaveConflict.length > 0) {
        const leave = leaveConflict[0];
        if (!confirm(`⚠️ ${person.name} ${person.surname} bu tarihte izinli! (${leave.type || 'İzin'}: ${leave.startDate} - ${leave.endDate})\n\nYine de nöbet eklemek istiyor musunuz?`)) return;
      }

      let fullNote = notes;
      if (shift === 'custom' && customStart && customEnd) {
        const timeNote = 'Ozel saat: ' + customStart + ' - ' + customEnd;
        fullNote = fullNote ? timeNote + ' | ' + fullNote : timeNote;
      }
      const finalShift = shift === 'custom' ? 'morning' : shift;
      addSchedule({ personnelId: personId, department: person.department, date, shift: finalShift, type, duration, notes: fullNote || undefined });
      showToast(`${person.name} ${person.surname} nöbete eklendi`, 'success');
      document.getElementById('shift-modal').classList.add('hidden');
      navigate('schedule');
    };
  }

  // PDF Rapor
  document.getElementById('schedule-pdf-btn')?.addEventListener('click', () => {
    const now2 = new Date();
    const dateStr = now2.toLocaleDateString('tr-TR');
    const allSchedules = [
      { type: 'doctor', persons: doctors, scheds: doctorSched, label: '🩺 Doktor Nöbetleri (Branş Bazlı)' },
      { type: 'nurse', persons: nurses, scheds: nurseSched, label: '👩‍⚕️ Hemşire Nöbetleri' },
      { type: 'cleaning', persons: cleaners, scheds: cleanSched, label: '🧹 Temizlik Nöbetleri' },
      { type: 'security', persons: securityGuards, scheds: securitySched, label: '🛡️ Güvenlik Nöbetleri' },
    ];

    let tablesHtml = allSchedules.map(({ persons, scheds, label }) => {
      if (!persons.length) return '';
      const rows = persons.map(p => {
        const ps = scheds.filter(s => s.personnelId === p.id);
        const cells = Array.from({ length: days }, (_, i) => {
          const ds = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
          const sc = ps.find(s => s.date === ds);
          return `<td style="text-align:center;padding:3px;font-size:10px;${sc ? 'background:#e0f2fe;' : ''}">${sc ? SHIFT_SHORT[sc.shift] : '-'}</td>`;
        }).join('');
        return `<tr><td style="font-weight:600;padding:4px;white-space:nowrap">${p.name} ${p.surname}</td><td style="padding:4px;font-size:10px;color:#666">${p.department}</td>${cells}<td style="text-align:center;font-weight:600">${ps.length}</td></tr>`;
      }).join('');
      const header = Array.from({ length: days }, (_, i) => `<th style="text-align:center;padding:3px;font-size:10px;min-width:22px;background:#f1f5f9">${i + 1}</th>`).join('');
      return `<h3 style="margin:16px 0 8px;font-size:14px">${label}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr>
          <th style="text-align:left;padding:4px;background:#f1f5f9;min-width:100px">Personel</th><th style="text-align:left;padding:4px;background:#f1f5f9;min-width:80px">Branş</th>${header}<th style="text-align:center;padding:4px;background:#f1f5f9">Toplam</th>
        </tr></thead><tbody>${rows}</tbody></table>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Nöbet Raporu - ${monthName}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #111; font-size: 12px; }
      h1 { font-size: 16px; color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 6px; }
      table { border: 1px solid #e2e8f0; }
      th { border: 1px solid #e2e8f0; }
      td { border: 1px solid #f1f5f9; }
      .legend { margin: 12px 0; font-size: 10px; color: #64748b; }
      .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #ddd; padding-top: 6px; }
      @media print { body { padding: 10px; } }
    </style></head><body>
    <h1>📋 Devlet Hastanesi - Nöbet Raporu</h1>
    <p style="color:#666;font-size:11px">Dönem: ${monthName} | Rapor Tarihi: ${dateStr}</p>
    <div class="legend">S: Sabah (07-15) | A: Akşam (15-23) | G: Gece (23-07) | -: İzin</div>
    ${tablesHtml}
    <div class="footer">Devlet Hastanesi Personel Yönetim Sistemi | ${dateStr}</div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 600); }
  });

  // iCal Disa Aktarma
  document.getElementById('schedule-ical-btn')?.addEventListener('click', () => {
    const allScheds = [...doctorSched, ...nurseSched, ...cleanSched, ...securitySched];
    if (deptRestricted) {
      const deptPersonnel = allActive.map(p => p.id);
      const filtered = allScheds.filter(s => deptPersonnel.includes(s.personnelId));
      const pMap = {}; allActive.forEach(p => { pMap[p.id] = p; });
      exportSchedulesToICal(filtered, pMap, 'nobet_' + monthStr);
    } else {
      const allP = getPersonnel().filter(p => p.status === 'active');
      const pMap = {}; allP.forEach(p => { pMap[p.id] = p; });
      exportSchedulesToICal(allScheds, pMap, 'nobet_' + monthStr);
    }
    showToast('iCal dosyasi indirildi', 'success');
  });

  // Toplu Planlama
  if (canWrite) {
    document.getElementById('bulk-plan-btn')?.addEventListener('click', () => {
      const existing = document.getElementById('bulk-modal');
      if (existing) existing.remove();
      const sortedDepts = DEPARTMENTS.slice().sort();
      const modal = document.createElement('div');
      modal.id = 'bulk-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
      modal.innerHTML = `
        <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
          <h3 class="text-xl font-bold text-white mb-4">📋 Toplu Nöbet Planlama</h3>
          <p class="text-xs text-slate-400 mb-4">Bir departman için tüm aya otomatik nöbet planı oluşturur.</p>
          <div class="space-y-3">
            <div>
              <label class="label">Departman</label>
              <select id="bulk-dept" class="input-field w-full">
                ${deptRestricted ? `<option value="${myDept}">${myDept}</option>` : sortedDepts.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="label">Şablon Türü</label>
              <select id="bulk-template" class="input-field w-full">
                <option value="standard">Standart (5 gün çalış, 2 gün izin)</option>
                <option value="rotation">Rotasyon (3 gün çalış, 1 gün izin)</option>
                <option value="12h">12 Saat Vardiya (2 gün çalış, 1 gün izin)</option>
                <option value="9h">9 Saat Vardiya (5 gün çalış, 2 gün izin)</option>
              </select>
            </div>
            <div>
              <label class="label">Ay</label>
              <select id="bulk-month" class="input-field w-full">
                <option value="${monthStr}">${monthName}</option>
                ${(() => {
                  const next = new Date(y, m + 1, 1);
                  const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
                  return `<option value="${nextStr}">${next.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</option>`;
                })()}
              </select>
            </div>
            <div id="bulk-preview" class="rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-slate-400"></div>
          </div>
          <div class="flex gap-3 mt-6">
            <button id="bulk-generate" class="btn-primary flex-1">⚡ Oluştur</button>
            <button id="bulk-cancel" class="btn-secondary flex-1">İptal</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.onclick = (e) => { if (e.target.id === 'bulk-modal') modal.remove(); };
      document.getElementById('bulk-cancel').onclick = () => modal.remove();

      const updatePreview = () => {
        const dept = document.getElementById('bulk-dept').value;
        const template = document.getElementById('bulk-template').value;
        const previewMonth = document.getElementById('bulk-month').value;
        const entries = generateTemplateSchedule(dept, previewMonth, template);
        const personCount = new Set(entries.map(e => e.personnelId)).size;
        document.getElementById('bulk-preview').innerHTML = `
          <p>📊 <strong>${personCount}</strong> personel · <strong>${entries.length}</strong> nöbet kaydı oluşturulacak</p>
          <p class="text-[10px] text-slate-500 mt-1">Mevcut nöbetler silinmez, yeni kayıtlar eklenir.</p>`;
      };
      document.getElementById('bulk-dept').onchange = updatePreview;
      document.getElementById('bulk-template').onchange = updatePreview;
      document.getElementById('bulk-month').onchange = updatePreview;
      updatePreview();

      document.getElementById('bulk-generate').onclick = () => {
        const dept = document.getElementById('bulk-dept').value;
        const template = document.getElementById('bulk-template').value;
        const previewMonth = document.getElementById('bulk-month').value;
        const entries = generateTemplateSchedule(dept, previewMonth, template);
        if (!entries.length) { showToast('Bu departmanda aktif personel yok', 'error'); return; }
        if (!confirm(`${entries.length} nöbet kaydı oluşturulacak. Onaylıyor musunuz?`)) return;
        const count = bulkCreateSchedule(entries);
        showToast(`${count} nöbet kaydı oluşturuldu`, 'success');
        modal.remove();
        navigate('schedule');
      };
    });
  }
}

// ===== Doktor Branş Bazlı Tablo =====
function buildDoctorBranchTable(doctors, branches, scheds, days, monthStr, canWrite) {
  if (!doctors.length) return '<div class="card text-center text-slate-500 py-8">🩺 Doktor bulunamadı</div>';

  const monthNum = parseInt(monthStr.split('-')[1]) - 1;
  const yearNum = parseInt(monthStr.split('-')[0]);

  const header = Array.from({ length: days }, (_, i) => {
    const d = new Date(yearNum, monthNum, i + 1);
    const dn = d.toLocaleDateString('tr-TR', { weekday: 'narrow' });
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return `<th class="px-1 py-2 text-center min-w-[34px] text-xs ${isWeekend ? 'text-amber-400' : 'text-slate-400'}">${i + 1}<br><span class="text-[10px] opacity-60">${dn}</span></th>`;
  }).join('');

  const branchColors = {
    'Acil Servis': 'red', 'Dahiliye': 'blue', 'Cerrahi': 'purple',
    'Çocuk Sağlığı': 'pink', 'Göz': 'emerald', 'KBB': 'amber',
    'Ortopedi': 'orange', 'Kadın Doğum': 'rose', 'Yoğun Bakım': 'cyan',
  };

  return Object.entries(branches).map(([branch, branchDoctors]) => {
    const color = branchColors[branch] || 'slate';
    const rows = branchDoctors.map(p => {
      const ps = scheds.filter(s => s.personnelId === p.id);
      const cells = Array.from({ length: days }, (_, i) => {
        const ds = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
        const sc = ps.find(s => s.date === ds);
        const shift = sc?.shift;
        const d = new Date(yearNum, monthNum, i + 1);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        if (!shift) return `<td class="px-1 py-1 text-center"><span class="inline-block rounded px-1.5 py-0.5 text-[10px] ${isWeekend ? 'bg-amber-500/10 text-amber-500/50' : 'bg-slate-500/20 text-slate-500'}">${isWeekend ? 'İ' : '-'}</span></td>`;
        const dur = sc?.duration;
        const durBadge = dur && dur !== 8 ? `<span class="text-[8px] opacity-60 block">${dur}s</span>` : '';
        const noteIcon = sc?.notes ? ' 📝' : '';
        const noteTitle = sc?.notes ? '\nNot: ' + sc.notes : '';
        return `<td class="px-1 py-1 text-center"><span class="inline-block rounded px-1.5 py-0.5 text-[10px] ${SHIFT_COLORS[shift]}" title="${SHIFT_LABELS[shift]}${dur ? ' · ' + dur + 's' : ''}${noteTitle}">${SHIFT_SHORT[shift]}${durBadge}${noteIcon}</span></td>`;
      }).join('');

      return `<tr class="border-b border-white/5 hover:bg-white/5">
        <td class="px-3 py-2 text-white font-medium sticky left-0 bg-slate-900/95 backdrop-blur z-10 min-w-[120px] text-sm">
          <div>${p.name} ${p.surname}</div>
          <div class="text-[10px] text-slate-500">${p.title}</div>
        </td>${cells}<td class="px-2 py-2 text-center text-sm font-medium text-${color}-300">${ps.length}</td></tr>`;
    }).join('');

    return `
      <div class="card overflow-x-auto schedule-table mb-4">
        <div class="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
          <div class="w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center text-sm">🩺</div>
          <div>
            <h4 class="text-sm font-semibold text-white">${branch}</h4>
            <p class="text-[10px] text-slate-400">${branchDoctors.length} doktor · ${branch === 'Acil Servis' ? '7/24 vardiya' : 'Poliklinik + Nöbet'}</p>
          </div>
        </div>
        <table class="w-full text-xs"><thead><tr>
          <th class="px-3 py-2 text-left text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur z-10 min-w-[120px]">Doktor</th>${header}<th class="px-2 py-2 text-center text-slate-300">Toplam</th>
        </tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  }).join('') + `
    <div class="mt-4 flex flex-wrap gap-4">
      ${Object.entries(SHIFT_LABELS).map(([k, v]) => `<span class="inline-flex items-center gap-1.5 text-xs"><span class="inline-block rounded px-2 py-0.5 ${SHIFT_COLORS[k]}">${SHIFT_SHORT[k]}</span><span class="text-slate-400">${v}</span></span>`).join('')}
      <span class="inline-flex items-center gap-1.5 text-xs"><span class="inline-block rounded px-2 py-0.5 bg-slate-500/20 text-slate-500">-</span><span class="text-slate-400">İzin</span></span>
      <span class="inline-flex items-center gap-1.5 text-xs"><span class="inline-block rounded px-2 py-0.5 bg-amber-500/10 text-amber-500/50">İ</span><span class="text-slate-400">Hafta Sonu</span></span>
    </div>`;
}

// ===== Genel Tablo (Hemşire/Temizlik/Güvenlik) =====
function buildTable(persons, scheds, days, monthStr, canWrite, schedType) {
  if (!persons.length) return '<div class="card text-center text-slate-500 py-8">Bu kategoride personel bulunamadı</div>';

  const monthNum = parseInt(monthStr.split('-')[1]) - 1;
  const yearNum = parseInt(monthStr.split('-')[0]);

  const header = Array.from({ length: days }, (_, i) => {
    const d = new Date(yearNum, monthNum, i + 1);
    const dn = d.toLocaleDateString('tr-TR', { weekday: 'narrow' });
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return `<th class="px-1 py-2 text-center min-w-[34px] text-xs ${isWeekend ? 'text-amber-400' : 'text-slate-400'}">${i + 1}<br><span class="text-[10px] opacity-60">${dn}</span></th>`;
  }).join('');

  const rows = persons.map(p => {
    const ps = scheds.filter(s => s.personnelId === p.id);
    const cells = Array.from({ length: days }, (_, i) => {
      const ds = `${monthStr}-${String(i + 1).padStart(2, '0')}`;
      const sc = ps.find(s => s.date === ds);
      const shift = sc?.shift;
      const d = new Date(yearNum, monthNum, i + 1);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (!shift) return `<td class="px-1 py-1 text-center"><span class="inline-block rounded px-1.5 py-0.5 text-[10px] ${isWeekend ? 'bg-amber-500/10 text-amber-500/50' : 'bg-slate-500/20 text-slate-500'}">${isWeekend ? 'İ' : '-'}</span></td>`;
      const dur = sc?.duration;
      const durBadge = dur && dur !== 8 ? `<span class="text-[8px] opacity-60 block">${dur}s</span>` : '';
      const noteIcon = sc?.notes ? ' 📝' : '';
      const noteTitle = sc?.notes ? '\nNot: ' + sc.notes : '';
      return `<td class="px-1 py-1 text-center"><span class="inline-block rounded px-1.5 py-0.5 text-[10px] ${SHIFT_COLORS[shift]}" title="${SHIFT_LABELS[shift]}${dur ? ' · ' + dur + 's' : ''}${noteTitle}">${SHIFT_SHORT[shift]}${durBadge}${noteIcon}</span></td>`;
    }).join('');

    const dutyCount = ps.length;
    return `<tr class="border-b border-white/5 hover:bg-white/5">
      <td class="px-3 py-2 text-white font-medium sticky left-0 bg-slate-900/95 backdrop-blur z-10 min-w-[120px] text-sm">
        <div>${p.name} ${p.surname}</div>
        <div class="text-[10px] text-slate-500">${dutyCount} gün</div>
      </td>${cells}</tr>`;
  }).join('');

  return `
    <div class="card overflow-x-auto schedule-table">
      <table class="w-full text-xs"><thead><tr>
        <th class="px-3 py-2 text-left text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur z-10 min-w-[120px]">Personel</th>${header}
      </tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="mt-4 flex flex-wrap gap-4">
      ${Object.entries(SHIFT_LABELS).map(([k, v]) => `<span class="inline-flex items-center gap-1.5 text-xs"><span class="inline-block rounded px-2 py-0.5 ${SHIFT_COLORS[k]}">${SHIFT_SHORT[k]}</span><span class="text-slate-400">${v}</span></span>`).join('')}
      <span class="inline-flex items-center gap-1.5 text-xs"><span class="inline-block rounded px-2 py-0.5 bg-slate-500/20 text-slate-500">-</span><span class="text-slate-400">İzin</span></span>
      <span class="inline-flex items-center gap-1.5 text-xs"><span class="inline-block rounded px-2 py-0.5 bg-amber-500/10 text-amber-500/50">İ</span><span class="text-slate-400">Hafta Sonu</span></span>
    </div>`;
}
