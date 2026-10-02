// ===== DOKUMAN YONETIMI =====
import { getPersonnel, getPersonnelById } from '../state.js';
import { showToast } from '../notifications.js';

const save = (k, d) => localStorage.setItem('hospital_' + k, JSON.stringify(d));
const load = (k) => { try { return JSON.parse(localStorage.getItem('hospital_' + k)); } catch { return null; } };

function getDocuments(pid) {
  const all = load('documents') || [];
  return pid ? all.filter(d => d.personnelId === pid) : all;
}
function addDocument(data) {
  const all = load('documents') || [];
  const rec = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
  all.push(rec); save('documents', all); return rec;
}
function deleteDocument(id) { save('documents', (load('documents') || []).filter(d => d.id !== id)); }

function seedDocs() {
  if (load('documents')) return;
  save('documents', [
    { id: 1, personnelId: 1, name: 'Uzmanlık Diploması', category: 'Eğitim', fileType: 'pdf', fileSize: '2.1 MB', notes: 'İç Hastalıkları Uzmanlık', createdAt: '2024-01-15T10:00:00Z' },
    { id: 2, personnelId: 1, name: 'İş Sözleşmesi', category: 'Sözleşme', fileType: 'pdf', fileSize: '850 KB', notes: '2024-2026 dönemi', createdAt: '2024-01-15T10:00:00Z' },
    { id: 3, personnelId: 7, name: 'Başhemşirelik Sertifikası', category: 'Sertifika', fileType: 'pdf', fileSize: '1.2 MB', notes: 'Geçerlilik: 2026', createdAt: '2023-06-01T10:00:00Z' },
    { id: 4, personnelId: 15, name: 'Hijyen Sertifikası', category: 'Sertifika', fileType: 'jpg', fileSize: '450 KB', notes: 'Yıllık yenileme', createdAt: '2024-03-10T10:00:00Z' },
    { id: 5, personnelId: 27, name: 'Elektrik Tesisat Belgesi', category: 'Eğitim', fileType: 'pdf', fileSize: '1.8 MB', notes: 'MYO mezuniyet', createdAt: '2022-07-01T10:00:00Z' },
  ]);
}

const CATEGORIES = ['Eğitim', 'Sertifika', 'Sözleşme', 'Kimlik', 'Sağlık', 'Diğer'];
const FILE_ICONS = { pdf: '📄', jpg: '🖼️', png: '🖼️', doc: '📝', xls: '📊', default: '📁' };

