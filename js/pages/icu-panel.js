// ===== YOĞUN BAKIM PANELİ (ICU) =====
const STORAGE_KEY = 'icu_panel';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, patientName: 'Osman Bey', age: 78, bed: 'ICU-01', diagnosis: 'Sepsis', admitDate: '2026-07-10', doctor: 'Dr. Arslan', nurse: 'Hemşire Ayşe',
      vitals: { hr: 110, bp: '85/50', spo2: 88, temp: 38.9, gcs: 10, urine: 20 },
      devices: ['Ventilatör', 'Merkezi venöz kateter', 'Arterial hat', 'Foley kateter'],
      medications: ['Noradrenalin 0.1mcg/kg/min', 'Meropenem 1g 3x1', 'Sıfırlama 100ml/saat'],
      status: 'critical', notes: 'Hemodinamik instabil, yakın takip' },
    { id: 2, patientName: 'Hasan Kara', age: 65, bed: 'ICU-02', diagnosis: 'Post-op kalp cerrahisi', admitDate: '2026-07-12', doctor: 'Dr. Kaya', nurse: 'Hemşire Fatma',
      vitals: { hr: 82, bp: '120/75', spo2: 96, temp: 36.8, gcs: 15, urine: 50 },
      devices: ['Ventilatör (weaning)', 'Drenaj', 'Pacemaker hazır'],
      medications: ['Dopamin 5mcg/kg/min', 'Amiodaron 200mg', 'Enoxaparin 40mg'],
      status: 'stable', notes: 'Weaning protokolü başlatıldı' },
    { id: 3, patientName: 'Zeynep Şahin', age: 45, bed: 'ICU-03', diagnosis: 'ARDS', admitDate: '2026-07-11', doctor: 'Dr. Yıldız', nurse: 'Hemşire Zeynep',
      vitals: { hr: 95, bp: '110/70', spo2: 91, temp: 37.5, gcs: 13, urine: 35 },
      devices: ['Ventilatör (proning)', 'Merkezi venöz kateter', 'Arterial hat'],
      medications: ['Sedasyon (Propofol)', 'Sisatracurium', 'Methylprednisolone'],
      status: 'critical', notes: 'Proning pozisyonunda, PaO2/FiO2: 120' },
  ];
  saveData(d); return d;
}
const STATUS_COLORS = { critical: { label: 'Kritik', color: 'red' }, stable: { label: 'Stabil', color: 'green' }, improving: { label: 'İyileşiyor', color: 'blue' }, weaning: { label: 'Weaning', color: 'amber' } };

