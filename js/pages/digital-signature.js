// ===== DİJİTAL İMZA =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const PENDING_DOCS = [
  { id: 1, title: 'Personel Sözleşmesi - Dr. Ahmet Yılmaz', type: 'Sözleşme', status: 'pending', dueDate: '2025-02-01', signer: 'Başhekim' },
  { id: 2, title: 'Gizlilik Taahhütnamesi - Hem. Fatma Demir', type: 'Taahhütname', status: 'pending', dueDate: '2025-01-20', signer: 'İnsan Kaynakları' },
  { id: 3, title: 'Eğitim Katılım Formu - Ocak 2025', type: 'Form', status: 'signed', dueDate: '2025-01-15', signedAt: '2025-01-14 14:30', signer: 'Eğitim Müdürü' },
  { id: 4, title: 'İş Güvenliği Raporu - Q4 2024', type: 'Rapor', status: 'signed', dueDate: '2025-01-10', signedAt: '2025-01-09 09:15', signer: 'İSG Uzmanı' },
];

export function renderDigitalSignaturePage(el) {
  let isDrawing = false;
  let canvas = null;
  let ctx = null;
  let activeTab = 'pending';

  function render() {
    el.innerHTML = `
      <div class="mb-6 fade-in">
        <h1 class="text-2xl font-bold text-white">✍️ Dijital İmza</h1>
        <p class="text-slate-400 text-sm mt-1">Belge imzalama, imza doğrulama ve imza geçmişi</p>
      </div>

      <div class="flex gap-2 mb-6 flex-wrap fade-in">
        <button data-tab="pending" class="ds-tab ${activeTab === 'pending' ? 'tab-active' : 'tab-inactive'}">📝 İmza Bekleyen</button>
        <button data-tab="sign" class="ds-tab ${activeTab === 'sign' ? 'tab-active' : 'tab-inactive'}">✍️ İmzala</button>
        <button data-tab="history" class="ds-tab ${activeTab === 'history' ? 'tab-active' : 'tab-inactive'}">📜 Geçmiş</button>
      </div>

      <div id="ds-content" class="fade-in"></div>`;

    document.querySelectorAll('.ds-tab').forEach(btn => {
      btn.onclick = () => { activeTab = btn.dataset.tab; render(); };
    });

    const content = document.getElementById('ds-content');
    if (activeTab === 'pending') renderPending(content);
    else if (activeTab === 'sign') renderSignPad(content);
    else renderHistory(content);
  }

  function renderPending(container) {
    const pending = PENDING_DOCS.filter(d => d.status === 'pending');
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${pending.length ? pending.map(d => `
          <div class="card border border-amber-500/20">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-semibold text-white">${d.title}</h4>
              <span class="badge bg-amber-500/20 text-amber-300 text-[10px]">⏳ Bekliyor</span>
            </div>
            <div class="space-y-1 text-xs text-slate-400 mb-3">
              <p>📋 Tür: ${d.type}</p>
              <p>📅 Son Tarih: ${d.dueDate}</p>
              <p>✍️ İmzalayan: ${d.signer}</p>
            </div>
            <button data-sign-doc="${d.id}" class="btn-primary w-full text-sm">✍️ İmzala</button>
          </div>`).join('') : '<div class="col-span-2"><div class="empty-state"><div class="icon">✅</div><div class="title">İmza bekleyen belge yok</div></div></div>'}
      </div>`;

    document.querySelectorAll('[data-sign-doc]').forEach(btn => {
      btn.onclick = () => { activeTab = 'sign'; render(); };
    });
  }

  function renderSignPad(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">✍️ İmza Alanı</h3>
          <div class="rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-2 mb-4">
            <canvas id="signature-canvas" width="400" height="200" class="w-full rounded-lg cursor-crosshair" style="touch-action:none;"></canvas>
          </div>
          <div class="flex gap-2">
            <button id="clear-signature" class="btn-secondary flex-1 text-sm">🗑️ Temizle</button>
            <button id="save-signature" class="btn-primary flex-1 text-sm">💾 Kaydet & İmzala</button>
          </div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">📋 İmza Önizleme</h3>
          <div id="sign-preview" class="rounded-xl border border-white/10 bg-white/5 p-6 text-center min-h-[200px] flex items-center justify-center">
            <p class="text-slate-500 text-sm">İmzanızı sol taraftaki alana çizin</p>
          </div>
          <div class="mt-4 space-y-2 text-xs text-slate-400">
            <p>🔒 İmzanız SHA-256 ile şifrelenerek saklanır</p>
            <p>📜 İmzalanan belgeler değiştirilemez</p>
            <p>✅ Tüm imzalar denetim kaydında tutulur</p>
          </div>
        </div>
      </div>`;

    setTimeout(() => {
      canvas = document.getElementById('signature-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
      }

      function startDraw(e) { e.preventDefault(); isDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
      function draw(e) { if (!isDrawing) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
      function stopDraw() { isDrawing = false; updatePreview(); }

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDraw);
      canvas.addEventListener('mouseleave', stopDraw);
      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDraw);
    }, 100);

    document.getElementById('clear-signature')?.addEventListener('click', () => {
      if (ctx && canvas) { ctx.clearRect(0, 0, canvas.width, canvas.height); }
      document.getElementById('sign-preview').innerHTML = '<p class="text-slate-500 text-sm">İmzanızı sol taraftaki alana çizin</p>';
    });

    document.getElementById('save-signature')?.addEventListener('click', () => {
      if (!canvas) return;
      const data = canvas.toDataURL();
      const isEmpty = !ctx.getImageData(0, 0, canvas.width, canvas.height).data.some((v, i) => i % 4 === 3 && v > 0);
      if (isEmpty) { showToast('Lütfen önce imzanızı çizin', 'error'); return; }
      showToast('Belge başarıyla imzalandı! ✓', 'success');
      PENDING_DOCS[0].status = 'signed';
      PENDING_DOCS[0].signedAt = new Date().toLocaleString('tr-TR');
    });
  }

  function updatePreview() {
    if (!canvas) return;
    const preview = document.getElementById('sign-preview');
    if (preview) {
      preview.innerHTML = `<img src="${canvas.toDataURL()}" class="max-h-32 mx-auto" alt="İmza önizleme">`;
    }
  }

  function renderHistory(container) {
    const signed = PENDING_DOCS.filter(d => d.status === 'signed');
    container.innerHTML = `
      <div class="card">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead><tr><th class="th">Belge</th><th class="th">Tür</th><th class="th">İmzalayan</th><th class="th">Tarih</th><th class="th">Durum</th></tr></thead>
            <tbody>
              ${signed.map(d => `
                <tr class="border-t border-white/5">
                  <td class="td text-sm text-white">${d.title}</td>
                  <td class="td"><span class="badge">${d.type}</span></td>
                  <td class="td text-sm">${d.signer}</td>
                  <td class="td text-xs">${d.signedAt}</td>
                  <td class="td"><span class="badge bg-green-500/20 text-green-300">✓ İmzalandı</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  render();
}
