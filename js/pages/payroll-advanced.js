// ===== NÖBET ÜCRET HESAPLAMA =====
const shiftPayData = [
  { id: 1, personnel: 'Dr. Arslan', role: 'Doktor', month: 'Oca 2026', weekdayNight: 4, weekendDay: 2, weekendNight: 2, holiday: 1, hourlyRate: 250, totalPay: 0 },
  { id: 2, personnel: 'Hemşire Ayşe', role: 'Hemşire', month: 'Oca 2026', weekdayNight: 6, weekendDay: 3, weekendNight: 2, holiday: 0, hourlyRate: 120, totalPay: 0 },
  { id: 3, personnel: 'Dr. Kaya', role: 'Doktor', month: 'Oca 2026', weekdayNight: 3, weekendDay: 1, weekendNight: 1, holiday: 2, hourlyRate: 250, totalPay: 0 },
  { id: 4, personnel: 'Güvenlik Kemal', role: 'Güvenlik', month: 'Oca 2026', weekdayNight: 8, weekendDay: 4, weekendNight: 3, holiday: 1, hourlyRate: 80, totalPay: 0 },
  { id: 5, personnel: 'Temizlik Hasan', role: 'Temizlik', month: 'Oca 2026', weekdayNight: 5, weekendDay: 2, weekendNight: 2, holiday: 0, hourlyRate: 75, totalPay: 0 },
];

// Ücret katsayıları
const RATES = { weekdayNight: 1.5, weekendDay: 1.5, weekendNight: 2.0, holiday: 2.5, shiftHours: 16 };

function calculatePay(row) {
  const base = row.hourlyRate * RATES.shiftHours;
  return (
    row.weekdayNight * base * RATES.weekdayNight +
    row.weekendDay * base * RATES.weekendDay +
    row.weekendNight * base * RATES.weekendNight +
    row.holiday * base * RATES.holiday
  );
}

export function renderPayrollAdvancedPage(el) {
  shiftPayData.forEach(r => { r.totalPay = calculatePay(r); });
  const totalPayout = shiftPayData.reduce((s, r) => s + r.totalPay, 0);
  const totalShifts = shiftPayData.reduce((s, r) => s + r.weekdayNight + r.weekendDay + r.weekendNight + r.holiday, 0);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">💰 Nöbet Ücret Hesaplama</h1>
      <p class="text-slate-400 text-sm mt-1">Gece/hafta sonu/bayram nöbet ücreti otomatik hesaplama</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${shiftPayData.length}</p><p class="text-xs text-slate-400">Personel</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${totalShifts}</p><p class="text-xs text-slate-400">Toplam Nöbet</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">₺${(totalPayout/1000).toFixed(0)}K</p><p class="text-xs text-slate-400">Toplam Ücret</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">₺${Math.round(totalPayout/shiftPayData.length/1000)}K</p><p class="text-xs text-slate-400">Ortalama</p></div>
    </div>
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-2">📊 Ücret Katsayıları</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
          <p class="text-xs text-blue-300">Hafta İçi Gece</p>
          <p class="text-xl font-bold text-white">%150</p>
        </div>
        <div class="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p class="text-xs text-green-300">Hafta Sonu Gündüz</p>
          <p class="text-xl font-bold text-white">%150</p>
        </div>
        <div class="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-center">
          <p class="text-xs text-purple-300">Hafta Sonu Gece</p>
          <p class="text-xl font-bold text-white">%200</p>
        </div>
        <div class="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center">
          <p class="text-xs text-red-300">Resmi Tatil</p>
          <p class="text-xl font-bold text-white">%250</p>
        </div>
      </div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">💰 Nöbet Ücret Detayları</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Personel</th><th class="th">Rol</th><th class="th">Hafta İçi Gece</th><th class="th">H.Sonu Gündüz</th><th class="th">H.Sonu Gece</th><th class="th">Tatil</th><th class="th">Saatlik</th><th class="th">Toplam</th></tr></thead>
          <tbody>${shiftPayData.map(r => `<tr class="border-t border-white/5 hover:bg-white/5">
            <td class="td font-medium">${r.personnel}</td><td class="td">${r.role}</td>
            <td class="td text-center">${r.weekdayNight}</td><td class="td text-center">${r.weekendDay}</td>
            <td class="td text-center">${r.weekendNight}</td><td class="td text-center">${r.holiday}</td>
            <td class="td">₺${r.hourlyRate}</td>
            <td class="td font-bold text-green-300">₺${r.totalPay.toLocaleString('tr-TR')}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}
