// ===== DÖKÜMAN YÖNETİM SİSTEMİ =====
const documents = [
  { id: 'DYS-001', title: 'Hasta Kabul Prosedürü', category: 'Prosedür', version: '3.2', effectiveDate: '2025-06-01', reviewDate: '2026-06-01', owner: 'Başhekim Yrd.', status: 'active' },
  { id: 'DYS-002', title: 'El Hijyeni Talimatı', category: 'Talimat', version: '2.1', effectiveDate: '2025-09-15', reviewDate: '2026-03-15', owner: 'Enfeksiyon Komitesi', status: 'active' },
  { id: 'DYS-003', title: 'Acil Durum Tahliye Planı', category: 'Politika', version: '4.0', effectiveDate: '2025-01-01', reviewDate: '2026-01-01', owner: 'Güvenlik Müdürü', status: 'under-review' },
  { id: 'DYS-004', title: 'İlaç Yönetimi Formu', category: 'Form', version: '1.5', effectiveDate: '2025-11-01', reviewDate: '2026-05-01', owner: 'Eczacıbaşı', status: 'active' },
  { id: 'DYS-005', title: 'Hasta Güvenliği Politikası', category: 'Politika', version: '2.3', effectiveDate: '2025-08-01', reviewDate: '2026-02-01', owner: 'Kalite Müdürü', status: 'expired' },
  { id: 'DYS-006', title: 'Sterilizasyon Protokolü', category: 'Protokol', version: '3.0', effectiveDate: '2025-10-01', reviewDate: '2026-04-01', owner: 'CSSD Sorumlusu', status: 'active' },
  { id: 'DYS-007', title: 'Kan Ürünü Transfüzyon Talimatı', category: 'Talimat', version: '2.0', effectiveDate: '2025-07-01', reviewDate: '2026-07-01', owner: 'Kan Bankası', status: 'active' },
  { id: 'DYS-008', title: 'Ameliyat Güvenlik Checklist', category: 'Form', version: '1.8', effectiveDate: '2025-12-01', reviewDate: '2026-06-01', owner: 'Ameliyathane Şefi', status: 'active' },
];

const categories = ['Prosedür', 'Talimat', 'Politika', 'Form', 'Protokol'];

export function renderDocumentManagementPage(el) {
  const active = documents.filter(d => d.status === 'active').length;
  const underReview = documents.filter(d => d.status === 'under-review').length;
  const expired = documents.filter(d => d.status === 'expired').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📄 Döküman Yönetim Sistemi</h1>
      <p class="text-slate-400 text-sm mt-1">Prosedür, talimat, form, politika yaşam döngüsü yönetimi</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${documents.length}</p><p class="text-xs text-slate-400">Toplam Döküman</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${active}</p><p class="text-xs text-slate-400">Aktif</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${underReview}</p><p class="text-xs text-slate-400">İncelemede</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${expired}</p><p class="text-xs text-slate-400">Süresi Dolmuş</p></div>
    </div>
    <div class="card fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">📋 Döküman Listesi</h3>
        <button class="btn-primary text-xs" onclick="alert('Yeni döküman ekleme formu')">➕ Yeni Döküman</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">ID</th><th class="th">Başlık</th><th class="th">Kategori</th><th class="th">Versiyon</th><th class="th">Sorumlu</th><th class="th">Yürürlük</th><th class="th">Gözden Geçirme</th><th class="th">Durum</th></tr></thead>
          <tbody>${documents.map(d => `<tr class="border-t border-white/5 hover:bg-white/5 ${d.status==='expired'?'bg-red-500/5':''}">
            <td class="td font-mono text-xs">${d.id}</td>
            <td class="td font-medium">${d.title}</td>
            <td class="td"><span class="badge">${d.category}</span></td>
            <td class="td text-center">v${d.version}</td>
            <td class="td text-xs">${d.owner}</td>
            <td class="td text-xs">${d.effectiveDate}</td>
            <td class="td text-xs ${new Date(d.reviewDate) < new Date() ? 'text-red-300 font-bold' : ''}">${d.reviewDate}</td>
            <td class="td">${d.status==='active'?'<span class="badge bg-green-500/20 text-green-300">Aktif</span>':d.status==='under-review'?'<span class="badge bg-blue-500/20 text-blue-300">İncelemede</span>':'<span class="badge bg-red-500/20 text-red-300">Süresi Dolmuş</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}
