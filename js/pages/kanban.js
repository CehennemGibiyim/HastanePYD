// ===== KANBAN GÖREV PANOSU =====
import { getTasks, saveTasks, getPersonnel, getPersonnelById } from '../state.js';
import { showToast } from '../notifications.js';

const COLUMNS = [
  { id: 'todo', label: 'Yapılacak', icon: '📋', color: 'slate' },
  { id: 'inprogress', label: 'Devam Eden', icon: '🔄', color: 'blue' },
  { id: 'review', label: 'İnceleme', icon: '🔍', color: 'amber' },
  { id: 'done', label: 'Tamamlandı', icon: '✅', color: 'green' },
];

const PRIORITY_COLORS = {
  high: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', label: 'Acil' },
  medium: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Normal' },
  low: { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-400', label: 'Düşük' },
};

const TAG_PRESETS = [
  { id: 'patient', label: 'Hasta', emoji: '🏥', color: 'cyan' },
  { id: 'admin', label: 'İdari', emoji: '📋', color: 'purple' },
  { id: 'maintenance', label: 'Bakım', emoji: '🔧', color: 'amber' },
  { id: 'training', label: 'Eğitim', emoji: '📚', color: 'blue' },
  { id: 'emergency', label: 'Acil', emoji: '🚨', color: 'red' },
];

let currentFilter = { department: '', priority: '', assignee: '' };
let dragState = null;

export function renderKanbanPage(container) {
  const tasks = getTasks().map(t => ({ ...t, status: t.status || 'todo' }));
  const personnel = getPersonnel({ status: 'active' });
  const departments = [...new Set(personnel.map(p => p.department))];

  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">📋 Kanban Görev Panosu</h1>
          <p class="text-slate-400 text-sm mt-1">Sürükle-bırak ile görev yönetimi</p>
        </div>
        <div class="flex gap-2">
          <button id="kanban-add-btn" class="btn-primary">+ Yeni Görev</button>
          <select id="kanban-dept-filter" class="input-field text-sm">
            <option value="">Tüm Departmanlar</option>
            ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
          <select id="kanban-priority-filter" class="input-field text-sm">
            <option value="">Tüm Öncelikler</option>
            <option value="high">🔴 Acil</option>
            <option value="medium">🟡 Normal</option>
            <option value="low">🟢 Düşük</option>
          </select>
        </div>
      </div>
      <div id="kanban-stats" class="grid grid-cols-4 gap-3 mb-6"></div>
      <div id="kanban-board" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"></div>
    </div>`;

  renderKanbanBoard(tasks, personnel);
  renderKanbanStats(tasks);

  document.getElementById('kanban-add-btn').onclick = () => showTaskModal(null, personnel);
  document.getElementById('kanban-dept-filter').onchange = (e) => {
    currentFilter.department = e.target.value;
    renderKanbanBoard(getTasks().map(t => ({ ...t, status: t.status || 'todo' })), personnel);
  };
  document.getElementById('kanban-priority-filter').onchange = (e) => {
    currentFilter.priority = e.target.value;
    renderKanbanBoard(getTasks().map(t => ({ ...t, status: t.status || 'todo' })), personnel);
  };
}

function renderKanbanStats(tasks) {
  const stats = COLUMNS.map(col => ({
    ...col,
    count: tasks.filter(t => t.status === col.id).length,
  }));
  const total = tasks.length;
  document.getElementById('kanban-stats').innerHTML = stats.map(s => `
    <div class="card text-center py-3">
      <p class="text-2xl font-bold text-white">${s.count}</p>
      <p class="text-xs text-slate-400">${s.icon} ${s.label}</p>
      <div class="w-full h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
        <div class="h-full rounded-full bg-${s.color === 'slate' ? 'slate' : s.color}-400 transition-all" style="width:${total ? Math.round(s.count/total*100) : 0}%"></div>
      </div>
    </div>
  `).join('');
}

function renderKanbanBoard(tasks, personnel) {
  let filtered = [...tasks];
  if (currentFilter.department) filtered = filtered.filter(t => {
    const p = personnel.find(x => x.id === t.assignedTo);
    return p?.department === currentFilter.department;
  });
  if (currentFilter.priority) filtered = filtered.filter(t => t.priority === currentFilter.priority);

  const board = document.getElementById('kanban-board');
  board.innerHTML = COLUMNS.map(col => {
    const colTasks = filtered.filter(t => t.status === col.id);
    return `
      <div class="kanban-column" data-status="${col.id}">
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2">
            <span class="text-lg">${col.icon}</span>
            <span class="font-semibold text-white text-sm">${col.label}</span>
            <span class="badge text-xs">${colTasks.length}</span>
          </div>
        </div>
        <div class="kanban-drop-zone space-y-2 min-h-[200px] rounded-xl p-2 bg-white/[0.02] border border-dashed border-white/5 transition-all"
             data-status="${col.id}">
          ${colTasks.length === 0 ? `
            <div class="text-center py-8 text-slate-600 text-xs">
              <p class="text-2xl mb-2">📭</p>
              <p>Görev yok</p>
            </div>
          ` : colTasks.map(t => taskCardHTML(t, personnel)).join('')}
        </div>
      </div>`;
  }).join('');

  initDragDrop(personnel);
}

function taskCardHTML(task, personnel) {
  const p = task.assignedTo ? personnel.find(x => x.id === task.assignedTo) : null;
  const pri = PRIORITY_COLORS[task.priority || 'medium'];
  const tag = task.tag ? TAG_PRESETS.find(t => t.id === task.tag) : null;
  const comments = task.comments || [];

  return `
    <div class="kanban-task card cursor-grab active:cursor-grabbing p-3 hover:border-white/20 transition-all"
         draggable="true" data-task-id="${task.id}">
      <div class="flex items-start justify-between gap-2 mb-2">
        <span class="text-xs px-2 py-0.5 rounded-full ${pri.bg} ${pri.border} border ${pri.text}">${pri.label}</span>
        <button class="kanban-edit-btn text-slate-500 hover:text-white text-xs p-1" data-task-id="${task.id}">✏️</button>
      </div>
      <p class="text-sm font-medium text-white mb-2 leading-snug">${task.title || task.text || 'Başlıksız Görev'}</p>
      ${task.description ? `<p class="text-xs text-slate-400 mb-2 line-clamp-2">${task.description}</p>` : ''}
      ${tag ? `<span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-${tag.color}-500/15 text-${tag.color}-400 border border-${tag.color}-500/20 mb-2">${tag.emoji} ${tag.label}</span>` : ''}
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        ${p ? `
          <div class="flex items-center gap-1.5">
            <div class="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-300 overflow-hidden">${p.photo ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" class="w-full h-full object-cover">` : p.name[0]}</div>
            <span class="text-xs text-slate-400">${p.name} ${p.surname}</span>
          </div>
        ` : '<span class="text-xs text-slate-600">Atanmamış</span>'}
        <div class="flex items-center gap-2 text-xs text-slate-500">
          ${comments.length ? `<span>💬 ${comments.length}</span>` : ''}
          ${task.dueDate ? `<span>📅 ${task.dueDate}</span>` : ''}
        </div>
      </div>
    </div>`;
}

function initDragDrop(personnel) {
  document.querySelectorAll('.kanban-task').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      dragState = { taskId: parseInt(card.dataset.taskId) };
      card.classList.add('opacity-50', 'scale-95');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-50', 'scale-95');
      document.querySelectorAll('.kanban-drop-zone').forEach(z => {
        z.classList.remove('border-cyan-500/30', 'bg-cyan-500/5');
      });
    });
  });

  document.querySelectorAll('.kanban-drop-zone').forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('border-cyan-500/30', 'bg-cyan-500/5');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('border-cyan-500/30', 'bg-cyan-500/5');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('border-cyan-500/30', 'bg-cyan-500/5');
      if (!dragState) return;
      const newStatus = zone.dataset.status;
      const tasks = getTasks();
      const idx = tasks.findIndex(t => t.id === dragState.taskId);
      if (idx >= 0) {
        tasks[idx].status = newStatus;
        saveTasks(tasks);
        showToast('Görev taşındı: ' + COLUMNS.find(c => c.id === newStatus)?.label, 'success');
        renderKanbanBoard(tasks.map(t => ({ ...t, status: t.status || 'todo' })), personnel);
        renderKanbanStats(tasks.map(t => ({ ...t, status: t.status || 'todo' })));
      }
      dragState = null;
    });
  });

  document.querySelectorAll('.kanban-edit-btn').forEach(btn => {
    btn.onclick = () => {
      const taskId = parseInt(btn.dataset.taskId);
      const tasks = getTasks();
      const task = tasks.find(t => t.id === taskId);
      if (task) showTaskModal(task, getPersonnel({ status: 'active' }));
    };
  });
}

