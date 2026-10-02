// ===== VERİ İÇE AKTARMA SİHRBAZI =====
import { showToast } from '../notifications.js';

export function renderDataImportPage(el) {
  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📥 Veri İçe Aktarma Sihirbazı</h1>
      <p class="text-slate-400 text-sm mt-1">Excel/CSV dosyalarından toplu personel yükleme</p>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">3</p><p class="text-xs text-slate-400">📋 Adım</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">CSV</p><p class="text-xs text-slate-400">📄 Desteklenen Format</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">∞</p><p class="text-xs text-slate-400">👥 Satır Limiti</p></div>
    </div>

    <!-- Step 1: Upload -->
    <div class="card mb-6 fade-in" id="step-1">
      <h3 class="text-lg font-semibold text-white mb-4">📤 Adım 1: Dosya Yükle</h3>
      <div id="import-dropzone" class="rounded-xl border-2 border-dashed border-white/20 p-8 text-center hover:border-cyan-500/50 transition cursor-pointer">
        <p class="text-4xl mb-3">📁</p>
        <p class="text-sm text-slate-300">CSV veya Excel dosyasını sürükleyin veya tıklayın</p>
        <p class="text-xs text-slate-500 mt-2">Desteklenen: .csv, .xlsx, .txt</p>
        <input type="file" id="import-file" accept=".csv,.xlsx,.txt" class="hidden">
      </div>
      <button id="download-template" class="btn-secondary mt-4 text-xs">📥 Şablon İndir (CSV)</button>
    </div>

    <!-- Step 2: Preview -->
    <div class="card mb-6 hidden fade-in" id="step-2">
      <h3 class="text-lg font-semibold text-white mb-4">👁️ Adım 2: Veri Önizleme</h3>
      <div id="import-preview" class="overflow-x-auto"></div>
      <div id="import-stats" class="mt-3 text-sm text-slate-400"></div>
    </div>

    <!-- Step 3: Column Mapping -->
    <div class="card mb-6 hidden fade-in" id="step-3">
      <h3 class="text-lg font-semibold text-white mb-4">🔗 Adım 3: Sütun Eşleme</h3>
      <div id="column-mapping" class="space-y-3"></div>
      <div id="import-validation" class="mt-4"></div>
      <button id="import-confirm" class="btn-primary mt-4 w-full">📥 İçe Aktar</button>
    </div>

    <!-- Result -->
    <div class="card hidden fade-in" id="step-result">
      <h3 class="text-lg font-semibold text-white mb-4">✅ Sonuç</h3>
      <div id="import-result"></div>
    </div>

    <div class="card mt-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-3">📋 Sütun Kılavuzu</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${[
          { col: 'name', label: 'Ad Soyad', req: 'Zorunlu', icon: '👤' },
          { col: 'department', label: 'Departman', req: 'Zorunlu', icon: '🏢' },
          { col: 'type', label: 'Tür/Pozisyon', req: 'Zorunlu', icon: '👷' },
          { col: 'phone', label: 'Telefon', req: 'Opsiyonel', icon: '📱' },
          { col: 'email', label: 'E-posta', req: 'Opsiyonel', icon: '📧' },
          { col: 'birthDate', label: 'Doğum Tarihi', req: 'Opsiyonel', icon: '🎂' },
          { col: 'startDate', label: 'İşe Başlama', req: 'Opsiyonel', icon: '📅' },
          { col: 'salary', label: 'Maaş', req: 'Opsiyonel', icon: '💰' },
        ].map(c => `
          <div class="rounded-lg bg-white/5 p-3 border border-white/10">
            <p class="text-sm font-medium text-white">${c.icon} ${c.label}</p>
            <p class="text-[10px] text-slate-500 mt-1">Kolon: <code class="text-cyan-400">${c.col}</code></p>
            <span class="text-[10px] ${c.req === 'Zorunlu' ? 'text-red-400' : 'text-green-400'}">${c.req}</span>
          </div>`).join('')}
      </div>
    </div>`;

  let parsedData = [];
  let headers = [];

  // Dropzone
  const dropzone = el.querySelector('#import-dropzone');
  const fileInput = el.querySelector('#import-file');
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-cyan-500'); });
  dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('border-cyan-500'); });
  dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('border-cyan-500'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

  // Template download
  el.querySelector('#download-template')?.addEventListener('click', () => {
    const csv = 'name,department,type,phone,email,birthDate,startDate,salary\nÖrnek Personel,Dahiliye,Doktor,05551234567,ornek@hastane.com,1990-01-15,2024-01-01,25000\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'personel_sablonu.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Şablon indirildi!', 'success');
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { showToast('Dosya boş veya geçersiz', 'error'); return; }
      headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      parsedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      });

      // Show step 2
      el.querySelector('#step-2').classList.remove('hidden');
      el.querySelector('#import-stats').textContent = `${parsedData.length} satır, ${headers.length} sütun yüklendi.`;
      const previewRows = parsedData.slice(0, 5);
      el.querySelector('#import-preview').innerHTML = `
        <table class="w-full text-xs">
          <thead><tr>${headers.map(h => `<th class="th">${h}</th>`).join('')}</tr></thead>
          <tbody>${previewRows.map(row => `<tr>${headers.map(h => `<td class="td">${row[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        ${parsedData.length > 5 ? `<p class="text-xs text-slate-500 mt-2">... ve ${parsedData.length - 5} satır daha</p>` : ''}`;

      // Show step 3 - column mapping
      el.querySelector('#step-3').classList.remove('hidden');
      const targetCols = ['name', 'department', 'type', 'phone', 'email', 'birthDate', 'startDate', 'salary'];
      el.querySelector('#column-mapping').innerHTML = targetCols.map(tc => {
        const bestMatch = headers.find(h => h.toLowerCase().includes(tc.toLowerCase()));
        return `
        <div class="flex items-center gap-3">
          <span class="text-sm text-white w-28">${tc}:</span>
          <select class="input-field flex-1 text-xs map-select" data-target="${tc}">
            <option value="">— Eşleme —</option>
            ${headers.map(h => `<option value="${h}" ${h === bestMatch ? 'selected' : ''}>${h}</option>`).join('')}
          </select>
        </div>`;
      }).join('');

      showToast(`${parsedData.length} satır yüklendi!`, 'success');
    };
    reader.readAsText(file);
  }

  // Import confirm
  el.querySelector('#import-confirm')?.addEventListener('click', () => {
    const mappings = {};
    el.querySelectorAll('.map-select').forEach(sel => {
      if (sel.value) mappings[sel.dataset.target] = sel.value;
    });
    if (!mappings.name) { showToast('En az "name" eşlenmelidir', 'error'); return; }
    const imported = parsedData.map(row => {
      const obj = {};
      Object.entries(mappings).forEach(([target, source]) => { obj[target] = row[source] || ''; });
      return obj;
    });
    el.querySelector('#step-result').classList.remove('hidden');
    el.querySelector('#import-result').innerHTML = `
      <div class="text-center py-6">
        <p class="text-5xl mb-3">✅</p>
        <p class="text-xl font-bold text-white">${imported.length} Kayıt Hazır</p>
        <p class="text-sm text-slate-400 mt-2">Veriler başarıyla eşleştirildi</p>
        <div class="mt-4 text-xs text-slate-500">
          <p>Eşleştirilen alanlar: ${Object.keys(mappings).join(', ')}</p>
        </div>
      </div>`;
    showToast(`${imported.length} kayıt içe aktarıldı!`, 'success');
  });
}
