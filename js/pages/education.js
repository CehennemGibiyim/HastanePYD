// ===== EĞİTİM & SERTİFİKA TAKİBİ =====

import { getPersonnel, getCurrentUser, hasPermission, updatePersonnel, isDepartmentRestricted, canAccessDepartment } from '../state.js';
import { showToast, addNotification } from '../notifications.js';

export function renderEducationPage(el) {
  const personnel = getPersonnel().filter(p => p.status === 'active');
  const now = new Date();

  // All certificates with expiry tracking
  const allCerts = [];
  personnel.forEach(p => {
    (p.certificates || []).forEach(cert => {
      allCerts.push({
        personId: p.id,
        personName: p.name + ' ' + p.surname,
        department: p.department,
        title: p.title,
        certificate: typeof cert === 'object' ? cert : { name: cert, issueDate: null, expiryDate: null },
      });
    });
  });

  // Expiring soon (within 90 days)
  const expiringSoon = allCerts.filter(c => {
    if (!c.certificate.expiryDate) return false;
    const expiry = new Date(c.certificate.expiryDate);
    const daysLeft = Math.ceil((expiry - now) / 86400000);
    return daysLeft > 0 && daysLeft <= 90;
  });

  const expired = allCerts.filter(c => {
    if (!c.certificate.expiryDate) return false;
    return new Date(c.certificate.expiryDate) < now;
  });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📚 Eğitim & Sertifika Takibi</h1>
          <p class="text-slate-400 text-sm mt-1">Personel eğitimleri ve sertifika yönetimi</p>
        </div>
      </div>
    </div>

    <!-- Uyarılar -->
    ${(expiringSoon.length > 0 || expired.length > 0) ? `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 fade-in">
      ${expired.length > 0 ? `
      <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
        <p class="text-sm font-medium text-red-300 mb-2">🔴 Süresi Dolmuş (${expired.length})</p>
        <div class="space-y-1.5">
          ${expired.slice(0, 5).map(c => `
            <div class="text-xs text-red-400">${c.personName} - ${c.certificate.name}</div>
          `).join('')}
          ${expired.length > 5 ? `<div class="text-[10px] text-red-500">+${expired.length - 5} daha</div>` : ''}
        </div>
      </div>` : ''}
      ${expiringSoon.length > 0 ? `
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
        <p class="text-sm font-medium text-amber-300 mb-2">⚠️ Süresi Dolmak Üzere (${expiringSoon.length})</p>
        <div class="space-y-1.5">
          ${expiringSoon.slice(0, 5).map(c => {
            const daysLeft = Math.ceil((new Date(c.certificate.expiryDate) - now) / 86400000);
            return `<div class="text-xs text-amber-400">${c.personName} - ${c.certificate.name} (${daysLeft} gün)</div>`;
          }).join('')}
          ${expiringSoon.length > 5 ? `<div class="text-[10px] text-amber-500">+${expiringSoon.length - 5} daha</div>` : ''}
        </div>
      </div>` : ''}
    </div>` : ''}

    <!-- Departman Bazlı Sertifika Dağılımı -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Departman Bazlı Sertifika Dağılımı</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        ${Object.entries(groupByDept(personnel)).sort((a, b) => b[1].count - a[1].count).map(([dept, data]) => `
          <div class="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
            <p class="text-2xl font-bold text-white">${data.count}</p>
            <p class="text-xs text-cyan-400">${dept}</p>
            <p class="text-[10px] text-slate-500">${data.personCount} personel</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Personel Listesi -->
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">👥 Personel Sertifikaları</h3>
      <div class="space-y-2">
        ${personnel.filter(p => (p.certificates || []).length > 0).sort((a, b) => (b.certificates?.length || 0) - (a.certificates?.length || 0)).map(p => `
          <div class="rounded-xl bg-white/5 border border-white/5 p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-sm shrink-0">
                  ${p.photo ? `<img src="${p.photo}" class="w-full h-full object-cover rounded-lg">` : (p.name[0] + p.surname[0])}
                </div>
                <div>
                  <p class="text-sm font-medium text-white">${p.name} ${p.surname}</p>
                  <p class="text-xs text-slate-400">${p.department} · ${p.title}</p>
                </div>
              </div>
              <span class="badge">${(p.certificates || []).length} sertifika</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${(p.certificates || []).map(cert => {
                const name = typeof cert === 'object' ? cert.name : cert;
                return `<span class="text-[11px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">${name}</span>`;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function groupByDept(personnel) {
  const groups = {};
  personnel.forEach(p => {
    if (!groups[p.department]) groups[p.department] = { count: 0, personCount: 0 };
    groups[p.department].count += (p.certificates || []).length;
    groups[p.department].personCount++;
  });
  return groups;
}
