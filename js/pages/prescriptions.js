// ===== REÇETE & İLAÇ YÖNETİMİ =====
let prescriptions = [
  { id: 1, patient: 'Ahmet Yılmaz', tc: '12345678901', doctor: 'Dr. Arslan', date: '2026-01-10', drugs: ['Metformin 500mg', 'Lisinopril 10mg'], diagnosis: 'Diyabet Tip 2 + HT', status: 'active', pharmacy: 'Ana Eczane' },
  { id: 2, patient: 'Fatma Demir', tc: '23456789012', doctor: 'Dr. Kaya', date: '2026-01-09', drugs: ['Amoksisilin 1g', 'Parol 500mg'], diagnosis: 'ÜSYE', status: 'completed', pharmacy: 'Ana Eczane' },
  { id: 3, patient: 'Mehmet Çelik', tc: '34567890123', doctor: 'Dr. Yıldız', date: '2026-01-11', drugs: ['Omeprazol 20mg', 'Debridat 200mg'], diagnosis: 'Gastrit', status: 'active', pharmacy: 'Poliklinik Eczane' },
  { id: 4, patient: 'Ayşe Korkmaz', tc: '45678901234', doctor: 'Dr. Arslan', date: '2026-01-08', drugs: ['Amlodipin 5mg', 'Aspirin 100mg', 'Atorvastatin 20mg'], diagnosis: 'Koroner Arter', status: 'completed', pharmacy: 'Ana Eczane' },
  { id: 5, patient: 'Hasan Aydın', tc: '56789012345', doctor: 'Dr. Öztürk', date: '2026-01-12', drugs: ['Salbutamol Inhaler', 'Budesonid Inhaler'], diagnosis: 'Astım', status: 'active', pharmacy: 'Ana Eczane' },
  { id: 6, patient: 'Zeynep Kara', tc: '67890123456', doctor: 'Dr. Kaya', date: '2026-01-07', drugs: ['Levotiron 50mcg'], diagnosis: 'Hipotiroidi', status: 'completed', pharmacy: 'Poliklinik Eczane' },
];

const drugDatabase = [
  { name: 'Metformin 500mg', group: 'Antidiabetik', interaction: 'Alkol ile dikkat', stock: 1250 },
  { name: 'Lisinopril 10mg', group: 'ACE İnhibitör', interaction: 'Potasyum takviyesi ile dikkat', stock: 890 },
  { name: 'Amoksisilin 1g', group: 'Antibiyotik', interaction: 'Penisilin alerjisi kontrolü', stock: 2100 },
  { name: 'Parol 500mg', group: 'Analjezik', interaction: 'Karaciğer yetmezliğinde dikkat', stock: 5000 },
  { name: 'Omeprazol 20mg', group: 'PPI', interaction: 'Clopidogrel ile dikkat', stock: 1800 },
  { name: 'Amlodipin 5mg', group: 'KKB', interaction: 'Greyfurt ile dikkat', stock: 950 },
  { name: 'Aspirin 100mg', group: 'Antiplatelet', interaction: 'Kanama riski', stock: 3200 },
  { name: 'Atorvastatin 20mg', group: 'Statin', interaction: 'Greyfurt ile dikkat', stock: 1100 },
  { name: 'Salbutamol Inhaler', group: 'Bronkodilatör', interaction: 'Beta-bloker ile dikkat', stock: 450 },
  { name: 'Budesonid Inhaler', group: 'Kortikosteroid', interaction: 'Mantar enfeksiyonu riski', stock: 380 },
  { name: 'Levotiron 50mcg', group: 'Tiroid', interaction: 'Kalsiyum ile 4 saat ara', stock: 670 },
  { name: 'Debridat 200mg', group: 'Antispazmodik', interaction: 'Bilinen önemli etkileşim yok', stock: 920 },
];

