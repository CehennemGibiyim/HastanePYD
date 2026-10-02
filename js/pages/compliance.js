// ===== UYUMLULUK KONTROL LİSTESİ (COMPLIANCE) =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const TEMPLATES = [
  { id: 'iso9001', name: 'ISO 9001 Kalite Yönetimi', icon: '🏅', items: [
    'Kalite politikası güncellendi mi?', 'İç denetim raporları tamamlandı mı?', 'Düzeltici faaliyetler kaydedildi mi?',
    'Müşteri şikayetleri analiz edildi mi?', 'Eğitim planları onaylandı mı?', 'Doküman kontrol listesi güncel mi?',
    'Risk analizi yapıldı mı?', 'Tedarikçi değerlendirme raporları hazır mı?', 'Proses performans göstergeleri ölçüldü mü?',
    'Yönetim gözden geçirme toplantısı yapıldı mı?'
  ]},
  { id: 'hacs', name: 'HACS Akreditasyon', icon: '🏥', items: [
    'Hasta güvenliği protokolleri güncel mi?', 'Enfeksiyon kontrol raporları hazır mı?', 'İlaç yönetimi prosedürü uygulanıyor mu?',
    'Ameliyathane sterilizasyon kontrolü yapıldı mı?', 'Acil durum tatbikatı gerçekleştirildi mi?', 'Hasta hakları bildirimi yayınlandı mı?',
    'Yangın güvenliği denetimi yapıldı mı?', 'Tıbbi atık yönetimi kontrol edildi mi?', 'Hasta düşme riski değerlendirmesi yapıldı mı?',
    'Kan ürünleri takip sistemi çalışıyor mu?', 'Yoğun bakım hijyen protokolü uygulanıyor mu?', 'Radyasyon güvenliği ölçümleri yapıldı mı?'
  ]},
  { id: 'safety', name: 'İş Güvenliği Denetimi', icon: '🦺', items: [
    'İş güvenliği eğitimleri verildi mi?', 'KKP (Koruyucu Kişisel Donanım) dağıtıldı mı?', 'Yangın söndürücü bakımı yapıldı mı?',
    'İlk yardım çantaları kontrol edildi mi?', 'Acil çıkış yolları açık mı?', 'Elektrik tesisatı denetimi yapıldı mı?',
    'Kimyasal madde envanteri güncellendi mi?', 'Risk değerlendirme raporu hazır mı?', 'İş kazası kayıtları tutuluyor mu?',
    'Asansör periyodik kontrolü yapıldı mı?'
  ]},
];

