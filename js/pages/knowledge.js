// ===== BILGI BANKASI (SOP) =====
import { getKnowledgeArticles, addKnowledgeArticle, updateKnowledgeArticle, deleteKnowledgeArticle } from '../state-extensions.js';
import { hasPermission, getDepartments } from '../state.js';
import { showToast } from '../notifications.js';

export function renderKnowledgePage(el) {
  const canWrite = hasPermission('write');
  const articles = getKnowledgeArticles();
  const categories = [...new Set(articles.map(a => a.category))];

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">📚 Bilgi Bankası (SOP)</h1>
        <p class="text-slate-400 text-sm mt-1">Hastane prosedürleri ve politikaları</p>
      </div>
      ${canWrite ? '<button id="kb-add-btn" class="btn-primary">➕ Makale Ekle</button>' : ''}
    </div>
    <div class="flex flex-wrap gap-3 mb-4 fade-in">
      <input id="kb-search" class="input-field w-64" placeholder="🔍 Ara...">
      <select id="kb-dept" class="input-field w-48">
        <option value="">Tüm Departmanlar</option>
        ${getDepartments().map(d => '<option>' + d + '</option>').join('')}
        <option>Genel</option>
      </select>
      <select id="kb-cat" class="input-field w-40">
        <option value="">Tüm Kategoriler</option>
        ${categories.map(c => '<option>' + c + '</option>').join('')}
      </select>
    </div>
    <div id="kb-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in"></div>`;

  function renderList() {
    const search = document.getElementById('kb-search').value.toLowerCase();
    const dept = document.getElementById('kb-dept').value;
    const cat = document.getElementById('kb-cat').value;
    let filtered = getKnowledgeArticles({ department: dept, category: cat });
    if (search) filtered = filtered.filter(a => a.title.toLowerCase().includes(search) || a.content.toLowerCase().includes(search));

    document.getElementById('kb-list').innerHTML = filtered.length === 0
      ? '<div class="col-span-full empty-state"><div class="icon">📚</div><div class="title">Makale bulunamadı</div></div>'
      : filtered.map(a => `
      <div class="card hover:bg-white/10 transition cursor-pointer" data-article-id="${a.id}">
        <div class="flex items-start justify-between mb-2">
          <span class="badge">${a.category}</span>
          <span class="text-xs text-slate-500">${a.views || 0} 👁️</span>
        </div>
        <h4 class="font-semibold text-white mb-1">${a.title}</h4>
        <p class="text-xs text-slate-400 line-clamp-3 mb-3">${a.content}</p>
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span>🏢 ${a.department}</span>
          <span>👤 ${a.author || 'Sistem'}</span>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('[data-article-id]').forEach(card => {
      card.onclick = () => {
        const article = filtered.find(a => a.id === parseInt(card.dataset.articleId));
        if (article) openArticleModal(article, canWrite, renderList);
      };
    });
  }

  renderList();
  document.getElementById('kb-search').oninput = renderList;
  document.getElementById('kb-dept').onchange = renderList;
  document.getElementById('kb-cat').onchange = renderList;
  document.getElementById('kb-add-btn')?.addEventListener('click', () => openAddModal(renderList));
}

function openArticleModal(article, canWrite, refresh) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <span class="badge">${article.category}</span>
        <button id="kb-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">✕</button>
      </div>
      <h2 class="text-xl font-bold text-white mb-2">${article.title}</h2>
      <div class="flex gap-3 text-xs text-slate-500 mb-4">
        <span>🏢 ${article.department}</span>
        <span>👤 ${article.author || 'Sistem'}</span>
        <span>📅 ${new Date(article.createdAt).toLocaleDateString('tr-TR')}</span>
        <span>👁️ ${article.views || 0}</span>
      </div>
      <div class="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">${article.content}</div>
      ${canWrite ? `<div class="flex gap-2 mt-6 pt-4 border-t border-white/10">
        <button id="kb-edit" class="btn-secondary text-sm">✏️ Düzenle</button>
        <button id="kb-delete" class="btn-secondary text-sm text-red-400 border-red-500/20 hover:bg-red-500/10">🗑️ Sil</button>
      </div>` : ''}
    </div>`;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.getElementById('kb-close').onclick = () => modal.remove();
  document.getElementById('kb-edit')?.addEventListener('click', () => { modal.remove(); openEditModal(article, refresh); });
  document.getElementById('kb-delete')?.addEventListener('click', () => { deleteKnowledgeArticle(article.id); modal.remove(); showToast('Makale silindi', 'success'); refresh(); });
}

function openAddModal(refresh) {
  const depts = getDepartments();
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-lg font-bold text-white mb-4">➕ Yeni Makale</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık</label><input id="kb-title" class="input-field w-full" placeholder="Makale başlığı"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Departman</label><select id="kb-dept2" class="input-field w-full"><option>Genel</option>${depts.map(d => '<option>' + d + '</option>').join('')}</select></div>
          <div><label class="label">Kategori</label><select id="kb-cat2" class="input-field w-full"><option>Protokol</option><option>Prosedur</option><option>Rehber</option><option>Egitim</option><option>Politika</option></select></div>
        </div>
        <div><label class="label">İçerik</label><textarea id="kb-content" class="input-field w-full h-32 resize-none" placeholder="Makale içeriği..."></textarea></div>
      </div>
      <div class="flex gap-3 mt-5">
        <button id="kb-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="kb-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('kb-cancel').onclick = () => modal.remove();
  document.getElementById('kb-save').onclick = () => {
    const title = document.getElementById('kb-title').value.trim();
    if (!title) return showToast('Başlık girin', 'error');
    addKnowledgeArticle({ title, content: document.getElementById('kb-content').value, department: document.getElementById('kb-dept2').value, category: document.getElementById('kb-cat2').value, author: 'Admin' });
    modal.remove(); showToast('Makale eklendi', 'success'); refresh();
  };
}

function openEditModal(article, refresh) {
  const depts = getDepartments();
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-lg font-bold text-white mb-4">✏️ Makale Düzenle</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık</label><input id="kb-title" class="input-field w-full" value="${article.title}"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Departman</label><select id="kb-dept2" class="input-field w-full"><option>Genel</option>${depts.map(d => `<option ${d === article.department ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
          <div><label class="label">Kategori</label><select id="kb-cat2" class="input-field w-full"><option>Protokol</option><option>Prosedur</option><option>Rehber</option><option>Egitim</option><option>Politika</option></select></div>
        </div>
        <div><label class="label">İçerik</label><textarea id="kb-content" class="input-field w-full h-32 resize-none">${article.content}</textarea></div>
      </div>
      <div class="flex gap-3 mt-5">
        <button id="kb-save" class="btn-primary flex-1">💾 Güncelle</button>
        <button id="kb-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('kb-cancel').onclick = () => modal.remove();
  document.getElementById('kb-save').onclick = () => {
    updateKnowledgeArticle(article.id, { title: document.getElementById('kb-title').value, content: document.getElementById('kb-content').value, department: document.getElementById('kb-dept2').value, category: document.getElementById('kb-cat2').value });
    modal.remove(); showToast('Makale güncellendi', 'success'); refresh();
  };
}