export function renderPrescriptionsPage(el) {
  const active = prescriptions.filter(p => p.status === 'active').length;
  const totalDrugs = drugDatabase.reduce((s, d) => s + d.stock, 0);
  const lowStock = drugDatabase.filter(d => d.stock < 500).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">💊 Reçete & İlaç Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">E-reçete yazma, ilaç envanteri, etkileşim kontrolü</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${prescriptions.length}</p><p class="text-xs text-slate-400">Toplam Reçete</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${active}</p><p class="text-xs text-slate-400">Aktif Reçete</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${totalDrugs.toLocaleString('tr-TR')}</p><p class="text-xs text-slate-400">İlaç Stok</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${lowStock}</p><p class="text-xs text-slate-400">Kritik Stok</p></div>
    </div>

    <div class="flex gap-2 mb-4 fade-in flex-wrap">
      <button onclick="document.getElementById('rx-table').classList.remove('hidden');document.getElementById('drug-table').classList.add('hidden')" class="tab-active">📋 Reçeteler</button>
      <button onclick="document.getElementById('drug-table').classList.remove('hidden');document.getElementById('rx-table').classList.add('hidden')" class="tab-inactive">💊 İlaç Deposu</button>
    </div>

    <div id="rx-table" class="card fade-in">
      <div class="flex items-center gap-3 mb-4">
        <input type="text" id="rx-search" class="input-field flex-1" placeholder="🔍 Hasta, doktor veya tanı ara...">
        <button id="prescription-add" class="btn-primary">➕ Yeni Reçete</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Hasta</th><th class="th">Doktor</th><th class="th">Tanı</th><th class="th">İlaçlar</th><th class="th">Tarih</th><th class="th">Durum</th></tr></thead>
          <tbody>${prescriptions.map(rx => `
            <tr class="border-t border-white/5 hover:bg-white/5">
              <td class="td font-medium">${rx.patient}</td>
              <td class="td">${rx.doctor}</td>
              <td class="td">${rx.diagnosis}</td>
              <td class="td"><div class="flex flex-wrap gap-1">${rx.drugs.map(d => `<span class="badge text-xs">${d}</span>`).join('')}</div></td>
              <td class="td text-xs">${rx.date}</td>
              <td class="td"><span class="badge ${rx.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-400'}">${rx.status === 'active' ? 'Aktif' : 'Tamamlandı'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="drug-table" class="card fade-in hidden">
      <h3 class="text-lg font-semibold text-white mb-4">💊 İlaç Veritabanı</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">İlaç</th><th class="th">Grup</th><th class="th">Stok</th><th class="th">Etkileşim</th><th class="th">Durum</th></tr></thead>
          <tbody>${drugDatabase.map(d => `
            <tr class="border-t border-white/5 hover:bg-white/5">
              <td class="td font-medium">${d.name}</td>
              <td class="td"><span class="badge">${d.group}</span></td>
              <td class="td font-mono">${d.stock}</td>
              <td class="td text-xs text-amber-300">${d.interaction}</td>
              <td class="td">${d.stock < 500 ? '<span class="badge bg-red-500/20 text-red-300">Kritik</span>' : d.stock < 1000 ? '<span class="badge bg-amber-500/20 text-amber-300">Düşük</span>' : '<span class="badge bg-green-500/20 text-green-300">Yeterli</span>'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
    el.querySelector('#prescription-add')?.addEventListener('click', () => openPrescriptionForm(el));
}

function openPrescriptionForm(el) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fixed inset-0 z-50 m-auto w-[min(92vw,480px)] rounded-2xl border border-white/10 bg-slate-900 p-0 text-slate-100 shadow-2xl';
  dialog.innerHTML = `<form method="dialog" class="p-6"><h2 class="text-lg font-bold text-white">Yeni Reçete</h2><div class="space-y-3 mt-4"><label class="label">Hasta adı<input id="rx-patient" class="input-field w-full" required></label><label class="label">Doktor<input id="rx-doctor" class="input-field w-full" required></label><label class="label">Tanı<input id="rx-diagnosis" class="input-field w-full" required></label><label class="label">İlaçlar<input id="rx-drugs" class="input-field w-full" placeholder="İlaçları virgülle ayırın" required></label></div><div class="flex gap-2 mt-5"><button value="cancel" class="btn-secondary flex-1">İptal</button><button id="rx-save" class="btn-primary flex-1">Kaydet</button></div></form>`;
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('#rx-save').addEventListener('click', event => {
    const patient = dialog.querySelector('#rx-patient').value.trim(); const drugs = dialog.querySelector('#rx-drugs').value.split(',').map(v => v.trim()).filter(Boolean);
    if (!patient || !drugs.length) return;
    prescriptions.unshift({ id: Date.now(), patient, tc: '', doctor: dialog.querySelector('#rx-doctor').value.trim(), date: new Date().toISOString().slice(0, 10), drugs, diagnosis: dialog.querySelector('#rx-diagnosis').value.trim(), status: 'active', pharmacy: 'Ana Eczane' });
    event.preventDefault(); dialog.close(); dialog.remove(); renderPrescriptionsPage(el);
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
}