function showTaskModal(existingTask, personnel) {
  const task = existingTask || { title: '', description: '', priority: 'medium', assignedTo: '', tag: '', dueDate: '', status: 'todo' };
  const existing = document.getElementById('kanban-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'kanban-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[80vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">${existingTask ? '✏️ Görevi Düzenle' : '➕ Yeni Görev'}</h3>
      <div class="space-y-3">
        <div>
          <label class="label">Başlık *</label>
          <input id="k-task-title" class="input-field w-full" value="${task.title || ''}" placeholder="Görev başlığı">
        </div>
        <div>
          <label class="label">Açıklama</label>
          <textarea id="k-task-desc" class="input-field w-full" rows="3" placeholder="Detaylı açıklama...">${task.description || ''}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Öncelik</label>
            <select id="k-task-priority" class="input-field w-full">
              <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔴 Acil</option>
              <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>🟡 Normal</option>
              <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🟢 Düşük</option>
            </select>
          </div>
          <div>
            <label class="label">Durum</label>
            <select id="k-task-status" class="input-field w-full">
              ${COLUMNS.map(c => `<option value="${c.id}" ${task.status === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Sorumlu Personel</label>
            <select id="k-task-assignee" class="input-field w-full">
              <option value="">Atanmamış</option>
              ${personnel.map(p => `<option value="${p.id}" ${task.assignedTo === p.id ? 'selected' : ''}>${p.name} ${p.surname} - ${p.department}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="label">Etiket</label>
            <select id="k-task-tag" class="input-field w-full">
              <option value="">Etiket Yok</option>
              ${TAG_PRESETS.map(t => `<option value="${t.id}" ${task.tag === t.id ? 'selected' : ''}>${t.emoji} ${t.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div>
          <label class="label">Bitiş Tarihi</label>
          <input id="k-task-due" type="date" class="input-field w-full" value="${task.dueDate || ''}">
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="k-task-save" class="btn-primary flex-1">💾 Kaydet</button>
        ${existingTask ? `<button id="k-task-delete" class="btn-secondary text-red-400">🗑️ Sil</button>` : ''}
        <button id="k-task-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.id === 'kanban-modal') modal.remove(); };
  document.getElementById('k-task-cancel').onclick = () => modal.remove();

  document.getElementById('k-task-save').onclick = () => {
    const title = document.getElementById('k-task-title').value.trim();
    if (!title) { showToast('Başlık gereklidir', 'error'); return; }
    const updatedTask = {
      ...task,
      title,
      description: document.getElementById('k-task-desc').value.trim(),
      priority: document.getElementById('k-task-priority').value,
      status: document.getElementById('k-task-status').value,
      assignedTo: parseInt(document.getElementById('k-task-assignee').value) || null,
      tag: document.getElementById('k-task-tag').value || null,
      dueDate: document.getElementById('k-task-due').value || null,
      comments: task.comments || [],
    };
    const tasks = getTasks();
    if (existingTask) {
      const idx = tasks.findIndex(t => t.id === task.id);
      if (idx >= 0) tasks[idx] = { ...tasks[idx], ...updatedTask };
    } else {
      updatedTask.id = Date.now();
      updatedTask.createdAt = new Date().toISOString();
      tasks.push(updatedTask);
    }
    saveTasks(tasks);
    modal.remove();
    showToast(existingTask ? 'Görev güncellendi' : 'Yeni görev eklendi', 'success');
    const ppl = getPersonnel({ status: 'active' });
    renderKanbanBoard(tasks.map(t => ({ ...t, status: t.status || 'todo' })), ppl);
    renderKanbanStats(tasks.map(t => ({ ...t, status: t.status || 'todo' })));
  };

  if (existingTask) {
    document.getElementById('k-task-delete').onclick = () => {
      const tasks = getTasks().filter(t => t.id !== task.id);
      saveTasks(tasks);
      modal.remove();
      showToast('Görev silindi', 'success');
      const ppl = getPersonnel({ status: 'active' });
      renderKanbanBoard(tasks.map(t => ({ ...t, status: t.status || 'todo' })), ppl);
      renderKanbanStats(tasks.map(t => ({ ...t, status: t.status || 'todo' })));
    };
  }
}
