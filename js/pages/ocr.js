// ===== OCR BELGE TARAMA =====
import { showToast } from '../notifications.js';

export function renderOCRPage(el) {
  let lastResult = null;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📷 OCR Belge Tarama</h1>
      <p class="text-slate-400 text-sm mt-1">Fotoğraf veya PDF'den metin çıkarma ve otomatik form doldurma</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📤 Belge Yükle</h3>
        <div id="ocr-dropzone" class="rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center cursor-pointer hover:border-cyan-500/40 transition min-h-[200px] flex flex-col items-center justify-center">
          <p class="text-4xl mb-3">📷</p>
          <p class="text-sm text-slate-300 mb-1">Fotoğraf veya PDF sürükleyin</p>
          <p class="text-xs text-slate-500">veya tıklayarak dosya seçin</p>
          <input type="file" id="ocr-file-input" accept="image/*,.pdf" class="hidden">
        </div>
        <div id="ocr-preview" class="hidden mt-4">
          <img id="ocr-preview-img" class="w-full rounded-xl border border-white/10" alt="Yüklenen belge">
        </div>
        <button id="ocr-scan-btn" class="btn-primary w-full mt-4 hidden">🔍 Tara ve Metin Çıkar</button>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📝 Çıkarılan Metin</h3>
        <div id="ocr-result" class="rounded-xl bg-white/5 border border-white/10 p-4 min-h-[200px]">
          <div class="empty-state">
            <div class="icon">📄</div>
            <div class="title">Henüz belge taranmadı</div>
            <div class="desc">Sol taraftan bir belge yükleyin</div>
          </div>
        </div>
        <div id="ocr-actions" class="hidden flex gap-2 mt-4">
          <button id="ocr-copy" class="btn-secondary flex-1 text-sm">📋 Kopyala</button>
          <button id="ocr-autofill" class="btn-primary flex-1 text-sm">✏️ Forma Aktar</button>
        </div>
      </div>
    </div>

    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Son Taramalar</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Belge</th><th class="th">Tür</th><th class="th">Karakter</th><th class="th">Tarih</th><th class="th">İşlem</th></tr></thead>
          <tbody id="ocr-history">
            <tr class="border-t border-white/5">
              <td class="td text-sm text-white">Kimlik Fotokopisi</td>
              <td class="td"><span class="badge">Kimlik</span></td>
              <td class="td text-sm">342 karakter</td>
              <td class="td text-xs">2025-01-10</td>
              <td class="td"><button class="btn-secondary text-xs px-2 py-1">👁️</button></td>
            </tr>
            <tr class="border-t border-white/5">
              <td class="td text-sm text-white">Diploma</td>
              <td class="td"><span class="badge">Eğitim</span></td>
              <td class="td text-sm">518 karakter</td>
              <td class="td text-xs">2025-01-09</td>
              <td class="td"><button class="btn-secondary text-xs px-2 py-1">👁️</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 fade-in">
      <div class="card text-center">
        <p class="text-3xl mb-2">🇹🇷</p>
        <h4 class="text-sm font-semibold text-white">Türkçe Desteği</h4>
        <p class="text-xs text-slate-400 mt-1">Türkçe karakterleri tam destekler</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl mb-2">⚡</p>
        <h4 class="text-sm font-semibold text-white">Hızlı Tarama</h4>
        <p class="text-xs text-slate-400 mt-1">Saniyeler içinde metin çıkarma</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl mb-2">🔒</p>
        <h4 class="text-sm font-semibold text-white">Güvenli</h4>
        <p class="text-xs text-slate-400 mt-1">Belgeler sunucuda saklanmaz</p>
      </div>
    </div>`;

  // Event handlers
  const dropzone = document.getElementById('ocr-dropzone');
  const fileInput = document.getElementById('ocr-file-input');
  const preview = document.getElementById('ocr-preview');
  const previewImg = document.getElementById('ocr-preview-img');
  const scanBtn = document.getElementById('ocr-scan-btn');
  const resultDiv = document.getElementById('ocr-result');
  const actionsDiv = document.getElementById('ocr-actions');

  dropzone?.addEventListener('click', () => fileInput?.click());
  dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'rgba(34,211,238,0.5)'; });
  dropzone?.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '';
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Lütfen bir resim dosyası yükleyin', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      preview.classList.remove('hidden');
      scanBtn.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  scanBtn?.addEventListener('click', () => {
    scanBtn.disabled = true;
    scanBtn.textContent = '⏳ Taranıyor...';
    setTimeout(() => {
      const demoText = `T.C. KİMLİK NUMARASI: 12345678901
ADI: AHMET
SOYADI: YILMAZ
DOĞUM TARİHİ: 15.03.1985
DOĞUM YERİ: İSTANBUL
CİNSİYET: E
UYRUK: T.C.
ANNE ADI: AYŞE
BABA ADI: MEHMET
VERİLİŞ TARİHİ: 20.06.2020
GEÇERLİLİK TARİHİ: 20.06.2030
VEREN MAKAM: İSTANBUL NÜFUS MÜDÜRLÜĞÜ`;
      resultDiv.innerHTML = `<pre class="text-sm text-slate-200 whitespace-pre-wrap font-mono">${demoText}</pre>`;
      actionsDiv.classList.remove('hidden');
      actionsDiv.style.display = 'flex';
      scanBtn.disabled = false;
      scanBtn.textContent = '🔍 Tara ve Metin Çıkar';
      showToast('OCR tarama tamamlandı', 'success');
    }, 2000);
  });

  document.getElementById('ocr-copy')?.addEventListener('click', () => {
    const text = resultDiv.querySelector('pre')?.textContent;
    if (text) {
      navigator.clipboard?.writeText(text);
      showToast('Metin kopyalandı', 'success');
    }
  });

  document.getElementById('ocr-autofill')?.addEventListener('click', () => {
    showToast('Bilgiler forma aktarıldı (demo)', 'success');
  });
}
