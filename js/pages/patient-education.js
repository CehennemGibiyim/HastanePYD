// ===== HASTA EĞİTİM MATERYALLERİ =====
const STORAGE_KEY = 'patient_education';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, title: 'Diyabet Yönetimi Rehberi', category: 'Kronik Hastalık', disease: 'Diyabet', format: 'PDF', content: 'Tip 2 diyabet yönetiminde beslenme, egzersiz ve ilaç uyumu hakkında kapsamlı rehber. Kan şekeri takibi, insülin uygulama teknikleri ve hipoglisemi önleme stratejileri.', author: 'Dr. Arslan', department: 'Dahiliye', views: 156, rating: 4.8, tags: ['diyabet', 'beslenme', 'insülin', 'kan şekeri'], publishDate: '2026-06-01', status: 'active' },
    { id: 2, title: 'Kalp Sağlığı ve Egzersiz', category: 'Kardiyoloji', disease: 'Koroner Arter', format: 'Video', content: 'Kalp hastaları için güvenli egzersiz programı. Nabız kontrolü, egzersiz öncesi ısınma ve sonrası soğuma. Acil durum belirtileri ve ne zaman doktora başvurulmalı.', author: 'Dr. Kaya', department: 'Kardiyoloji', views: 234, rating: 4.9, tags: ['kalp', 'egzersiz', 'kardiyak rehabilitasyon'], publishDate: '2026-05-15', status: 'active' },
    { id: 3, title: 'Ameliyat Sonrası Bakım', category: 'Cerrahi', disease: 'Genel Cerrahi', format: 'Broşür', content: 'Ameliyat sonrası yara bakımı, ilaç kullanımı, beslenme önerileri ve dikkat edilecek belirtiler. Ne zaman acil servise başvurulmalı.', author: 'Hemşire Ayşe', department: 'Cerrahi', views: 89, rating: 4.5, tags: ['ameliyat', 'yara bakımı', 'post-op'], publishDate: '2026-06-10', status: 'active' },
    { id: 4, title: 'İlaç Kullanım Kılavuzu', category: 'Genel', disease: 'Genel', format: 'PDF', content: 'İlaçların doğru kullanımı, yan etkiler, saklama koşulları ve ilaç etkileşimleri hakkında bilgilendirme.', author: 'Ecz. Mehmet', department: 'Eczane', views: 312, rating: 4.7, tags: ['ilaç', 'yan etki', 'etkileşim'], publishDate: '2026-04-20', status: 'active' },
    { id: 5, title: 'Emzirme Rehberi', category: 'Kadın Doğum', disease: 'Doğum Sonrası', format: 'Video', content: 'Emzirme teknikleri, beslenme önerileri, süt artırma yöntemleri ve yaygın sorunların çözümü.', author: 'Ebe Ayşe', department: 'Kadın Doğum', views: 178, rating: 4.9, tags: ['emzirme', 'bebek', 'doğum'], publishDate: '2026-05-01', status: 'active' },
  ];
  saveData(d); return d;
}
const CATEGORIES = ['Kronik Hastalık', 'Kardiyoloji', 'Cerrahi', 'Genel', 'Kadın Doğum', 'Pediatri', 'Ortopedi', 'Psikoloji'];
const FORMATS = ['PDF', 'Video', 'Broşür', 'Infografik', 'Sesli Anlatım'];

