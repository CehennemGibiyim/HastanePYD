// ===== KİŞİSEL PROFİL SAYFASI =====

import { getCurrentUser, getPersonnel, PERSONNEL_TYPES, WORK_PROFILES, getDefaultProfileForType, getAttendance, getSchedules, getLeaveRecords } from '../state.js';
import { navigate } from '../app.js';

export function renderProfilePage(el) {
  const user = getCurrentUser();
  if (!user) { el.innerHTML = '<p class="text-slate-400 text-center py-16">Giriş yapmalısınız</p>'; return; }

  // Find linked personnel record
  const allPersonnel = getPersonnel();
  const linked = allPersonnel.find(p => {
    const fullName = `${p.name} ${p.surname}`.toLowerCase();
    return fullName.includes(user.name?.toLowerCase() || '') || 
           (user.department && p.department === user.department && p.type === 'officer');
  });

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">👤 Kişisel Profil</h1>
      <p class="text-slate-400 text-sm mt-1">Hesap bilgileriniz ve çalışma özetiniz</p>
    </div>

    <!-- Kullanıcı Bilgileri -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 fade-in">
      <div class="card lg:col-span-1">
        <div class="text-center">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-3xl font-bold text-cyan-300 mx-auto mb-4 overflow-hidden">
            ${linked?.photo || user.photo ? `<img src="${linked?.photo || user.photo}" alt="${user.name}" class="w-full h-full object-cover">` : getInitials(user.name)}
          </div>
          <h2 class="text-xl font-bold text-white">${user.name}</h2>
          <p class="text-sm text-slate-400 mt-1">@${user.username}</p>
          <div class="mt-3">
            <span class="inline-block px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-red-500/20 text-red-300' : user.role === 'supervisor' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}">
              ${user.role === 'admin' ? '👑 Admin' : user.role === 'supervisor' ? '🛡️ Departman Sorumlusu' : '👁️ Okuyucu'}
            </span>
          </div>
          ${user.department ? `<p class="text-sm text-slate-400 mt-2">🏢 ${user.department}</p>` : ''}
        </div>
        <div class="mt-4 pt-4 border-t border-white/10 space-y-2">
          <button onclick="location.hash='settings'" class="w-full profile-settings-btn justify-center">⚙️ Ayarlar</button>
          <button onclick="location.hash='settings'" class="w-full btn-secondary text-xs justify-center">🎨 Tema & Renkler</button>
          <button onclick="location.hash='reminders'" class="w-full btn-secondary text-xs justify-center">🔔 Hatırlatmalarım</button>
          <button onclick="location.hash='profile'" class="w-full btn-secondary text-xs justify-center">👤 Profilimi Düzenle</button>
        </div>
      </div>

      <!-- Hesap Detayları -->
      <div class="card lg:col-span-2">
        <h3 class="text-lg font-semibold text-white mb-4">📋 Hesap Detayları</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-xl bg-white/5 p-4">
            <p class="text-xs text-slate-400 mb-1">Kullanıcı Adı</p>
            <p class="text-sm font-medium text-white">${user.username}</p>
          </div>
          <div class="rounded-xl bg-white/5 p-4">
            <p class="text-xs text-slate-400 mb-1">Rol</p>
            <p class="text-sm font-medium text-white">${user.role === 'admin' ? '👑 Sistem Yöneticisi' : user.role === 'supervisor' ? '🛡️ Departman Sorumlusu' : '👁️ Okuyucu'}</p>
          </div>
          <div class="rounded-xl bg-white/5 p-4">
            <p class="text-xs text-slate-400 mb-1">Departman</p>
            <p class="text-sm font-medium text-white">${user.department || 'Tüm Departmanlar'}</p>
          </div>
          <div class="rounded-xl bg-white/5 p-4">
            <p class="text-xs text-slate-400 mb-1">Oturum Durumu</p>
            <p class="text-sm font-medium text-green-400">🟢 Aktif</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bağlı Personel Kaydı -->
    ${linked ? buildLinkedPersonnel(linked, monthStr) : `
    <div class="card fade-in">
      <div class="text-center py-8">
        <p class="text-4xl mb-3">🔗</p>
        <p class="text-slate-400 text-sm">Bu hesap bir personel kaydıyla ilişkilendirilmemiş</p>
        <p class="text-slate-600 text-xs mt-1">Personel bilgileriniz için yöneticinize başvurun</p>
      </div>
    </div>`}

    <!-- Yaklaşan Nöbetler -->
    ${linked ? buildUpcomingDuties(linked.id) : ''}

    <!-- İzin Durumu -->
    ${linked ? buildLeaveStatus(linked) : ''}`;
}

function buildLinkedPersonnel(p, monthStr) {
  const typeInfo = PERSONNEL_TYPES[p.type] || {};
  const profile = WORK_PROFILES[p.workProfile] || WORK_PROFILES[getDefaultProfileForType(p.type)];
  const attendance = getAttendance({ personnelId: p.id, month: monthStr });
  const totalHours = attendance.reduce((s, a) => s + (a.hours || 0), 0);
  const schedules = getSchedules({ personnelId: p.id, month: monthStr });

  return `
    <div class="card fade-in mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">🏥 Personel Bilgileri</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
          <p class="text-lg font-bold text-cyan-300">${totalHours.toFixed(0)}s</p>
          <p class="text-[10px] text-cyan-400">Bu Ayki Çalışma</p>
        </div>
        <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
          <p class="text-lg font-bold text-blue-300">${schedules.length}</p>
          <p class="text-[10px] text-blue-400">Nöbet Günü</p>
        </div>
        <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p class="text-lg font-bold text-emerald-300">${profile?.weeklyHours || typeInfo.weeklyHours || 40}s</p>
          <p class="text-[10px] text-emerald-400">Haftalık Hedef</p>
        </div>
        <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
          <p class="text-lg font-bold text-purple-300">${p.leaveBalance - (p.leaveUsed || 0)}</p>
          <p class="text-[10px] text-purple-400">Kalan İzin</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="rounded-lg bg-white/5 p-3">
          <p class="text-xs text-slate-400">Görev / Unvan</p>
          <p class="text-sm font-medium text-white">${p.title}</p>
        </div>
        <div class="rounded-lg bg-white/5 p-3">
          <p class="text-xs text-slate-400">Personel Türü</p>
          <p class="text-sm font-medium text-white">${typeInfo.label || p.type} · ${typeInfo.category === 'worker' ? 'İşçi Sınıfı' : 'Memur Sınıfı'}</p>
        </div>
        <div class="rounded-lg bg-white/5 p-3">
          <p class="text-xs text-slate-400">Mesai Profili</p>
          <p class="text-sm font-medium text-white">${profile?.icon || '⚙️'} ${profile?.name || 'Standart'}</p>
        </div>
        <div class="rounded-lg bg-white/5 p-3">
          <p class="text-xs text-slate-400">İşe Başlama</p>
          <p class="text-sm font-medium text-white">${p.startDate ? new Date(p.startDate + 'T12:00:00').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
        </div>
      </div>
    </div>`;
}

function buildUpcomingDuties(personnelId) {
  const today = new Date().toISOString().split('T')[0];
  const allSchedules = getSchedules({ personnelId });
  const upcoming = allSchedules.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  const SHIFT_LABELS = { morning: '🌅 Sabah', evening: '🌆 Akşam', night: '🌙 Gece' };
  const SHIFT_COLORS = { morning: 'bg-yellow-500/15 text-yellow-300', evening: 'bg-orange-500/15 text-orange-300', night: 'bg-blue-500/15 text-blue-300' };

  return `
    <div class="card fade-in mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">📅 Yaklaşan Nöbetleriniz</h3>
      ${upcoming.length ? `
        <div class="space-y-2">
          ${upcoming.map(s => `
            <div class="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <div class="flex items-center gap-3">
                <span class="text-lg">📅</span>
                <div>
                  <p class="text-sm font-medium text-white">${new Date(s.date + 'T12:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <p class="text-xs text-slate-400">${s.department}</p>
                </div>
              </div>
              <span class="inline-block px-3 py-1 rounded-full text-xs font-medium ${SHIFT_COLORS[s.shift] || 'bg-slate-500/15 text-slate-300'}">${SHIFT_LABELS[s.shift] || s.shift}</span>
            </div>
          `).join('')}
        </div>
      ` : '<p class="text-slate-500 text-center py-4 text-sm">Yaklaşan nöbetiniz bulunmuyor</p>'}
    </div>`;
}

function buildLeaveStatus(p) {
  const records = getLeaveRecords({ personnelId: p.id });
  const approved = records.filter(r => r.status === 'approved');
  const pending = records.filter(r => r.status === 'pending');
  const balance = p.leaveBalance || 14;
  const used = p.leaveUsed || 0;
  const remaining = balance - used;
  const pct = Math.round((used / balance) * 100);

  return `
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🏖️ İzin Durumu</h3>
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
          <p class="text-xl font-bold text-blue-300">${balance}</p>
          <p class="text-[10px] text-blue-400">Toplam Hak</p>
        </div>
        <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
          <p class="text-xl font-bold text-amber-300">${used}</p>
          <p class="text-[10px] text-amber-400">Kullanılan</p>
        </div>
        <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p class="text-xl font-bold text-green-300">${remaining}</p>
          <p class="text-[10px] text-green-400">Kalan</p>
        </div>
      </div>
      <div class="h-3 rounded-full bg-white/10 overflow-hidden mb-2">
        <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style="width:${pct}%"></div>
      </div>
      <p class="text-xs text-slate-500 text-center mb-4">%${pct} kullanıldı</p>
      ${pending.length ? `
        <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <p class="text-xs font-medium text-amber-300 mb-2">⏳ Bekleyen Talepler (${pending.length})</p>
          ${pending.map(r => `
            <div class="flex justify-between text-xs text-slate-400 py-1">
              <span>${r.type || 'Yıllık İzin'}: ${r.startDate} - ${r.endDate}</span>
              <span>${r.days} gün</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>`;
}

function getInitials(name) {
  if (!name) return '👤';
  const parts = name.split(/\s+/);
  return parts.map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2);
}
