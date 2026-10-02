// ===== SEM/CME KREDİ TAKİBİ =====
const cmeRecords = [
  { id: 1, personnel: 'Dr. Arslan', dept: 'Kardiyoloji', specialty: 'Kardiyoloji Uzm.', credits: { earned: 45, required: 60, year: 2026 }, activities: [
    { title: 'Kardiyovasküler Cerrahi Kongresi', type: 'Kongre', date: '2025-11-15', credits: 15, category: 'Yüz yüze' },
    { title: 'EKG Yorumlama Webinarı', type: 'Webinar', date: '2025-12-01', credits: 5, category: 'Online' },
    { title: 'Koroner Girişim Workshop', type: 'Workshop', date: '2026-01-10', credits: 10, category: 'Yüz yüze' },
    { title: 'Kalp Yetmezliği Makale', type: 'Yayın', date: '2025-10-20', credits: 15, category: 'Bilimsel' },
  ]},
  { id: 2, personnel: 'Dr. Kaya', dept: 'Dahiliye', specialty: 'İç Hastalıkları Uzm.', credits: { earned: 52, required: 60, year: 2026 }, activities: [
    { title: 'Diyabet Yönetimi Sempozyumu', type: 'Sempozyum', date: '2025-11-20', credits: 12, category: 'Yüz yüze' },
    { title: 'Güncel İlaç Tedavisi', type: 'Online Kurs', date: '2025-12-15', credits: 10, category: 'Online' },
    { title: 'Endokrinoloji Vaka Tartışması', type: 'Vaka', date: '2026-01-05', credits: 8, category: 'Klinik' },
    { title: 'Nefroloji Güncelleme', type: 'Kurs', date: '2026-01-08', credits: 22, category: 'Yüz yüze' },
  ]},
  { id: 3, personnel: 'Hemşire Ayşe', dept: 'Yoğun Bakım', specialty: 'Yoğun Bakım Hemşiresi', credits: { earned: 28, required: 40, year: 2026 }, activities: [
    { title: 'Temel Yaşam Desteği', type: 'Sertifika', date: '2025-09-10', credits: 8, category: 'Uygulamalı' },
    { title: 'İlaç Güvenliği Eğitimi', type: 'Eğitim', date: '2025-11-01', credits: 10, category: 'Online' },
    { title: 'Enfeksiyon Kontrolü', type: 'Seminer', date: '2026-01-12', credits: 10, category: 'Yüz yüze' },
  ]},
];

export function renderCMECreditsPage(el) {
  const totalEarned = cmeRecords.reduce((s, c) => s + c.credits.earned, 0);
  const totalRequired = cmeRecords.reduce((s, c) => s + c.credits.required, 0);
  const compliant = cmeRecords.filter(c => c.credits.earned >= c.credits.required).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🎓 SEM/CME Kredi Takibi</h1>
      <p class="text-slate-400 text-sm mt-1">Sürekli eğitim puanı, zorunlu saatler, akreditasyon uyumluluk</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${cmeRecords.length}</p><p class="text-xs text-slate-400">Personel</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${totalEarned}</p><p class="text-xs text-slate-400">Toplam Kredi</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${totalRequired}</p><p class="text-xs text-slate-400">Hedef Kredi</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${compliant === cmeRecords.length ? 'text-green-300' : 'text-red-300'}">${compliant}/${cmeRecords.length}</p><p class="text-xs text-slate-400">Uyumlu</p></div>
    </div>
    <div class="space-y-4 fade-in">
      ${cmeRecords.map(c => {
        const pct = Math.round((c.credits.earned / c.credits.required) * 100);
        return `
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-lg font-semibold text-white">${c.personnel}</h3>
              <p class="text-xs text-slate-400">${c.dept} · ${c.specialty}</p>
            </div>
            <span class="badge ${pct >= 100 ? 'bg-green-500/20 text-green-300' : pct >= 75 ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'}">${c.credits.earned}/${c.credits.required} Kredi</span>
          </div>
          <div class="mb-3">
            <div class="h-3 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full ${pct >= 100 ? 'bg-green-400' : pct >= 75 ? 'bg-blue-400' : 'bg-amber-400'}" style="width:${Math.min(pct, 100)}%"></div>
            </div>
            <p class="text-xs text-slate-500 mt-1">%${pct} tamamlandı</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead><tr><th class="th">Aktivite</th><th class="th">Tür</th><th class="th">Kategori</th><th class="th">Tarih</th><th class="th">Kredi</th></tr></thead>
              <tbody>${c.activities.map(a => `<tr class="border-t border-white/5">
                <td class="td">${a.title}</td><td class="td">${a.type}</td><td class="td"><span class="badge">${a.category}</span></td><td class="td">${a.date}</td><td class="td font-bold">${a.credits}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}
