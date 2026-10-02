// ===== DÜZELTİCİ/ÖNLEYİCİ FAALİYET (CAPA) =====
const capaRecords = [
  { id: 'CAPA-001', source: 'Hasta Güvenliği Olayı', title: 'İlaç doz hatası önleme', severity: 'high', assignee: 'Eczacıbaşı', dueDate: '2026-02-15', status: 'in-progress', actions: ['Barkodlu ilaç doğrulama sistemi kuruldu', 'Hemşire eğitimi planlandı (15 Ocak)'], verification: '' },
  { id: 'CAPA-002', source: 'İç Denetim', title: 'Sterilizasyon kayıt eksikliği', severity: 'medium', assignee: 'CSSD Sorumlusu', dueDate: '2026-01-31', status: 'completed', actions: ['Dijital kayıt sistemi devreye alındı', 'Haftalık audit planlandı'], verification: 'Başarılı - 3 denetim geçildi' },
  { id: 'CAPA-003', source: 'Hasta Şikayeti', title: 'Bekleme süresi azaltma', severity: 'medium', assignee: 'Başhekim Yrd.', dueDate: '2026-03-01', status: 'planning', actions: ['Randevu sistemi optimizasyonu planlandı'], verification: '' },
  { id: 'CAPA-004', source: 'Enfeksiyon Komitesi', title: 'El hijyeni uyumluluk artırma', severity: 'high', assignee: 'Enfeksiyon Komitesi', dueDate: '2026-02-28', status: 'in-progress', actions: ['Elektronik izleme sistemi kuruldu', 'Eğitimler tamamlandı', 'Haftalık raporlama başlatıldı'], verification: '' },
  { id: 'CAPA-005', source: 'Dış Denetim', title: 'Döküman güncelleme', severity: 'low', assignee: 'Kalite Müdürü', dueDate: '2026-01-31', status: 'completed', actions: ['Tüm prosedürler güncellendi', 'Onay akışı dijitalize edildi'], verification: 'Başarılı' },
];

export function renderCAPAPage(el) {
  const inProgress = capaRecords.filter(r => r.status === 'in-progress').length;
  const completed = capaRecords.filter(r => r.status === 'completed').length;
  const high = capaRecords.filter(r => r.severity === 'high').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🔧 Düzeltici/Önleyici Faaliyet (CAPA)</h1>
      <p class="text-slate-400 text-sm mt-1">CAPA formu, sorumlu, termin, doğrulama, sürekli iyileştirme</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${capaRecords.length}</p><p class="text-xs text-slate-400">Toplam CAPA</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${inProgress}</p><p class="text-xs text-slate-400">Devam Eden</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">Tamamlanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${high}</p><p class="text-xs text-slate-400">Yüksek Öncelik</p></div>
    </div>
    <div class="space-y-4 fade-in">
      ${capaRecords.map(c => `
        <div class="card ${c.severity === 'high' ? 'border-red-500/20' : c.severity === 'medium' ? 'border-amber-500/20' : ''}">
          <div class="flex items-center justify-between mb-3">
            <div>
              <span class="badge mr-2">${c.id}</span>
              <span class="font-medium text-white">${c.title}</span>
            </div>
            <div class="flex gap-2">
              <span class="badge ${c.severity==='high'?'bg-red-500/20 text-red-300':c.severity==='medium'?'bg-amber-500/20 text-amber-300':'bg-green-500/20 text-green-300'}">${c.severity==='high'?'Yüksek':c.severity==='medium'?'Orta':'Düşük'}</span>
              <span class="badge ${c.status==='completed'?'bg-green-500/20 text-green-300':c.status==='in-progress'?'bg-blue-500/20 text-blue-300':'bg-slate-500/20 text-slate-400'}">${c.status==='completed'?'✅ Tamamlandı':c.status==='in-progress'?'🔄 Devam':'📋 Planlama'}</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 mb-2">Kaynak: ${c.source} · Sorumlu: ${c.assignee} · Termin: ${c.dueDate}</p>
          <div class="space-y-1 mb-2">
            ${c.actions.map(a => `<div class="flex items-center gap-2 text-sm text-slate-300"><span class="text-green-400">✓</span>${a}</div>`).join('')}
          </div>
          ${c.verification ? `<p class="text-xs text-green-300">🔍 Doğrulama: ${c.verification}</p>` : ''}
        </div>`).join('')}
    </div>`;
}