export function renderCompliancePage(container) {
  const checklists = getChecklists();
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">✅ Uyumluluk Kontrol Listesi</h1>
          <p class="text-slate-400 text-sm mt-1">ISO, HACS ve iş güvenliği denetimleri</p>
        </div>
        <div class="flex gap-2">
          <select id="comp-template" class="input-field">
            <option value="">+ Yeni Denetim Oluştur</option>
            ${TEMPLATES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('')}
          </select>
          <button id="comp-create-btn" class="btn-primary">Oluştur</button>
        </div>
      </div>
      ${checklists.length === 0 ? `
        <div class="empty-state card">
          <div class="icon">📋</div>
          <div class="title">Henüz denetim oluşturulmamış</div>
          <div class="desc">Yukarıdaki menüden bir şablon seçerek başlayın</div>
        </div>` : `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" id="comp-lists">
          ${checklists.map(cl => checklistCardHTML(cl)).join('')}
        </div>`}
    </div>`;

  document.getElementById('comp-create-btn').onclick = () => {
    const tid = document.getElementById('comp-template').value;
    if (!tid) { showToast('Bir şablon seçin', 'error'); return; }
    const template = TEMPLATES.find(t => t.id === tid);
    if (!template) return;
    const personnel = getPersonnel({ status: 'active' });
    const newCL = {
      id: Date.now(), templateId: tid, name: template.name, icon: template.icon,
      createdAt: new Date().toISOString(), status: 'in_progress',
      items: template.items.map((text, idx) => ({
        id: idx + 1, text, status: 'pending', assignee: null, photoUrl: null, note: '',
      })),
    };
    const cls = getChecklists();
    cls.push(newCL);
    saveChecklists(cls);
    showToast('Denetim oluşturuldu: ' + template.name, 'success');
    renderCompliancePage(container);
  };
}

function checklistCardHTML(cl) {
  const done = cl.items.filter(i => i.status === 'done').length;
  const total = cl.items.length;
  const pct = total ? Math.round(done / total * 100) : 0;
  const statusColor = pct === 100 ? 'green' : pct >= 50 ? 'amber' : 'red';
  return `
    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xl">${cl.icon}</span>
          <div>
            <p class="font-semibold text-white text-sm">${cl.name}</p>
            <p class="text-xs text-slate-500">${new Date(cl.createdAt).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
        <div class="flex gap-1">
          <button class="comp-detail-btn btn-secondary text-xs px-2 py-1" data-id="${cl.id}">📋 Detay</button>
          <button class="comp-del-btn btn-secondary text-xs px-2 py-1 text-red-400" data-id="${cl.id}">🗑️</button>
        </div>
      </div>
      <div class="flex items-center gap-3 mb-2">
        <div class="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full rounded-full bg-${statusColor}-500 transition-all" style="width:${pct}%"></div>
        </div>
        <span class="text-sm font-bold text-${statusColor}-400">${pct}%</span>
      </div>
      <p class="text-xs text-slate-400">${done}/${total} madde tamamlandı</p>
    </div>`;
}

function showChecklistDetail(cl) {
  const personnel = getPersonnel({ status: 'active' });
  const done = cl.items.filter(i => i.status === 'done').length;
  const pct = cl.items.length ? Math.round(done / cl.items.length * 100) : 0;
  const m = createModal('comp-detail-modal');
  m.innerHTML = `<div class="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[85vh] overflow-y-auto">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-bold text-white">${cl.icon} ${cl.name}</h3>
      <button id="cd-close" class="btn-secondary text-xs">✕ Kapat</button>
    </div>
    <div class="flex items-center gap-3 mb-6">
      <div class="flex-1 h-4 rounded-full bg-white/10 overflow-hidden">
        <div class="h-full rounded-full transition-all" style="width:${pct}%; background: ${pct===100?'#22c55e':pct>=50?'#f59e0b':'#ef4444'}"></div>
      </div>
      <span class="text-lg font-bold">${pct}%</span>
    </div>
    <div class="space-y-2" id="cd-items">
      ${cl.items.map((item, idx) => `
        <div class="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition">
          <button class="cd-toggle mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs transition ${item.status==='done' ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-slate-600 text-slate-600'}"
                  data-cl="${cl.id}" data-idx="${idx}">${item.status==='done' ? '✓' : ''}</button>
          <div class="flex-1">
            <p class="text-sm ${item.status==='done' ? 'text-slate-500 line-through' : 'text-white'}">${item.text}</p>
            <div class="flex gap-2 mt-1">
              <select class="cd-assign input-field text-xs py-1 px-2" data-cl="${cl.id}" data-idx="${idx}">
                <option value="">Sorumlu ata</option>
                ${personnel.map(p => `<option value="${p.id}" ${item.assignee==p.id?'selected':''}>${p.name} ${p.surname}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>`).join('')}
    </div>
    <div class="mt-4 flex justify-between items-center">
      <span class="text-xs text-slate-500">Oluşturulma: ${new Date(cl.createdAt).toLocaleDateString('tr-TR')}</span>
      <button id="cd-export" class="btn-secondary text-xs">📄 PDF Rapor</button>
    </div>
  </div>`;
  document.getElementById('cd-close').onclick = () => m.remove();
  m.onclick = (e) => { if (e.target.id === 'comp-detail-modal') m.remove(); };
  m.querySelectorAll('.cd-toggle').forEach(btn => {
    btn.onclick = () => {
      const cls = getChecklists();
      const c = cls.find(x => x.id === parseInt(btn.dataset.cl));
      if (!c) return;
      const idx = parseInt(btn.dataset.idx);
      c.items[idx].status = c.items[idx].status === 'done' ? 'pending' : 'done';
      saveChecklists(cls);
      showChecklistDetail(c);
      renderCompliancePage(document.getElementById('content'));
    };
  });
  m.querySelectorAll('.cd-assign').forEach(sel => {
    sel.onchange = () => {
      const cls = getChecklists();
      const c = cls.find(x => x.id === parseInt(sel.dataset.cl));
      if (!c) return;
      c.items[parseInt(sel.dataset.idx)].assignee = parseInt(sel.value) || null;
      saveChecklists(cls);
    };
  });
}

// Wire detail and delete buttons
document.addEventListener('click', (e) => {
  if (e.target.closest('.comp-detail-btn')) {
    const id = parseInt(e.target.closest('.comp-detail-btn').dataset.id);
    const cl = getChecklists().find(c => c.id === id);
    if (cl) showChecklistDetail(cl);
  }
  if (e.target.closest('.comp-del-btn')) {
    const id = parseInt(e.target.closest('.comp-del-btn').dataset.id);
    const cls = getChecklists().filter(c => c.id !== id);
    saveChecklists(cls);
    showToast('Denetim silindi', 'success');
    renderCompliancePage(document.getElementById('content'));
  }
});

function createModal(id) { const e = document.getElementById(id); if (e) e.remove(); const m = document.createElement('div'); m.id = id; m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'; document.body.appendChild(m); return m; }
function getChecklists() { try { return JSON.parse(localStorage.getItem('hospital_compliance') || '[]'); } catch { return []; } }
function saveChecklists(cls) { localStorage.setItem('hospital_compliance', JSON.stringify(cls)); }
