// ===== PERSONEL YAKA KİMLİK KARTI OLUŞTURUCU =====
import { getPersonnel, getPersonnelById } from '../state.js';

export function renderIDBadgePage(el) {
  const personnel = getPersonnel({ status: 'active' });
  let selectedId = null;
  let badgeStyle = 'classic';

  function render() {
    el.innerHTML = `
      <div class="mb-6 fade-in">
        <h1 class="text-2xl font-bold text-white">🪪 Yaka Kimlik Kartı Oluşturucu</h1>
        <p class="text-slate-400 text-sm mt-1">Personel yaka kartı tasarla, önizle ve yazdır</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
        <!-- Sol: Personel Seçimi -->
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">👤 Personel Seç</h3>
          <input id="badge-search" type="text" class="input-field w-full mb-3" placeholder="🔍 Personel ara...">
          <div id="badge-personnel-list" class="space-y-1 max-h-[400px] overflow-y-auto">
            ${personnel.map(p => `
              <button data-pid="${p.id}" class="badge-person-item w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10 transition ${selectedId === p.id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'border border-transparent'}">
                <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-cyan-300 shrink-0 overflow-hidden">${p.photo ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" class="w-full h-full object-cover">` : getInitials(`${p.name} ${p.surname}`)}</div>
                <div class="min-w-0">
                  <p class="text-sm text-white truncate">${p.name}</p>
                  <p class="text-[10px] text-slate-500 truncate">${p.department} · ${p.type}</p>
                </div>
              </button>`).join('')}
          </div>
        </div>

        <!-- Orta: Önizleme -->
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">👁️ Önizleme</h3>
          <div class="flex gap-2 mb-4">
            <button data-style="classic" class="badge-style-btn ${badgeStyle === 'classic' ? 'tab-active' : 'tab-inactive'} text-xs">📋 Klasik</button>
            <button data-style="modern" class="badge-style-btn ${badgeStyle === 'modern' ? 'tab-active' : 'tab-inactive'} text-xs">🎨 Modern</button>
            <button data-style="minimal" class="badge-style-btn ${badgeStyle === 'minimal' ? 'tab-active' : 'tab-inactive'} text-xs">✨ Minimal</button>
          </div>
          <div id="badge-preview-area" class="flex justify-center">
            ${renderBadgePreview()}
          </div>
          <div class="flex gap-2 mt-4">
            <button id="badge-print-btn" class="btn-primary flex-1" ${!selectedId ? 'disabled' : ''}>🖨️ Yazdır</button>
            <button id="badge-download-btn" class="btn-secondary flex-1" ${!selectedId ? 'disabled' : ''}>📥 PDF İndir</button>
          </div>
        </div>

        <!-- Sağ: Toplu Üretim -->
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">📦 Toplu Üretim</h3>
          <div class="space-y-3">
            <div>
              <label class="label">Departman Filtresi</label>
              <select id="badge-dept-filter" class="input-field w-full">
                <option value="all">Tüm Departmanlar</option>
                ${[...new Set(personnel.map(p => p.department))].sort().map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="label">Personel Türü</label>
              <select id="badge-type-filter" class="input-field w-full">
                <option value="all">Tüm Türler</option>
                ${[...new Set(personnel.map(p => p.type))].sort().map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
            <button id="badge-bulk-generate" class="btn-primary w-full">📋 Tümünü Önizle (${personnel.length} kişi)</button>
            <button id="badge-bulk-print" class="btn-secondary w-full">🖨️ Toplu Yazdır</button>
          </div>
          <div class="mt-4 pt-4 border-t border-white/10">
            <h4 class="text-sm font-semibold text-white mb-2">📊 İstatistik</h4>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between"><span class="text-slate-400">Toplam personel</span><span class="text-white">${personnel.length}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Departman sayısı</span><span class="text-white">${new Set(personnel.map(p => p.department)).size}</span></div>
              <div class="flex justify-between"><span class="text-slate-400">Tür sayısı</span><span class="text-white">${new Set(personnel.map(p => p.type)).size}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toplu Önizleme Alanı -->
      <div id="badge-bulk-preview" class="hidden mt-6 fade-in"></div>`;

    // Event listeners
    document.querySelectorAll('.badge-person-item').forEach(btn => {
      btn.onclick = () => {
        selectedId = parseInt(btn.dataset.pid);
        render();
      };
    });

    document.querySelectorAll('.badge-style-btn').forEach(btn => {
      btn.onclick = () => {
        badgeStyle = btn.dataset.style;
        render();
      };
    });

    document.getElementById('badge-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.badge-person-item').forEach(btn => {
        const name = btn.querySelector('.text-white')?.textContent?.toLowerCase() || '';
        const dept = btn.querySelector('.text-slate-500')?.textContent?.toLowerCase() || '';
        btn.style.display = (name.includes(q) || dept.includes(q)) ? '' : 'none';
      });
    });

    document.getElementById('badge-print-btn')?.addEventListener('click', () => {
      if (!selectedId) return;
      printBadge(selectedId);
    });

    document.getElementById('badge-download-btn')?.addEventListener('click', () => {
      if (!selectedId) return;
      downloadBadgePDF(selectedId);
    });

    document.getElementById('badge-bulk-generate')?.addEventListener('click', () => {
      const dept = document.getElementById('badge-dept-filter').value;
      const type = document.getElementById('badge-type-filter').value;
      let filtered = personnel;
      if (dept !== 'all') filtered = filtered.filter(p => p.department === dept);
      if (type !== 'all') filtered = filtered.filter(p => p.type === type);
      renderBulkPreview(filtered);
    });

    document.getElementById('badge-bulk-print')?.addEventListener('click', () => {
      const dept = document.getElementById('badge-dept-filter').value;
      const type = document.getElementById('badge-type-filter').value;
      let filtered = personnel;
      if (dept !== 'all') filtered = filtered.filter(p => p.department === dept);
      if (type !== 'all') filtered = filtered.filter(p => p.type === type);
      printBulkBadges(filtered);
    });
  }

  function renderBadgePreview() {
    if (!selectedId) {
      return `<div class="w-80 h-48 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-center p-4">
        <p class="text-4xl mb-2">🪪</p>
        <p class="text-sm text-slate-400">Personel seçin ve kartı önizleyin</p>
      </div>`;
    }
    const p = getPersonnelById(selectedId);
    if (!p) return '<p class="text-red-300">Personel bulunamadı</p>';
    return generateBadgeHTML(p, badgeStyle);
  }

  function generateBadgeHTML(p, style) {
    const initials = getInitials(`${p.name} ${p.surname}`);
    const avatarContent = p.photo
      ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
      : initials;
    const qrData = `PYS-${String(p.id).padStart(4, '0')}`;
    const typeLabel = p.type === 'doctor' ? 'Doktor' : p.type === 'nurse' ? 'Hemşire' : p.type === 'admin' ? 'İdari' : p.type === 'cleaning' ? 'Temizlik' : p.type === 'security' ? 'Güvenlik' : p.type;
    const roleColor = p.type === 'doctor' ? '#0ea5e9' : p.type === 'nurse' ? '#8b5cf6' : p.type === 'admin' ? '#f59e0b' : p.type === 'security' ? '#ef4444' : p.type === 'cleaning' ? '#22c55e' : '#6366f1';

    if (style === 'modern') {
      return `<div id="badge-card" class="w-80 rounded-2xl overflow-hidden shadow-2xl" style="font-family: Inter, sans-serif;">
        <div style="background: linear-gradient(135deg, ${roleColor}dd, ${roleColor}88); padding: 20px; text-align: center;">
          <div style="width: 64px; height: 64px; border-radius: 50%; overflow:hidden; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 24px; font-weight: 700; color: white;">${avatarContent}</div>
          <h2 style="color: white; font-size: 18px; font-weight: 700; margin: 0;">${p.name}</h2>
          <p style="color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 4px;">${typeLabel}</p>
        </div>
        <div style="background: white; padding: 16px; color: #1e293b;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
            <div><span style="color: #94a3b8;">Departman</span><br><strong>${p.department}</strong></div>
            <div><span style="color: #94a3b8;">Sicil No</span><br><strong>${qrData}</strong></div>
            <div><span style="color: #94a3b8;">Telefon</span><br><strong>${p.phone || '—'}</strong></div>
            <div><span style="color: #94a3b8;">Kan Grubu</span><br><strong>${p.bloodType || '—'}</strong></div>
          </div>
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 9px; color: #94a3b8;">DEVLET HASTANESİ • PERSONEL KİMLİK KARTI</p>
          </div>
        </div>
      </div>`;
    }

    if (style === 'minimal') {
      return `<div id="badge-card" class="w-80 rounded-xl overflow-hidden shadow-2xl bg-white" style="font-family: Inter, sans-serif; border-left: 4px solid ${roleColor};">
        <div style="padding: 20px; display: flex; align-items: center; gap: 16px;">
          <div style="width: 56px; height: 56px; border-radius: 12px; overflow:hidden; background: ${roleColor}15; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: ${roleColor}; flex-shrink: 0;">${avatarContent}</div>
          <div>
            <h2 style="color: #0f172a; font-size: 16px; font-weight: 700; margin: 0;">${p.name}</h2>
            <p style="color: ${roleColor}; font-size: 12px; font-weight: 600;">${p.department} · ${typeLabel}</p>
            <p style="color: #94a3b8; font-size: 10px;">${p.phone || ''} | ${qrData}</p>
          </div>
        </div>
      </div>`;
    }

    // Classic style (default)
    return `<div id="badge-card" class="w-80 rounded-xl overflow-hidden shadow-2xl" style="font-family: Inter, sans-serif; background: white;">
      <div style="background: #0891b2; padding: 12px; text-align: center;">
        <p style="color: rgba(255,255,255,0.8); font-size: 10px; margin: 0;">T.C. DEVLET HASTANESİ</p>
        <p style="color: white; font-size: 9px; margin-top: 2px;">PERSONEL KİMLİK KARTI</p>
      </div>
      <div style="padding: 16px; display: flex; gap: 14px; align-items: flex-start;">
        <div style="width: 64px; height: 80px; border-radius: 8px; overflow:hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #64748b; flex-shrink: 0; border: 1px solid #e2e8f0;">${avatarContent}</div>
        <div style="flex: 1; min-width: 0;">
          <h3 style="color: #0f172a; font-size: 15px; font-weight: 700; margin: 0;">${p.name}</h3>
          <p style="color: #0891b2; font-size: 11px; font-weight: 600; margin-top: 2px;">${typeLabel}</p>
          <div style="margin-top: 8px; font-size: 10px; color: #64748b; line-height: 1.6;">
            <div><strong>Departman:</strong> ${p.department}</div>
            <div><strong>Sicil:</strong> ${qrData}</div>
            <div><strong>Tel:</strong> ${p.phone || '—'}</div>
          </div>
        </div>
      </div>
      <div style="padding: 8px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 8px; color: #94a3b8;">${qrData}</span>
        <span style="font-size: 8px; color: #94a3b8;">Geçerlilik: 2025-2028</span>
      </div>
    </div>`;
  }

  function renderBulkPreview(list) {
    const bulkArea = document.getElementById('badge-bulk-preview');
    if (!bulkArea) return;
    bulkArea.classList.remove('hidden');
    bulkArea.innerHTML = `
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">📋 Toplu Önizleme (${list.length} kart)</h3>
          <button id="close-bulk" class="btn-secondary text-xs">✕ Kapat</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          ${list.map(p => `<div class="flex justify-center">${generateBadgeHTML(p, badgeStyle)}</div>`).join('')}
        </div>
      </div>`;
    document.getElementById('close-bulk')?.addEventListener('click', () => {
      bulkArea.classList.add('hidden');
    });
  }

  function printBadge(pid) {
    const p = getPersonnelById(pid);
    if (!p) return;
    const html = generateBadgeHTML(p, badgeStyle);
    openPrintWindow([html]);
  }

  function printBulkBadges(list) {
    const badges = list.map(p => generateBadgeHTML(p, badgeStyle));
    openPrintWindow(badges);
  }

  function openPrintWindow(badgeHTMLs) {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Yaka Kartı Yazdır</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: Inter, sans-serif; margin: 0; padding: 10mm; }
        .badge-grid { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
        .badge-item { page-break-inside: avoid; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="badge-grid">
        ${badgeHTMLs.map(b => `<div class="badge-item">${b}</div>`).join('')}
      </div>
      <script>setTimeout(() => { window.print(); }, 500);<\/script>
    </body></html>`);
    win.document.close();
  }

  function downloadBadgePDF(pid) {
    const p = getPersonnelById(pid);
    if (!p) return;
    if (typeof jspdf !== 'undefined') {
      const { jsPDF } = jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85, 55] });
      doc.setFillColor(8, 145, 178);
      doc.rect(0, 0, 85, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text('T.C. DEVLET HASTANESİ', 42.5, 6, { align: 'center' });
      doc.setFontSize(5);
      doc.text('PERSONEL KİMLİK KARTI', 42.5, 10, { align: 'center' });

      if (p.photo) {
        try { doc.addImage(p.photo, 'JPEG', 5, 18, 9, 12); } catch { doc.setTextColor(100, 116, 139); doc.setFontSize(9); doc.text(getInitials(`${p.name} ${p.surname}`), 9.5, 25, { align: 'center' }); }
      } else {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(9);
        doc.text(getInitials(`${p.name} ${p.surname}`), 9.5, 25, { align: 'center' });
      }
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text(p.name, 17, 22);

      doc.setTextColor(8, 145, 178);
      doc.setFontSize(8);
      doc.text(p.department + ' - ' + p.type, 17, 28);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('Sicil: PYS-' + String(p.id).padStart(4, '0'), 17, 36);
      doc.text('Tel: ' + (p.phone || '—'), 17, 41);
      doc.text('Kan: ' + (p.bloodType || '—'), 17, 46);

      doc.setDrawColor(226, 232, 240);
      doc.line(0, 50, 85, 50);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(5);
      doc.text('Geçerlilik: 2025-2028', 42.5, 53, { align: 'center' });

      doc.save(`yaka-kart-${p.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } else {
      window.print();
    }
  }

  render();
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
