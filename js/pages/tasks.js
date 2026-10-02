// ===== GÖREV YÖNETİMİ SAYFASI (SortableJS ile sürükle-bırak) =====

import {
  getPersonnel, getCurrentUser, isDepartmentRestricted, getUserDepartment,
  getTasks, saveTasks, DEPARTMENTS,
} from '../state.js';
import { showToast } from '../notifications.js';

const Sortable = window.Sortable;

const TASK_PRIORITIES = [
  { key: 'urgent', label: 'Acil', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '🔴' },
  { key: 'high', label: 'Yüksek', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '🟠' },
  { key: 'medium', label: 'Orta', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '🔵' },
  { key: 'low', label: 'Düşük', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', icon: '⚪' },
];

const TASK_STATUSES = [
  { key: 'pending', label: 'Beklemede', icon: '⏳' },
  { key: 'in_progress', label: 'Devam Ediyor', icon: '🔄' },
  { key: 'completed', label: 'Tamamlandı', icon: '✅' },
  { key: 'cancelled', label: 'İptal', icon: '❌' },
];

export function renderTasksPage(el) {
  const user = getCurrentUser();
  let tasks = getTasks();

  if (isDepartmentRestricted()) {
    const dept = getUserDepartment();
    const deptPersonnel = getPersonnel({ department: dept, status: 'active' }).map(p => p.id);
    tasks = tasks.filter(t =>
      t.assignedTo === user?.username ||
      t.createdBy === user?.username ||
      deptPersonnel.includes(t.assignedPersonnelId) ||
      t.department === dept
    );
  }

  const now = new Date();
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && t.dueDate < now.toISOString().split('T')[0]).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📋 Görev Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">Görev oluşturma, atama ve takip</p>
        </div>
        <button id="add-task-btn" class="btn-primary text-sm">+ Yeni Görev</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5">
        <p class="text-sm text-amber-300">⏳ Beklemede</p>
        <p class="text-3xl font-bold text-white mt-1">${pending}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 p-5">
        <p class="text-sm text-blue-300">🔄 Devam Eden</p>
        <p class="text-3xl font-bold text-white mt-1">${inProgress}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 p-5">
        <p class="text-sm text-green-300">✅ Tamamlanan</p>
        <p class="text-3xl font-bold text-white mt-1">${completed}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 p-5">
        <p class="text-sm text-red-300">⚠️ Gecikmiş</p>
        <p class="text-3xl font-bold text-white mt-1">${overdue}</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 mb-4 fade-in">
      <button data-task-filter="all" class="task-filter-btn tab-active">Tümü (${tasks.length})</button>
      ${TASK_STATUSES.map(s => `<button data-task-filter="${s.key}" class="task-filter-btn tab-inactive">${s.icon} ${s.label} (${tasks.filter(t => t.status === s.key).length})</button>`).join('')}
    </div>

    <div id="tasks-list" class="space-y-2 fade-in"></div>
    <div id="task-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"></div>`;

  let currentFilter = 'all';
  renderTasksList(tasks, currentFilter);

  document.querySelectorAll('.task-filter-btn').forEach(btn => {
    btn.onclick = () => {
      currentFilter = btn.dataset.taskFilter;
      document.querySelectorAll('.task-filter-btn').forEach(b => {
        b.className = `task-filter-btn ${b.dataset.taskFilter === currentFilter ? 'tab-active' : 'tab-inactive'}`;
      });
      renderTasksList(tasks, currentFilter);
    };
  });

  document.getElementById('add-task-btn').onclick = () => openTaskModal(null);

  function renderTasksList(allTasks, filter) {
    const container = document.getElementById('tasks-list');
    let filtered = filter === 'all' ? allTasks : allTasks.filter(t => t.status === filter);
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="text-center py-12 text-slate-500"><p class="text-4xl mb-2">📋</p><p>Bu kriterlere uygun görev yok</p></div>';
      return;
    }

    container.innerHTML = filtered.map(t => {
      const pri = TASK_PRIORITIES.find(p => p.key === t.priority) || TASK_PRIORITIES[2];
      const status = TASK_STATUSES.find(s => s.key === t.status) || TASK_STATUSES[0];
      const isOverdue = t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0];

      return `<div class="card flex items-start gap-3 ${isOverdue ? 'border-red-500/30' : ''}">
        <div class="shrink-0 mt-1">
          <button data-toggle-task="${t.id}" class="w-8 h-8 rounded-lg border ${t.status === 'completed' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'border-white/20 text-slate-500 hover:border-cyan-400/50'} flex items-center justify-center transition">${status.icon}</button>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-medium ${t.status === 'completed' ? 'text-slate-500 line-through' : 'text-white'}">${t.title}</p>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${pri.color}">${pri.icon} ${pri.label}</span>
            ${isOverdue ? '<span class="text-[10px] text-red-400">⚠️ Gecikmiş</span>' : ''}
          </div>
          ${t.description ? `<p class="text-xs text-slate-400 mt-1 line-clamp-2">${t.description}</p>` : ''}
          <div class="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
            ${t.dueDate ? `<span>📅 ${t.dueDate}</span>` : ''}
            ${t.assignedTo ? `<span>👤 ${t.assignedTo}</span>` : ''}
            ${t.department ? `<span>🏢 ${t.department}</span>` : ''}
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button data-edit-task="${t.id}" class="text-slate-400 hover:text-cyan-300 text-xs p-1">✏️</button>
          <button data-del-task="${t.id}" class="text-slate-400 hover:text-red-400 text-xs p-1">🗑️</button>
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('[data-toggle-task]').forEach(btn => {
      btn.onclick = () => {
        const task = allTasks.find(t => t.id === parseInt(btn.dataset.toggleTask));
        if (task) {
          const statusOrder = ['pending', 'in_progress', 'completed'];
          const idx = statusOrder.indexOf(task.status);
          task.status = statusOrder[(idx + 1) % statusOrder.length];
          saveTasks(allTasks);
          showToast(`Görev durumu: ${TASK_STATUSES.find(s => s.key === task.status)?.label}`, 'info');
          renderTasksList(allTasks, filter);
        }
      };
    });

    container.querySelectorAll('[data-edit-task]').forEach(btn => {
      btn.onclick = () => {
        const task = allTasks.find(t => t.id === parseInt(btn.dataset.editTask));
        if (task) openTaskModal(task);
      };
    });

    container.querySelectorAll('[data-del-task]').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
          const remaining = allTasks.filter(t => t.id !== parseInt(btn.dataset.delTask));
          saveTasks(remaining);
          showToast('Görev silindi', 'success');
          renderTasksList(remaining, filter);
        }
      };
    });

    // SortableJS ile sürükle-bırak sıralama
    if (Sortable && filtered.length > 1) {
      Sortable.create(container, {
        animation: 200,
        ghostClass: 'opacity-30',
        handle: '.card',
        onEnd: function(evt) {
          const cards = container.querySelectorAll('[data-toggle-task]');
          const newOrder = [];
          cards.forEach(btn => {
            const task = allTasks.find(t => t.id === parseInt(btn.dataset.toggleTask));
            if (task) newOrder.push(task);
          });
          if (newOrder.length === allTasks.length) {
            saveTasks(newOrder);
            showToast('Görev sırası güncellendi', 'info');
          }
        },
      });
    }
  }

  function openTaskModal(existing) {
    const modal = document.getElementById('task-modal');
    const personnel = getPersonnel({ status: 'active' });
    const users = [];

    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">${existing ? '✏️ Görev Düzenle' : '📋 Yeni Görev'}</h3>
          <button id="task-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">✕</button>
        </div>
        <div class="space-y-3">
          <div><label class="label">Görev Başlığı *</label><input id="task-title" class="input-field w-full" value="${existing?.title || ''}" placeholder="Görev açıklaması"></div>
          <div><label class="label">Detay</label><textarea id="task-desc" class="input-field w-full" rows="3" placeholder="Ek açıklamalar...">${existing?.description || ''}</textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Öncelik</label>
              <select id="task-priority" class="input-field w-full">
                ${TASK_PRIORITIES.map(p => `<option value="${p.key}" ${existing?.priority === p.key ? 'selected' : ''}>${p.icon} ${p.label}</option>`).join('')}
              </select>
            </div>
            <div><label class="label">Durum</label>
              <select id="task-status" class="input-field w-full">
                ${TASK_STATUSES.map(s => `<option value="${s.key}" ${existing?.status === s.key ? 'selected' : ''}>${s.icon} ${s.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div><label class="label">Bitiş Tarihi</label><input id="task-due" type="date" class="input-field w-full" value="${existing?.dueDate || ''}"></div>
          <div><label class="label">Atanan Kişi</label>
            <select id="task-assigned" class="input-field w-full">
              <option value="">Seçiniz</option>
              ${personnel.map(p => `<option value="${p.id}" ${existing?.assignedPersonnelId === p.id || existing?.assignedTo === p.name + ' ' + p.surname ? 'selected' : ''}>${p.name} ${p.surname} (${p.department})</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="task-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="task-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;

    modal.classList.remove('hidden');
    modal.onclick = (e) => { if (e.target.id === 'task-modal') modal.classList.add('hidden'); };
    document.getElementById('task-close').onclick = () => modal.classList.add('hidden');
    document.getElementById('task-cancel').onclick = () => modal.classList.add('hidden');

    document.getElementById('task-save').onclick = () => {
      const title = document.getElementById('task-title').value.trim();
      if (!title) { showToast('Görev başlığı gereklidir', 'error'); return; }

      const allTasks = getTasks();
      const assignedPerson = personnel.find(p => String(p.id) === document.getElementById('task-assigned').value);
      const taskData = {
        title,
        description: document.getElementById('task-desc').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        dueDate: document.getElementById('task-due').value,
        assignedTo: assignedPerson ? `${assignedPerson.name} ${assignedPerson.surname}` : '',
        assignedPersonnelId: assignedPerson?.id || null,
        createdBy: getCurrentUser()?.name || 'Sistem',
      };

      if (existing) {
        const idx = allTasks.findIndex(t => t.id === existing.id);
        if (idx >= 0) allTasks[idx] = { ...allTasks[idx], ...taskData };
      } else {
        allTasks.push({ id: Date.now(), ...taskData, createdAt: new Date().toISOString() });
      }

      saveTasks(allTasks);
      modal.classList.add('hidden');
      showToast(existing ? 'Görev güncellendi' : 'Görev oluşturuldu', 'success');
      renderTasksPage(el);
    };
  }
}
