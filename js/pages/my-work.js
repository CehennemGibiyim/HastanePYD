// ===== ÇALIŞAN İŞLERİM / GÖREV GELEN KUTUSU =====
import { getCurrentUser, getPersonnel, getTasks, saveTasks } from '../state.js';
import { showToast } from '../notifications.js';
import { escapeHTML } from '../services/hr-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const statuses = [
  { key: 'pending', label: 'work.pending', icon: '⏳' },
  { key: 'in_progress', label: 'work.in_progress', icon: '↻' },
  { key: 'completed', label: 'work.completed', icon: '✓' },
];
const priorities = { urgent: 'work.urgent', high: 'work.high', medium: 'work.medium', low: 'work.low' };

function resolvePerson(user, staff) {
  if (!user) return null;
  return staff.find(p => p.id && (p.id === user.personnelId || p.userId === user.username))
    || staff.find(p => p.username === user.username || p.email === user.email)
    || staff.find(p => `${p.name} ${p.surname}`.trim() === user.name);
}

function belongsToUser(task, user, person) {
  const fullName = person ? `${person.name} ${person.surname}`.trim() : '';
  const assigned = [task.assignedTo, task.assignee, task.assignedUsername].filter(Boolean).map(String);
  return Boolean(
    (person && String(task.assignedPersonnelId) === String(person.id))
    || assigned.includes(String(user?.username || ''))
    || assigned.includes(String(user?.name || ''))
    || (fullName && assigned.includes(fullName))
  );
}

export function renderMyWorkPage(container) {
  const user = getCurrentUser();
  const staff = getPersonnel({ status: 'active' });
  const person = resolvePerson(user, staff);
  const allTasks = getTasks();
  const direct = allTasks.filter(task => belongsToUser(task, user, person));
  const department = allTasks.filter(task => !belongsToUser(task, user, person) && !task.assignedTo && !task.assignedPersonnelId && person?.department && task.department === person.department);
  const tasks = [...direct, ...department].filter((task, index, list) => list.findIndex(x => x.id === task.id) === index);

  container.innerHTML = `<div class="fade-in space-y-5">
    <header class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs uppercase tracking-widest text-cyan-300">${t('work.eyebrow')}</p><h1 class="text-2xl font-bold text-white">${t('work.title')}</h1><p class="text-slate-400 text-sm mt-1">${t('work.subtitle')}</p></div><span class="badge">${escapeHTML(user?.name || t('work.unknown_user'))}</span></header>
    ${person ? `<div class="card border-cyan-500/20"><div class="flex flex-wrap items-center gap-3"><div class="w-11 h-11 rounded-xl bg-cyan-400/10 text-cyan-300 flex items-center justify-center text-xl">✓</div><div><p class="text-sm text-white font-semibold">${escapeHTML(`${person.name} ${person.surname}`)}</p><p class="text-xs text-slate-400">${escapeHTML(person.department || t('work.no_department'))} · ${escapeHTML(person.title || t('work.no_title'))}</p></div><div class="ml-auto text-right"><p class="text-2xl font-bold text-cyan-300">${tasks.filter(x => x.status !== 'completed').length}</p><p class="text-xs text-slate-500">${t('work.open_count')}</p></div></div></div>` : `<div class="card border-amber-500/20"><p class="font-semibold text-amber-200">${t('work.account_not_linked')}</p><p class="text-sm text-slate-400 mt-1">${t('work.account_not_linked_desc')}</p></div>`}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">${metric(t('work.all'), tasks.length, 'cyan')}${metric(t('work.pending'), tasks.filter(x => x.status === 'pending').length, 'amber')}${metric(t('work.in_progress'), tasks.filter(x => x.status === 'in_progress').length, 'blue')}${metric(t('work.completed'), tasks.filter(x => x.status === 'completed').length, 'green')}</div>
    <section class="card"><div class="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h2 class="text-lg font-semibold text-white">${t('work.inbox_title')}</h2><p class="text-xs text-slate-500 mt-1">${t('work.inbox_desc')}</p></div><button id="my-work-refresh" class="btn-secondary text-xs">${t('work.refresh')}</button></div><div id="my-work-list" class="space-y-3"></div></section>
  </div>`;
  renderList(tasks);
  document.getElementById('my-work-refresh').onclick = () => renderMyWorkPage(container);

  function renderList(items) {
    const list = document.getElementById('my-work-list');
    if (!items.length) { list.innerHTML = `<div class="empty-state py-8"><div class="icon">✓</div><div class="title">${t('work.empty_title')}</div><div class="desc">${t('work.empty_desc')}</div></div>`; return; }
    list.innerHTML = items.sort((a, b) => priorityRank(a) - priorityRank(b)).map(taskHTML).join('');
    list.querySelectorAll('[data-work-status]').forEach(select => select.onchange = () => {
      const task = allTasks.find(x => String(x.id) === select.dataset.workStatus);
      if (!task) return;
      task.status = select.value;
      saveTasks(allTasks);
      showToast(t('work.status_saved'), 'success');
      renderMyWorkPage(container);
    });
  }

  function taskHTML(task) {
    const status = statuses.find(x => x.key === task.status) || statuses[0];
    const overdue = task.status !== 'completed' && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
    const scope = belongsToUser(task, user, person) ? t('work.direct_assignment') : t('work.department_assignment');
    return `<article class="rounded-xl border ${overdue ? 'border-red-500/30' : 'border-white/5'} bg-white/[.03] p-4"><div class="flex flex-col lg:flex-row lg:items-center gap-3"><div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">${status.icon}</div><div class="flex-1 min-w-0"><div class="flex flex-wrap items-center gap-2"><h3 class="font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}">${escapeHTML(task.title || t('work.untitled'))}</h3><span class="badge">${t(priorities[task.priority] || priorities.medium)}</span>${overdue ? `<span class="text-xs text-red-300">${t('work.overdue')}</span>` : ''}</div><p class="text-xs text-slate-500 mt-1">${escapeHTML(scope)}${task.dueDate ? ` · ${t('work.due_date')}: ${escapeHTML(task.dueDate)}` : ''}</p>${task.description ? `<p class="text-sm text-slate-400 mt-2">${escapeHTML(task.description)}</p>` : ''}</div><select data-work-status="${escapeHTML(String(task.id))}" class="input-field text-xs w-full lg:w-44" aria-label="${t('work.change_status')}">${statuses.map(s => `<option value="${s.key}" ${task.status === s.key ? 'selected' : ''}>${s.icon} ${t(s.label)}</option>`).join('')}</select></div></article>`;
  }
}
function priorityRank(task) { return ({ urgent: 0, high: 1, medium: 2, low: 3 }[task.priority] ?? 2); }
function metric(label, value, color) { return `<div class="card border-${color}-500/20"><p class="text-xs text-slate-400">${label}</p><p class="text-2xl font-bold text-white mt-2">${value}</p></div>`; }
