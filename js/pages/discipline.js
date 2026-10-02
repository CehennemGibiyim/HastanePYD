// ===== DİSİPLİN & UYARI SİSTEMİ =====
let disciplinaryRecords = [
  { id: 1, personnel: 'Temizlik Hasan', dept: 'Temizlik', type: 'verbal', reason: 'Gecikmeli gelme (3. kez)', date: '2026-01-05', issuedBy: 'Şef Ayşe', status: 'active', expiryDate: '2026-07-05' },
  { id: 2, personnel: 'Güvenlik Kemal', dept: 'Güvenlik', type: 'written', reason: 'Nöbet terk etme', date: '2025-12-15', issuedBy: 'Müdür Mehmet', status: 'active', expiryDate: '2026-06-15' },
  { id: 3, personnel: 'Hemşire Fatma', dept: 'Dahiliye', type: 'warning', reason: 'İlaç hatası (küçük)', date: '2025-11-20', issuedBy: 'Başhemşire', status: 'expired', expiryDate: '2026-01-20' },
  { id: 4, personnel: 'Tekniker Ali', dept: 'Teknik', type: 'verbal', reason: 'Ekipman hasarı', date: '2026-01-10', issuedBy: 'Şef Veli', status: 'active', expiryDate: '2026-07-10' },
  { id: 5, personnel: 'Mutfak Zeynep', dept: 'Mutfak', type: 'suspension', reason: 'Hijyen kurallarına uymama', date: '2025-10-01', issuedBy: 'Müdür Mehmet', status: 'active', expiryDate: '2026-04-01' },
];

export function renderDisciplinePage(el) {
  const active = disciplinaryRecords.filter(r => r.status === 'active').length;
  const verbal = disciplinaryRecords.filter(r => r.type === 'verbal').length;
  const written = disciplinaryRecords.filter(r => r.type === 'written').length;
  const suspension = disciplinaryRecords.filter(r => r.type === 'suspension').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">⚖️ Disiplin & Uyarı Sistemi</h1>
      <p class="text-slate-400 text-sm mt-1">Yazılı/sözlü uyarı, tutanak, savunma isteme, ceza sicili</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${disciplinaryRecords.length}</p><p class="text-xs text-slate-400">Toplam Kayıt</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${active}</p><p class="text-xs text-slate-400">Aktif Uyarı</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${verbal}</p><p class="text-xs text-slate-400">Sözlü Uyarı</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${suspension}</p><p class="text-xs text-slate-400">Uzaklaştırma</p></div>
    </div>
    <div class="card fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">📋 Disiplin Kayıtları</h3>
        <button id="discipline-add" class="btn-primary text-xs">➕ Yeni Kayıt</button>
      </div>
      <div class="space-y-3">
        ${disciplinaryRecords.map(r => `
          <div class="flex items-center gap-3 rounded-xl ${r.type==='suspension'?'bg-red-500/10 border border-red-500/20':r.type==='written'?'bg-amber-500/10 border border-amber-500/20':'bg-white/5 border border-white/10'} p-4">
            <div class="text-2xl">${r.type==='verbal'?'🗣️':r.type==='written'?'📝':r.type==='warning'?'⚠️':'🚫'}</div>
            <div class="flex-1">
              <p class="text-sm font-medium text-white">${r.personnel} <span class="text-xs text-slate-500">(${r.dept})</span></p>
              <p class="text-xs text-slate-400">${r.reason}</p>
              <p class="text-[10px] text-slate-500 mt-1">Veren: ${r.issuedBy} · ${r.date} · Geçerlilik: ${r.expiryDate}</p>
            </div>
            <span class="badge ${r.type==='verbal'?'bg-blue-500/20 text-blue-300':r.type==='written'?'bg-amber-500/20 text-amber-300':r.type==='warning'?'bg-orange-500/20 text-orange-300':'bg-red-500/20 text-red-300'}">${r.type==='verbal'?'Sözlü':r.type==='written'?'Yazılı':r.type==='warning'?'Uyarı':'Uzaklaştırma'}</span>
            <span class="badge ${r.status==='active'?'bg-green-500/20 text-green-300':'bg-slate-500/20 text-slate-400'}">${r.status==='active'?'Aktif':'Süresi Dolmuş'}</span>
          </div>`).join('')}
      </div>
    </div>`;
    el.querySelector('#discipline-add')?.addEventListener('click', () => openDisciplineForm(el));
}

function openDisciplineForm(el) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fixed inset-0 z-50 m-auto w-[min(92vw,460px)] rounded-2xl border border-white/10 bg-slate-900 p-0 text-slate-100 shadow-2xl';
  dialog.innerHTML = `<form method="dialog" class="p-6"><h2 class="text-lg font-bold text-white">Yeni Disiplin Kaydı</h2><div class="space-y-3 mt-4"><label class="label">Personel<input id="dc-person" class="input-field w-full" required></label><label class="label">Departman<input id="dc-dept" class="input-field w-full" required></label><label class="label">Kayıt türü<select id="dc-type" class="input-field w-full"><option value="verbal">Sözlü Uyarı</option><option value="written">Yazılı Uyarı</option><option value="warning">Uyarı</option><option value="suspension">Uzaklaştırma</option></select></label><label class="label">Gerekçe<textarea id="dc-reason" class="input-field w-full" rows="3" required></textarea></label></div><div class="flex gap-2 mt-5"><button value="cancel" class="btn-secondary flex-1">İptal</button><button id="dc-save" class="btn-primary flex-1">Kaydet</button></div></form>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('#dc-save').addEventListener('click', event => {
    const person = dialog.querySelector('#dc-person').value.trim(); const reason = dialog.querySelector('#dc-reason').value.trim();
    if (!person || !reason) return;
    disciplinaryRecords.unshift({ id: Date.now(), personnel: person, dept: dialog.querySelector('#dc-dept').value.trim() || 'Genel', type: dialog.querySelector('#dc-type').value, reason, date: new Date().toISOString().slice(0, 10), issuedBy: 'Sistem Yöneticisi', status: 'active', expiryDate: '' });
    event.preventDefault(); dialog.close(); dialog.remove(); renderDisciplinePage(el);
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
}
