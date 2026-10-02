// ===== POLİKLİNİK RANDEVU SİSTEMİ =====
let appointments = [
  { id: 1, patient: 'Ahmet Yılmaz', doctor: 'Dr. Arslan', dept: 'Kardiyoloji', date: '2026-01-15', time: '09:00', type: 'Kontrol', status: 'confirmed', phone: '0532 111 2233' },
  { id: 2, patient: 'Fatma Demir', doctor: 'Dr. Kaya', dept: 'Dahiliye', date: '2026-01-15', time: '09:30', type: 'İlk Muayene', status: 'confirmed', phone: '0535 444 5566' },
  { id: 3, patient: 'Mehmet Çelik', doctor: 'Dr. Yıldız', dept: 'Genel Cerrahi', date: '2026-01-15', time: '10:00', type: 'Kontrol', status: 'waiting', phone: '0542 777 8899' },
  { id: 4, patient: 'Ayşe Korkmaz', doctor: 'Dr. Arslan', dept: 'Kardiyoloji', date: '2026-01-15', time: '10:30', type: 'Kontrol', status: 'examining', phone: '0538 222 3344' },
  { id: 5, patient: 'Hasan Aydın', doctor: 'Dr. Öztürk', dept: 'Göğüs Hast.', date: '2026-01-15', time: '11:00', type: 'İlk Muayene', status: 'confirmed', phone: '0544 666 7788' },
  { id: 6, patient: 'Zeynep Kara', doctor: 'Dr. Kaya', dept: 'Dahiliye', date: '2026-01-15', time: '11:30', type: 'Takip', status: 'completed', phone: '0536 999 0011' },
  { id: 7, patient: 'Ali Yıldırım', doctor: 'Dr. Yılmaz', dept: 'Nöroloji', date: '2026-01-15', time: '13:00', type: 'İlk Muayene', status: 'confirmed', phone: '0533 123 4567' },
  { id: 8, patient: 'Elif Şahin', doctor: 'Dr. Arslan', dept: 'Kardiyoloji', date: '2026-01-15', time: '13:30', type: 'Kontrol', status: 'cancelled', phone: '0537 890 1234' },
];

