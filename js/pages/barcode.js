// ===== BARKOD/QR TARAMA =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const SCAN_HISTORY = [
  { id: 1, code: 'PYS-001', type: 'QR', scannedAt: '2025-01-10 09:30', result: 'Dr. Ahmet Yılmaz - Kardiyoloji', method: 'Kamera' },
  { id: 2, code: 'PYS-042', type: 'QR', scannedAt: '2025-01-10 10:15', result: 'Hem. Fatma Demir - Dahiliye', method: 'Manuel' },
  { id: 3, code: 'HST-2025-001', type: 'Barcode', scannedAt: '2025-01-10 11:00', result: 'Hasta: Mehmet Can - Oda 204', method: 'Kamera' },
  { id: 4, code: 'EQ-PC-015', type: 'QR', scannedAt: '2025-01-09 14:30', result: 'Ekipman: Ultrason Cihazı #15', method: 'Kamera' },
];

export function renderBarcodePage(el) {
  const personnel = getPersonnel({});
  let activeTab = 'scan';

  function render() {
    el.innerHTML = `
      <div class="mb-6 fade-in">
        <h1 class="text-2xl font-bold text-white">📱 Barkod/QR Tarama</h1>
        <p class="text-slate-400 text-sm mt-1">Kamera ile barkod ve QR kod okuma, personel/hasta doğrulama</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
        <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${SCAN_HISTORY.length}</p><p class="text-xs text-slate-400">Toplam Tarama</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-green-300">${SCAN_HISTORY.filter(s => s.method === 'Kamera').length}</p><p class="text-xs text-slate-400">Kamera</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-purple-300">${SCAN_HISTORY.filter(s => s.type === 'QR').length}</p><p class="text-xs text-slate-400">QR Kod</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-amber-300">${SCAN_HISTORY.filter(s => s.type === 'Barcode').length}</p><p class="text-xs text-slate-400">Barkod</p></div>
      </div>

      <div class="flex gap-2 mb-6 flex-wrap fade-in">
        <button data-tab="scan" class="bc-tab ${activeTab === 'scan' ? 'tab-active' : 'tab-inactive'}">📷 Tarama</button>
        <button data-tab="manual" class="bc-tab ${activeTab === 'manual' ? 'tab-active' : 'tab-inactive'}">⌨️ Manuel Giriş</button>
        <button data-tab="history" class="bc-tab ${activeTab === 'history' ? 'tab-active' : 'tab-inactive'}">📜 Geçmiş</button>
        <button data-tab="generate" class="bc-tab ${activeTab === 'generate' ? 'tab-active' : 'tab-inactive'}">🏷️ Oluştur</button>
      </div>

      <div id="bc-content" class="fade-in"></div>`;

    document.querySelectorAll('.bc-tab').forEach(btn => {
      btn.onclick = () => { activeTab = btn.dataset.tab; render(); };
    });

    const content = document.getElementById('bc-content');
    if (activeTab === 'scan') renderScanner(content);
    else if (activeTab === 'manual') renderManual(content);
    else if (activeTab === 'history') renderHistory(content);
    else renderGenerate(content);
  }

  function renderScanner(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">📷 Kamera Tarama</h3>
          <div class="rounded-xl border-2 border-dashed border-white/20 bg-slate-800 p-8 text-center min-h-[280px] flex flex-col items-center justify-center">
            <div class="text-6xl mb-4 animate-pulse">📷</div>
            <p class="text-sm text-slate-300 mb-2">Kamera başlatmak için tıklayın</p>
            <p class="text-xs text-slate-500">QR kod veya barkodu kamera çerçevesine yerleştirin</p>
            <button id="start-camera-btn" class="btn-primary mt-4">📷 Kamerayı Başlat</button>
          </div>
          <div id="camera-feed" class="hidden mt-4">
            <div class="rounded-xl bg-slate-800 aspect-video flex items-center justify-center relative">
              <div class="absolute inset-8 border-2 border-cyan-400/50 rounded-lg"></div>
              <p class="text-cyan-300 text-sm animate-pulse">🔍 Taranıyor...</p>
            </div>
            <button id="simulate-scan" class="btn-primary w-full mt-3">🎯 Simüle Et (Demo)</button>
          </div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">📋 Sonuç</h3>
          <div id="scan-result" class="rounded-xl bg-white/5 border border-white/10 p-6 min-h-[280px] flex items-center justify-center">
            <div class="text-center">
              <p class="text-4xl mb-3">🔍</p>
              <p class="text-sm text-slate-400">Tarama sonucu burada görünecek</p>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderManual(container) {
    container.innerHTML = `
      <div class="card max-w-lg mx-auto">
        <h3 class="text-lg font-semibold text-white mb-4">⌨️ Manuel Kod Girişi</h3>
        <div class="space-y-3">
          <div>
            <label class="label">Kod</label>
            <input id="manual-code" class="input-field w-full" placeholder="Barkod veya QR kod girin...">
          </div>
          <div>
            <label class="label">Kod Türü</label>
            <select id="manual-type" class="input-field w-full">
              <option value="qr">QR Kod</option>
              <option value="barcode">Barkod</option>
            </select>
          </div>
          <button id="manual-lookup" class="btn-primary w-full">🔍 Sorgula</button>
        </div>
        <div id="manual-result" class="hidden mt-4 rounded-xl bg-white/5 border border-white/10 p-4"></div>
      </div>`;
  }

  function renderHistory(container) {
    container.innerHTML = `
      <div class="card">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead><tr><th class="th">Kod</th><th class="th">Tür</th><th class="th">Sonuç</th><th class="th">Yöntem</th><th class="th">Tarih</th></tr></thead>
            <tbody>
              ${SCAN_HISTORY.map(s => `
                <tr class="border-t border-white/5">
                  <td class="td"><code class="text-xs bg-white/10 px-2 py-0.5 rounded font-mono">${s.code}</code></td>
                  <td class="td"><span class="badge ${s.type === 'QR' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'} text-[10px]">${s.type}</span></td>
                  <td class="td text-sm text-white">${s.result}</td>
                  <td class="td"><span class="badge text-[10px]">${s.method}</span></td>
                  <td class="td text-xs">${s.scannedAt}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderGenerate(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">🏷️ QR Kod Oluştur</h3>
          <div class="space-y-3">
            <div>
              <label class="label">İçerik</label>
              <input id="qr-content" class="input-field w-full" placeholder="URL, metin veya kod...">
            </div>
            <div>
              <label class="label">Tür</label>
              <select id="qr-gen-type" class="input-field w-full">
                <option value="url">URL</option>
                <option value="text">Metin</option>
                <option value="personnel">Personel Kartı</option>
              </select>
            </div>
            <button id="generate-qr" class="btn-primary w-full">🏷️ QR Kod Oluştur</button>
          </div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">👁️ Önizleme</h3>
          <div id="qr-preview" class="flex items-center justify-center min-h-[200px] rounded-xl bg-white/5 border border-white/10 p-6">
            <div class="text-center">
              <p class="text-4xl mb-3">🏷️</p>
              <p class="text-sm text-slate-400">QR kod burada oluşturulacak</p>
            </div>
          </div>
        </div>
      </div>`;
  }

  // Event handlers
  document.getElementById('start-camera-btn')?.addEventListener('click', () => {
    document.getElementById('start-camera-btn')?.classList.add('hidden');
    document.getElementById('camera-feed')?.classList.remove('hidden');
  });

  document.getElementById('simulate-scan')?.addEventListener('click', () => {
    const randomPerson = personnel[Math.floor(Math.random() * personnel.length)];
    if (!randomPerson) return;
    document.getElementById('scan-result').innerHTML = `
      <div class="text-center fade-in">
        <p class="text-4xl mb-3">✅</p>
        <h4 class="text-lg font-bold text-white mb-2">${randomPerson.name}</h4>
        <div class="space-y-1 text-sm text-slate-300">
          <p>🏢 ${randomPerson.department}</p>
          <p>👷 ${randomPerson.type}</p>
          <p>📞 ${randomPerson.phone || 'Belirtilmemiş'}</p>
        </div>
        <a href="#personnel/${randomPerson.id}" class="btn-primary mt-4 inline-block text-sm">👤 Profili Gör</a>
      </div>`;
    showToast('QR kod başarıyla okundu', 'success');
  });

  document.getElementById('manual-lookup')?.addEventListener('click', () => {
    const code = document.getElementById('manual-code')?.value.trim();
    if (!code) { showToast('Lütfen bir kod girin', 'error'); return; }
    const resultDiv = document.getElementById('manual-result');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `
      <div class="fade-in">
        <p class="text-sm text-green-300 mb-2">✅ Kod bulundu</p>
        <p class="text-white font-medium">Aranan: ${code}</p>
        <p class="text-sm text-slate-400 mt-1">Eşleşen kayıt: ${personnel[0]?.name || 'Bulunamadı'}</p>
      </div>`;
  });

  document.getElementById('generate-qr')?.addEventListener('click', () => {
    const content = document.getElementById('qr-content')?.value.trim();
    if (!content) { showToast('Lütfen içerik girin', 'error'); return; }
    const preview = document.getElementById('qr-preview');
    if (typeof qrcode !== 'undefined') {
      try {
        const qr = qrcode(0, 'M');
        qr.addData(content);
        qr.make();
        preview.innerHTML = `<div class="bg-white p-4 rounded-xl">${qr.createSvgTag(5, 0)}</div>`;
      } catch { preview.innerHTML = '<p class="text-red-300">QR kod oluşturulamadı</p>'; }
    } else {
      preview.innerHTML = `<div class="bg-white p-4 rounded-xl text-center"><p class="text-6xl mb-2">🏷️</p><p class="text-xs text-gray-600 break-all">${content}</p></div>`;
    }
    showToast('QR kod oluşturuldu', 'success');
  });

  render();
}