export function renderICUPanelPage(el) {
  let data = getData();
  function render() {
    const critical = data.filter(d => d.status === 'critical').length;
    const stable = data.filter(d => d.status === 'stable').length;
    const ventCount = data.filter(d => d.devices.some(dev => dev.toLowerCase().includes('ventilatör'))).length;
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">🏥 Yoğun Bakım Paneli</h1><p class="text-slate-400 text-sm mt-1">Yatak bazlı hasta monitörizasyonu</p></div>
        <button id="add-icu-btn" class="btn-primary">+ Hasta Ekle</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${data.length}</p><p class="text-xs text-slate-400">🛏️ Toplam Yatak</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-red-300">${critical}</p><p class="text-xs text-slate-400">🔴 Kritik</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-green-300">${stable}</p><p class="text-xs text-slate-400">🟢 Stabil</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${ventCount}</p><p class="text-xs text-slate-400">🫁 Ventilatör</p></div>
      </div>
      <div class="space-y-4">${data.map(d => {
        const st = STATUS_COLORS[d.status] || { label: d.status, color: 'slate' };
        const hrColor = d.vitals.hr > 100 ? 'text-red-300' : d.vitals.hr < 60 ? 'text-amber-300' : 'text-green-300';
        const spo2Color = d.vitals.spo2 < 90 ? 'text-red-300' : d.vitals.spo2 < 95 ? 'text-amber-300' : 'text-green-300';
        return `<div class="card border-l-4 border-${st.color}-500">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1"><h3 class="text-xl font-bold text-white">${d.patientName}</h3><span class="badge bg-${st.color}-500/20 text-${st.color}-300">${st.label}</span><span class="badge bg-white/10">${d.bed}</span></div>
              <p class="text-xs text-slate-400">${d.age} yaş · ${d.diagnosis} · 🩺 ${d.doctor} · 👩‍⚕️ ${d.nurse} · 📅 ${d.admitDate}</p>
            </div>
          </div>
          <div class="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
            <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-xs text-slate-500">HR</p><p class="text-lg font-bold ${hrColor}">${d.vitals.hr}</p></div>
            <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-xs text-slate-500">BP</p><p class="text-lg font-bold text-white">${d.vitals.bp}</p></div>
            <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-xs text-slate-500">SpO2</p><p class="text-lg font-bold ${spo2Color}">${d.vitals.spo2}%</p></div>
            <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-xs text-slate-500">Temp</p><p class="text-lg font-bold ${d.vitals.temp > 38 ? 'text-red-300' : 'text-white'}">${d.vitals.temp}°</p></div>
            <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-xs text-slate-500">GCS</p><p class="text-lg font-bold ${d.vitals.gcs < 12 ? 'text-red-300' : 'text-white'}">${d.vitals.gcs}</p></div>
            <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-xs text-slate-500">Üriner</p><p class="text-lg font-bold ${d.vitals.urine < 30 ? 'text-red-300' : 'text-green-300'}">${d.vitals.urine}ml/s</p></div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded-lg bg-blue-500/10 p-2"><p class="text-xs font-bold text-blue-300 mb-1">🔧 Cihazlar</p>${d.devices.map(dev => `<span class="inline-block text-xs bg-white/5 rounded px-2 py-0.5 mr-1 mb-1">${dev}</span>`).join('')}</div>
            <div class="rounded-lg bg-purple-500/10 p-2"><p class="text-xs font-bold text-purple-300 mb-1">💊 İlaçlar</p>${d.medications.map(m => `<p class="text-xs text-slate-300">• ${m}</p>`).join('')}</div>
            <div class="rounded-lg bg-amber-500/10 p-2"><p class="text-xs font-bold text-amber-300 mb-1">📝 Notlar</p><p class="text-xs text-slate-300">${d.notes || '—'}</p></div>
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
    document.getElementById('add-icu-btn')?.addEventListener('click', () => openICUForm(el, data));
  }
  render();
}

function openICUForm(el, data) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fixed inset-0 z-50 m-auto w-[min(92vw,520px)] rounded-2xl border border-white/10 bg-slate-900 p-0 text-slate-100 shadow-2xl';
  dialog.innerHTML = `<form method="dialog" class="p-6"><h2 class="text-lg font-bold text-white">Yoğun Bakıma Hasta Ekle</h2><div class="space-y-3 mt-4"><label class="label">Hasta adı<input id="icu-name" class="input-field w-full" required></label><div class="grid grid-cols-2 gap-3"><label class="label">Yaş<input id="icu-age" type="number" min="0" max="120" class="input-field w-full" required></label><label class="label">Yatak<input id="icu-bed" class="input-field w-full" placeholder="ICU-04" required></label></div><label class="label">Tanı<input id="icu-diagnosis" class="input-field w-full" required></label><label class="label">Sorumlu hekim<input id="icu-doctor" class="input-field w-full" required></label><label class="label">Not<textarea id="icu-notes" class="input-field w-full" rows="2"></textarea></label></div><div class="flex gap-2 mt-5"><button value="cancel" class="btn-secondary flex-1">İptal</button><button id="icu-save" class="btn-primary flex-1">Kaydet</button></div></form>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('#icu-save').addEventListener('click', event => {
    const name = dialog.querySelector('#icu-name').value.trim(); if (!name) return;
    data.push({ id: Date.now(), patientName: name, age: Number(dialog.querySelector('#icu-age').value || 0), bed: dialog.querySelector('#icu-bed').value.trim(), diagnosis: dialog.querySelector('#icu-diagnosis').value.trim(), admitDate: new Date().toISOString().slice(0, 10), doctor: dialog.querySelector('#icu-doctor').value.trim(), nurse: 'Atanmadı', vitals: { hr: 0, bp: '—', spo2: 0, temp: 0, gcs: 0, urine: 0 }, devices: [], medications: [], status: 'stable', notes: dialog.querySelector('#icu-notes').value.trim() });
    saveData(data); event.preventDefault(); dialog.close(); dialog.remove(); renderICUPanelPage(el);
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
}