export function renderDocumentsPage(el) {
  seedDocs();
  const docs = getDocuments();
  const personnelList = getPersonnel({ status: 'active' });
  const catCounts = {};
  docs.forEach(d => { catCounts[d.category] = (catCounts[d.category] || 0) + 1; });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📄 Doküman Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">Personel belgeleri, sertifikalar ve sözleşmeler</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-2xl font-bold text-white">${docs.length}</p><p class="text-xs text-slate-400">Toplam Doküman</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${new Set(docs.map(d => d.personnelId)).size}</p><p class="text-xs text-slate-400">Personel</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-green-300">${Object.keys(catCounts).length}</p><p class="text-xs text-slate-400">Kategori</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-amber-300">${docs.filter(d => d.category === 'Sertifika').length}</p><p class="text-xs text-slate-400">Sertifika</p></div>
    </div>
    <div class="flex flex-wrap gap-2 mb-4 fade-in">
      <button class="btn-primary" id="doc-add-btn">➕ Doküman Ekle</button>
      <select id="doc-filter-cat" class="input-field text-sm"><option value="">Tüm Kategoriler</option>${CATEGORIES.map(c => `<option value="${c}">${c} (${catCounts[c] || 0})</option>`).join('')}</select>
      <select id="doc-filter-person" class="input-field text-sm"><option value="">Tüm Personel</option>${personnelList.map(p => `<option value="${p.id}">${p.name} ${p.surname}</option>`).join('')}</select>
    </div>
    <div id="doc-list" class="space-y-2 fade-in"></div>`;

  function renderList() {
    let filtered = getDocuments();
    const cat = document.getElementById('doc-filter-cat').value;
    const pid = document.getElementById('doc-filter-person').value;
    if (cat) filtered = filtered.filter(d => d.category === cat);
    if (pid) filtered = filtered.filter(d => d.personnelId === parseInt(pid));

    document.getElementById('doc-list').innerHTML = filtered.length === 0
      ? '<div class="empty-state"><div class="icon">📄</div><div class="title">Doküman bulunamadı</div></div>'
      : filtered.map(d => {
        const p = getPersonnelById(d.personnelId);
        const icon = FILE_ICONS[d.fileType] || FILE_ICONS.default;
        return `<div class="card flex items-center gap-3">
          <span class="text-2xl">${icon}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">${d.name}</p>
            <p class="text-xs text-slate-400">${p ? p.name + ' ' + p.surname : 'Bilinmiyor'} · ${d.category} · ${d.fileSize || '-'}</p>
            ${d.notes ? '<p class="text-xs text-slate-500 truncate">' + d.notes + '</p>' : ''}
          </div>
          <span class="text-xs text-slate-500">${new Date(d.createdAt).toLocaleDateString('tr-TR')}</span>
          <button class="doc-delete-btn btn-secondary text-xs px-2 py-1" data-id="${d.id}" aria-label="Sil">🗑️</button>
        </div>`;
      }).join('');

    document.querySelectorAll('.doc-delete-btn').forEach(btn => {
      btn.onclick = () => { if (confirm('Silmek istediğinize emin misiniz?')) { deleteDocument(parseInt(btn.dataset.id)); renderList(); showToast('Doküman silindi', 'success'); } };
    });
  }

  renderList();
  document.getElementById('doc-filter-cat').onchange = renderList;
  document.getElementById('doc-filter-person').onchange = renderList;
  document.getElementById('doc-add-btn').onclick = () => showDocModal(null, renderList);
}

function showDocModal(doc, onSave) {
  const existing = document.getElementById('doc-modal');
  if (existing) existing.remove();
  const personnelList = getPersonnel({ status: 'active' });
  const modal = document.createElement('div');
  modal.id = 'doc-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📄 Doküman Ekle</h3>
      <div class="space-y-3">
        <div><label class="label">Personel</label><select id="dm-person" class="input-field w-full">${personnelList.map(p => `<option value="${p.id}">${p.name} ${p.surname} - ${p.department}</option>`).join('')}</select></div>
        <div><label class="label">Doküman Adı</label><input id="dm-name" class="input-field w-full" placeholder="Örn: Hijyen Sertifikası"></div>
        <div><label class="label">Kategori</label><select id="dm-cat" class="input-field w-full">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
        <div><label class="label">Dosya Türü</label><select id="dm-type" class="input-field w-full"><option value="pdf">PDF</option><option value="jpg">JPG</option><option value="png">PNG</option><option value="doc">DOC</option><option value="xls">XLS</option></select></div>
        <div><label class="label">Not</label><input id="dm-notes" class="input-field w-full" placeholder="Opsiyonel açıklama"></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="dm-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="dm-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.getElementById('dm-cancel').onclick = () => modal.remove();
  document.getElementById('dm-save').onclick = () => {
    const name = document.getElementById('dm-name').value.trim();
    if (!name) { showToast('Doküman adı gereklidir', 'error'); return; }
    addDocument({
      personnelId: parseInt(document.getElementById('dm-person').value),
      name, category: document.getElementById('dm-cat').value,
      fileType: document.getElementById('dm-type').value,
      fileSize: '-',
      notes: document.getElementById('dm-notes').value.trim(),
    });
    modal.remove();
    showToast('Doküman eklendi', 'success');
    if (onSave) onSave();
  };
}