const doctors = [
  { name: 'Dr. Arslan', dept: 'Kardiyoloji', slots: ['09:00','09:30','10:00','10:30','11:00','13:00','13:30','14:00'] },
  { name: 'Dr. Kaya', dept: 'Dahiliye', slots: ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30'] },
  { name: 'Dr. Yıldız', dept: 'Genel Cerrahi', slots: ['09:00','09:30','10:00','10:30','11:00'] },
  { name: 'Dr. Öztürk', dept: 'Göğüs Hast.', slots: ['09:00','10:00','11:00','13:00','14:00'] },
  { name: 'Dr. Yılmaz', dept: 'Nöroloji', slots: ['09:00','09:30','10:00','10:30','11:00','11:30'] },
];

export function renderAppointmentsPage(el) {
  const today = appointments.filter(a => a.date === '2026-01-15');
  const waiting = today.filter(a => a.status === 'waiting' || a.status === 'examining').length;
  const confirmed = today.filter(a => a.status === 'confirmed').length;
  const completed = today.filter(a => a.status === 'completed').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🏥 Poliklinik Randevu Sistemi</h1>
      <p class="text-slate-400 text-sm mt-1">Randevu yönetimi, doktor müsaitlik, bekleme listesi</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${today.length}</p><p class="text-xs text-slate-400">Bugünkü Randevu</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${waiting}</p><p class="text-xs text-slate-400">Bekleyen/Muayenede</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${confirmed}</p><p class="text-xs text-slate-400">Onaylı</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">Tamamlanan</p></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
      <div class="lg:col-span-2 card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">📋 Bugünkü Randevular</h3>
          <button id="appointment-add" class="btn-primary text-xs">➕ Randevu</button>
        </div>
        <div class="space-y-2">
          ${appointments.map(a => `
            <div class="flex items-center gap-3 rounded-xl ${a.status === 'examining' ? 'bg-blue-500/10 border border-blue-500/20' : a.status === 'waiting' ? 'bg-amber-500/10 border border-amber-500/20' : a.status === 'cancelled' ? 'bg-red-500/5 border border-red-500/10 opacity-60' : a.status === 'completed' ? 'bg-green-500/5 border border-green-500/10' : 'bg-white/5 border border-white/10'} p-3">
              <div class="text-center min-w-[60px]">
                <p class="text-lg font-bold text-white">${a.time}</p>
                <p class="text-[10px] text-slate-500">${a.type}</p>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-white">${a.patient}</p>
                <p class="text-xs text-slate-400">${a.doctor} · ${a.dept}</p>
              </div>
              <span class="badge text-xs ${a.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300' : a.status === 'waiting' ? 'bg-amber-500/20 text-amber-300' : a.status === 'examining' ? 'bg-purple-500/20 text-purple-300' : a.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}">
                ${a.status === 'confirmed' ? 'Onaylı' : a.status === 'waiting' ? 'Bekliyor' : a.status === 'examining' ? 'Muayenede' : a.status === 'completed' ? 'Tamamlandı' : 'İptal'}
              </span>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🩺 Doktor Müsaitlik</h3>
        <div class="space-y-3">
          ${doctors.map(d => {
            const taken = appointments.filter(a => a.doctor === d.name && a.status !== 'cancelled').map(a => a.time);
            const available = d.slots.filter(s => !taken.includes(s));
            return `
            <div class="rounded-xl bg-white/5 border border-white/10 p-3">
              <p class="text-sm font-medium text-white">${d.name}</p>
              <p class="text-xs text-slate-400 mb-2">${d.dept}</p>
              <div class="flex flex-wrap gap-1">
                ${d.slots.map(s => {
                  const isTaken = taken.includes(s);
                  return `<span class="text-[10px] px-2 py-0.5 rounded-full ${isTaken ? 'bg-red-500/20 text-red-300 line-through' : 'bg-green-500/20 text-green-300'}">${s}</span>`;
                }).join('')}
              </div>
              <p class="text-[10px] text-slate-500 mt-1">${available.length}/${d.slots.length} müsait</p>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  el.querySelector('#appointment-add')?.addEventListener('click', () => openAppointmentForm(el));
}

function openAppointmentForm(el) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fixed inset-0 z-50 m-auto w-[min(92vw,460px)] rounded-2xl border border-white/10 bg-slate-900 p-0 text-slate-100 shadow-2xl';
  dialog.innerHTML = `<form method="dialog" class="p-6"><h2 class="text-lg font-bold text-white">Yeni Randevu</h2><p class="text-xs text-slate-400 mt-1 mb-4">Hasta ve doktor bilgilerini girin.</p><div class="space-y-3"><label class="label">Hasta adı<input id="ap-patient" class="input-field w-full" required></label><label class="label">Doktor<select id="ap-doctor" class="input-field w-full">${doctors.map(d => `<option value="${d.name}" data-dept="${d.dept}">${d.name} · ${d.dept}</option>`).join('')}</select></label><div class="grid grid-cols-2 gap-3"><label class="label">Tarih<input id="ap-date" type="date" class="input-field w-full" required></label><label class="label">Saat<input id="ap-time" type="time" class="input-field w-full" required></label></div><label class="label">Randevu türü<select id="ap-type" class="input-field w-full"><option>İlk Muayene</option><option>Kontrol</option><option>Takip</option></select></label></div><div class="flex gap-2 mt-5"><button value="cancel" class="btn-secondary flex-1">İptal</button><button id="ap-save" value="default" class="btn-primary flex-1">Kaydet</button></div></form>`;
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector('#ap-date').value = new Date().toISOString().slice(0, 10);
  dialog.querySelector('#ap-save').addEventListener('click', event => {
    const patient = dialog.querySelector('#ap-patient').value.trim();
    if (!patient) return;
    const doctor = dialog.querySelector('#ap-doctor');
    const option = doctor.options[doctor.selectedIndex];
    appointments.push({ id: Date.now(), patient, doctor: doctor.value, dept: option.dataset.dept, date: dialog.querySelector('#ap-date').value, time: dialog.querySelector('#ap-time').value || '09:00', type: dialog.querySelector('#ap-type').value, status: 'confirmed', phone: '' });
    event.preventDefault(); dialog.close(); dialog.remove(); renderAppointmentsPage(el);
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
}
