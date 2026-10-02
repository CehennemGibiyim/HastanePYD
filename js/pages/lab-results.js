// ===== LABORATUVAR BİLGİ SİSTEMİ =====
const labTests = [
  { id: 'LAB-001', patient: 'Ahmet Yılmaz', tc: '12345678901', doctor: 'Dr. Arslan', test: 'Tam Kan Sayımı', date: '2026-01-10', status: 'completed', result: 'WBC: 7.2, HGB: 14.1, PLT: 245', abnormal: false },
  { id: 'LAB-002', patient: 'Fatma Demir', tc: '23456789012', doctor: 'Dr. Kaya', test: 'Biyokimya Paneli', date: '2026-01-11', status: 'completed', result: 'Glukoz: 182 ↑, Üre: 42, Kreatinin: 1.1', abnormal: true },
  { id: 'LAB-003', patient: 'Mehmet Çelik', tc: '34567890123', doctor: 'Dr. Yıldız', test: 'Tiroid Paneli', date: '2026-01-12', status: 'pending', result: 'Bekleniyor', abnormal: false },
  { id: 'LAB-004', patient: 'Ayşe Korkmaz', tc: '45678901234', doctor: 'Dr. Arslan', test: 'HbA1c', date: '2026-01-10', status: 'completed', result: 'HbA1c: 7.8 ↑', abnormal: true },
  { id: 'LAB-005', patient: 'Hasan Aydın', tc: '56789012345', doctor: 'Dr. Öztürk', test: 'İdrar Kültürü', date: '2026-01-11', status: 'in-progress', result: 'Analiz aşamasında', abnormal: false },
  { id: 'LAB-006', patient: 'Zeynep Kara', tc: '67890123456', doctor: 'Dr. Kaya', test: 'Sedimantasyon', date: '2026-01-09', status: 'completed', result: 'ESR: 28 ↑', abnormal: true },
  { id: 'LAB-007', patient: 'Ali Yıldırım', tc: '78901234567', doctor: 'Dr. Yıldız', test: 'Koagülasyon', date: '2026-01-12', status: 'pending', result: 'Bekleniyor', abnormal: false },
  { id: 'LAB-008', patient: 'Elif Şahin', tc: '89012345678', doctor: 'Dr. Arslan', test: 'Lipid Paneli', date: '2026-01-10', status: 'completed', result: 'LDL: 165 ↑, HDL: 42, TG: 210 ↑', abnormal: true },
];

const testCatalog = [
  { name: 'Tam Kan Sayımı (CBC)', code: 'CBC', dept: 'Hematoloji', turnaround: '2 saat', price: '₺45' },
  { name: 'Biyokimya Paneli', code: 'BIO', dept: 'Biyokimya', turnaround: '4 saat', price: '₺120' },
  { name: 'Tiroid Paneli (TSH, fT3, fT4)', code: 'TSH', dept: 'Endokrin', turnaround: '6 saat', price: '₺85' },
  { name: 'HbA1c', code: 'HBA1C', dept: 'Biyokimya', turnaround: '4 saat', price: '₺60' },
  { name: 'İdrar Kültürü', code: 'UCX', dept: 'Mikrobiyoloji', turnaround: '48 saat', price: '₺55' },
  { name: 'Sedimantasyon (ESR)', code: 'ESR', dept: 'Hematoloji', turnaround: '1 saat', price: '₺25' },
  { name: 'Koagülasyon (PT, aPTT)', code: 'COAG', dept: 'Hematoloji', turnaround: '2 saat', price: '₺50' },
  { name: 'Lipid Paneli', code: 'LIPID', dept: 'Biyokimya', turnaround: '4 saat', price: '₺75' },
  { name: 'Karaciğer Fonksiyon', code: 'LFT', dept: 'Biyokimya', turnaround: '4 saat', price: '₺65' },
  { name: 'Böbrek Fonksiyon', code: 'RFT', dept: 'Biyokimya', turnaround: '4 saat', price: '₺55' },
];

export function renderLabResultsPage(el) {
  const completed = labTests.filter(t => t.status === 'completed').length;
  const abnormal = labTests.filter(t => t.abnormal).length;
  const pending = labTests.filter(t => t.status === 'pending').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🔬 Laboratuvar Bilgi Sistemi</h1>
      <p class="text-slate-400 text-sm mt-1">Test isteme, sonuç girme, referans aralığı takibi</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${labTests.length}</p><p class="text-xs text-slate-400">Toplam Test</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">Tamamlanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${pending}</p><p class="text-xs text-slate-400">Bekleyen</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${abnormal}</p><p class="text-xs text-slate-400">Anormal Sonuç</p></div>
    </div>

    <div class="flex gap-2 mb-4 fade-in flex-wrap">
      <button class="tab-active" onclick="document.getElementById('lab-results').classList.remove('hidden');document.getElementById('lab-catalog').classList.add('hidden')">📋 Sonuçlar</button>
      <button class="tab-inactive" onclick="document.getElementById('lab-catalog').classList.remove('hidden');document.getElementById('lab-results').classList.add('hidden')">📚 Test Kataloğu</button>
    </div>

    <div id="lab-results" class="card fade-in">
      <div class="flex items-center gap-3 mb-4">
        <input type="text" class="input-field flex-1" placeholder="🔍 Hasta, test veya doktor ara...">
        <button class="btn-primary" onclick="alert('Yeni test isteği formu burada açılacak')">➕ Test İste</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">ID</th><th class="th">Hasta</th><th class="th">Test</th><th class="th">Doktor</th><th class="th">Sonuç</th><th class="th">Tarih</th><th class="th">Durum</th></tr></thead>
          <tbody>${labTests.map(t => `
            <tr class="border-t border-white/5 hover:bg-white/5 ${t.abnormal ? 'bg-red-500/5' : ''}">
              <td class="td font-mono text-xs">${t.id}</td>
              <td class="td font-medium">${t.patient}</td>
              <td class="td"><span class="badge">${t.test}</span></td>
              <td class="td">${t.doctor}</td>
              <td class="td text-xs ${t.abnormal ? 'text-red-300 font-medium' : ''}">${t.result}</td>
              <td class="td text-xs">${t.date}</td>
              <td class="td">${t.status === 'completed' ? '<span class="badge bg-green-500/20 text-green-300">Tamamlandı</span>' : t.status === 'in-progress' ? '<span class="badge bg-blue-500/20 text-blue-300">İşleniyor</span>' : '<span class="badge bg-amber-500/20 text-amber-300">Bekliyor</span>'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="lab-catalog" class="card fade-in hidden">
      <h3 class="text-lg font-semibold text-white mb-4">📚 Test Kataloğu</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Test</th><th class="th">Kod</th><th class="th">Bölüm</th><th class="th">Süre</th><th class="th">Fiyat</th></tr></thead>
          <tbody>${testCatalog.map(t => `
            <tr class="border-t border-white/5 hover:bg-white/5">
              <td class="td font-medium">${t.name}</td>
              <td class="td font-mono text-cyan-300">${t.code}</td>
              <td class="td"><span class="badge">${t.dept}</span></td>
              <td class="td text-xs">${t.turnaround}</td>
              <td class="td font-medium">${t.price}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}