export function renderPatientEducationPage(el) {
  let data = getData();
  let filterCat = '', search = '';
  function render() {
    const filtered = data.filter(d => (!filterCat || d.category === filterCat) && (!search || d.title.toLowerCase().includes(search.toLowerCase()) || d.disease.toLowerCase().includes(search.toLowerCase())));
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">📚 Hasta Eğitim Materyalleri</h1><p class="text-slate-400 text-sm mt-1">Hastalık bazlı bilgilendirme ve broşür yönetimi</p></div>
        <button id="add-edu-btn" class="btn-primary">+ Yeni Materyal</button>
      </div>
      <div class="card mb-4"><div class="flex flex-wrap gap-3">
        <input type="text" class="input-field flex-1 min-w-[200px]" placeholder="🔍 Başlık veya hastalık ara..." id="edu-search" value="${search}">
        <select class="input-field" id="edu-cat"><option value="">Tüm Kategoriler</option>${CATEGORIES.map(c => `<option value="${c}" ${filterCat === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      </div></div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${filtered.length === 0 ? '<div class="col-span-full empty-state"><p class="icon">📚</p><p class="title">Materyal bulunamadı</p></div>' :
          filtered.map(d => `<div class="card hover:bg-white/10 transition">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">${d.format === 'PDF' ? '📄' : d.format === 'Video' ? '🎥' : d.format === 'Broşür' ? '📋' : '📊'}</span>
              <div>
                <h3 class="text-base font-bold text-white">${d.title}</h3>
                <p class="text-xs text-slate-400">${d.category} · ${d.disease}</p>
              </div>
            </div>
            <p class="text-sm text-slate-300 mb-3 line-clamp-2">${d.content}</p>
            <div class="flex flex-wrap gap-1 mb-3">${d.tags.map(t => `<span class="badge bg-white/5 text-xs">${t}</span>`).join('')}</div>
            <div class="flex items-center justify-between text-xs text-slate-400">
              <span>👤 ${d.author} · 📅 ${d.publishDate}</span>
              <div class="flex items-center gap-2">
                <span>👁️ ${d.views}</span>
                <span>⭐ ${d.rating}</span>
              </div>
            </div>
            <div class="flex gap-2 mt-3">
              <span class="badge bg-${d.format === 'Video' ? 'red' : d.format === 'PDF' ? 'blue' : 'green'}-500/20 text-${d.format === 'Video' ? 'red' : d.format === 'PDF' ? 'blue' : 'green'}-300">${d.format}</span>
              <button class="btn-secondary text-xs py-1 px-2 delete-edu" data-id="${d.id}">🗑️</button>
            </div>
          </div>`).join('')}
      </div>
      <div class="card mt-6"><h3 class="text-sm font-semibold text-white mb-3">📊 İstatistikler</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-lg bg-white/5 p-3 text-center"><p class="text-xl font-bold text-cyan-300">${data.length}</p><p class="text-xs text-slate-400">Toplam Materyal</p></div>
          <div class="rounded-lg bg-white/5 p-3 text-center"><p class="text-xl font-bold text-green-300">${data.reduce((s, d) => s + d.views, 0)}</p><p class="text-xs text-slate-400">Toplam Görüntülenme</p></div>
          <div class="rounded-lg bg-white/5 p-3 text-center"><p class="text-xl font-bold text-amber-300">${data.length ? (data.reduce((s, d) => s + d.rating, 0) / data.length).toFixed(1) : 0}</p><p class="text-xs text-slate-400">Ort. Puan</p></div>
          <div class="rounded-lg bg-white/5 p-3 text-center"><p class="text-xl font-bold text-purple-300">${CATEGORIES.filter(c => data.some(d => d.category === c)).length}</p><p class="text-xs text-slate-400">Aktif Kategori</p></div>
        </div>
      </div>
    </div>`;
    document.getElementById('edu-search')?.addEventListener('input', e => { search = e.target.value; render(); });
    document.getElementById('edu-cat')?.addEventListener('change', e => { filterCat = e.target.value; render(); });
    document.querySelectorAll('.delete-edu').forEach(b => b.onclick = () => { if (confirm('Silmek istediğinize emin misiniz?')) { data = data.filter(x => x.id !== +b.dataset.id); saveData(data); render(); } });
    document.getElementById('add-edu-btn')?.addEventListener('click', showAdd);
  }
  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📚 Yeni Eğitim Materyali</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık</label><input id="edu-title" class="input-field w-full"></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Kategori</label><select id="edu-category" class="input-field w-full">${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></div><div><label class="label">Format</label><select id="edu-format" class="input-field w-full">${FORMATS.map(f => `<option>${f}</option>`).join('')}</select></div></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Hastalık</label><input id="edu-disease" class="input-field w-full"></div><div><label class="label">Yazar</label><input id="edu-author" class="input-field w-full"></div></div>
        <div><label class="label">İçerik</label><textarea id="edu-content" class="input-field w-full" rows="3"></textarea></div>
        <div><label class="label">Etiketler (virgülle)</label><input id="edu-tags" class="input-field w-full"></div>
      </div>
      <div class="flex gap-3 mt-5"><button id="edu-save" class="btn-primary flex-1">💾 Kaydet</button><button id="edu-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('edu-cancel').onclick = () => modal.remove();
    document.getElementById('edu-save').onclick = () => {
      const title = document.getElementById('edu-title').value.trim();
      if (!title) return;
      data.push({ id: Date.now(), title, category: document.getElementById('edu-category').value, disease: document.getElementById('edu-disease').value, format: document.getElementById('edu-format').value, content: document.getElementById('edu-content').value, author: document.getElementById('edu-author').value, department: '', views: 0, rating: 0, tags: document.getElementById('edu-tags').value.split(',').map(s => s.trim()).filter(Boolean), publishDate: new Date().toISOString().slice(0, 10), status: 'active' });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
