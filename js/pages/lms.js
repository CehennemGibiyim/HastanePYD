// ===== EĞİTİM YÖNETİM SİSTEMİ (LMS) =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

export function renderLMSPage(container) {
  const courses = getCourses();
  const enrollments = getEnrollments();
  const personnel = getPersonnel({ status: 'active' });
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">🎓 Eğitim Yönetim Sistemi (LMS)</h1>
          <p class="text-slate-400 text-sm mt-1">Kurs oluşturma, kayıt ve sertifika takibi</p>
        </div>
        <button id="lms-add-btn" class="btn-primary">+ Yeni Kurs</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${lmsStat('📚', 'Toplam Kurs', courses.length, 'cyan')}
        ${lmsStat('👥', 'Toplam Kayıt', enrollments.length, 'green')}
        ${lmsStat('✅', 'Tamamlanan', enrollments.filter(e=>e.completed).length, 'emerald')}
        ${lmsStat('📜', 'Sertifika', enrollments.filter(e=>e.completed).length, 'purple')}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="lms-courses"></div>
    </div>`;
  renderCourses(courses, enrollments, personnel);
  document.getElementById('lms-add-btn').onclick = () => showCourseModal();
}

function renderCourses(courses, enrollments, personnel) {
  const el = document.getElementById('lms-courses');
  if (courses.length === 0) {
    el.innerHTML = '<div class="col-span-full empty-state card"><div class="icon">📚</div><div class="title">Henüz kurs yok</div></div>';
    return;
  }
  el.innerHTML = courses.map(c => {
    const courseEnrollments = enrollments.filter(e => e.courseId === c.id);
    const completed = courseEnrollments.filter(e => e.completed).length;
    const pct = courseEnrollments.length ? Math.round(completed / courseEnrollments.length * 100) : 0;
    return `
      <div class="card hover:border-cyan-500/30 transition-all">
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl">${c.icon || '📚'}</span>
          <span class="badge ${pct===100?'bg-green-500/20 text-green-400':'bg-cyan-500/20 text-cyan-400'}">${pct}%</span>
        </div>
        <h3 class="font-semibold text-white mb-1">${c.title}</h3>
        <p class="text-xs text-slate-400 mb-3 line-clamp-2">${c.description || ''}</p>
        <div class="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <span>⏱️ ${c.duration || '2 saat'}</span>
          <span>👥 ${courseEnrollments.length} kayıtlı</span>
          <span>📜 ${c.certificate ? 'Sertifikalı' : '-'}</span>
        </div>
        <div class="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-3">
          <div class="h-full rounded-full bg-cyan-500 transition-all" style="width:${pct}%"></div>
        </div>
        <div class="flex gap-2">
          <button class="lms-enroll-btn btn-primary text-xs flex-1" data-id="${c.id}">👥 Kayıt Et</button>
          <button class="lms-detail-btn btn-secondary text-xs px-3" data-id="${c.id}">📋</button>
          <button class="lms-del-btn btn-secondary text-xs px-3 text-red-400" data-id="${c.id}">🗑️</button>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.lms-enroll-btn').forEach(b => {
    b.onclick = () => showEnrollModal(parseInt(b.dataset.id), personnel);
  });
  el.querySelectorAll('.lms-detail-btn').forEach(b => {
    b.onclick = () => showCourseDetail(parseInt(b.dataset.id));
  });
  el.querySelectorAll('.lms-del-btn').forEach(b => {
    b.onclick = () => {
      const cs = getCourses().filter(c => c.id !== parseInt(b.dataset.id));
      saveCourses(cs);
      showToast('Kurs silindi', 'success');
      renderLMSPage(document.getElementById('content'));
    };
  });
}

function showCourseModal() {
  const m = document.createElement('div');
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  m.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
    <h3 class="text-xl font-bold text-white mb-4">📚 Yeni Kurs Oluştur</h3>
    <div class="space-y-3">
      <div><label class="label">Kurs Adı *</label><input id="lc-title" class="input-field w-full" placeholder="Kurs başlığı"></div>
      <div><label class="label">Açıklama</label><textarea id="lc-desc" class="input-field w-full" rows="3" placeholder="Kurs açıklaması"></textarea></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label">Süre</label><input id="lc-duration" class="input-field w-full" value="2 saat"></div>
        <div><label class="label">Sertifikalı mı?</label><select id="lc-cert" class="input-field w-full"><option value="1">Evet</option><option value="0">Hayır</option></select></div>
      </div>
      <div><label class="label">İkon</label><input id="lc-icon" class="input-field w-full" value="📚" maxlength="2"></div>
    </div>
    <div class="flex gap-3 mt-6"><button id="lc-save" class="btn-primary flex-1">💾 Oluştur</button><button onclick="this.closest('.fixed').remove()" class="btn-secondary flex-1">İptal</button></div></div>`;
  document.body.appendChild(m);
  document.getElementById('lc-save').onclick = () => {
    const title = document.getElementById('lc-title').value.trim();
    if (!title) { showToast('Kurs adı gereklidir', 'error'); return; }
    const cs = getCourses();
    cs.push({ id: Date.now(), title, description: document.getElementById('lc-desc').value.trim(), duration: document.getElementById('lc-duration').value, certificate: document.getElementById('lc-cert').value === '1', icon: document.getElementById('lc-icon').value || '📚', createdAt: new Date().toISOString() });
    saveCourses(cs);
    m.remove(); showToast('Kurs oluşturuldu!', 'success');
    renderLMSPage(document.getElementById('content'));
  };
}

function showEnrollModal(courseId, personnel) {
  const enrollments = getEnrollments();
  const enrolled = enrollments.filter(e => e.courseId === courseId).map(e => e.personnelId);
  const m = document.createElement('div');
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  m.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[80vh] overflow-y-auto">
    <h3 class="text-xl font-bold text-white mb-4">👥 Kursa Kayıt Et</h3>
    <div class="space-y-2" id="le-checkboxes">
      ${personnel.map(p => `
        <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
          <input type="checkbox" class="le-person rounded" value="${p.id}" ${enrolled.includes(p.id)?'checked':''}>
          <span class="text-sm text-white">${p.name} ${p.surname}</span>
          <span class="text-xs text-slate-500">${p.department}</span>
        </label>`).join('')}
    </div>
    <div class="flex gap-3 mt-6"><button id="le-save" class="btn-primary flex-1">👥 Kaydet</button><button onclick="this.closest('.fixed').remove()" class="btn-secondary flex-1">İptal</button></div></div>`;
  document.body.appendChild(m);
  document.getElementById('le-save').onclick = () => {
    const checked = Array.from(m.querySelectorAll('.le-person:checked')).map(c => parseInt(c.value));
    let all = getEnrollments().filter(e => e.courseId !== courseId);
    checked.forEach(pid => {
      const existing = getEnrollments().find(e => e.courseId === courseId && e.personnelId === pid);
      all.push(existing || { id: Date.now() + pid, courseId, personnelId: pid, enrolledAt: new Date().toISOString(), progress: 0, completed: false });
    });
    saveEnrollments(all);
    m.remove(); showToast(checked.length + ' kişi kaydedildi', 'success');
    renderLMSPage(document.getElementById('content'));
  };
}

function showCourseDetail(courseId) {
  const course = getCourses().find(c => c.id === courseId);
  const enrollments = getEnrollments().filter(e => e.courseId === courseId);
  const personnel = getPersonnel({ status: 'active' });
  if (!course) return;
  const m = document.createElement('div');
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  m.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[80vh] overflow-y-auto">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-bold text-white">${course.icon} ${course.title}</h3>
      <button onclick="this.closest('.fixed').remove()" class="btn-secondary text-xs">✕</button>
    </div>
    <p class="text-sm text-slate-400 mb-4">${course.description || 'Açıklama yok'}</p>
    <div class="overflow-x-auto"><table class="w-full"><thead><tr>
      <th class="th">Personel</th><th class="th">Departman</th><th class="th">İlerleme</th><th class="th">Durum</th><th class="th">İşlem</th>
    </tr></thead><tbody>
      ${enrollments.map(e => {
        const p = personnel.find(x => x.id === e.personnelId);
        return `<tr class="border-t border-white/5">
          <td class="td">${p ? p.name+' '+p.surname : '?'}</td>
          <td class="td text-xs">${p?.department||'-'}</td>
          <td class="td"><div class="w-20 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full bg-cyan-500" style="width:${e.progress||0}%"></div></div></td>
          <td class="td">${e.completed ? '<span class="badge bg-green-500/20 text-green-400">✅ Tamamlandı</span>' : '<span class="badge bg-amber-500/20 text-amber-400">⏳ Devam</span>'}</td>
          <td class="td"><button class="lms-complete-btn btn-secondary text-xs px-2 py-1" data-eid="${e.id}" ${e.completed?'disabled':''}>✅ Tamamla</button></td>
        </tr>`;
      }).join('')}
    </tbody></table></div></div>`;
  document.body.appendChild(m);
  m.querySelectorAll('.lms-complete-btn').forEach(b => {
    b.onclick = () => {
      const all = getEnrollments();
      const en = all.find(e => e.id === parseInt(b.dataset.eid));
      if (en) { en.completed = true; en.progress = 100; en.completedAt = new Date().toISOString(); saveEnrollments(all); }
      showToast('Kurs tamamlandı! 🎓', 'success');
      m.remove();
    };
  });
}

function getCourses() { try { return JSON.parse(localStorage.getItem('hospital_lms_courses') || '[]'); } catch { return []; } }
function saveCourses(c) { localStorage.setItem('hospital_lms_courses', JSON.stringify(c)); }
function getEnrollments() { try { return JSON.parse(localStorage.getItem('hospital_lms_enrollments') || '[]'); } catch { return []; } }
function saveEnrollments(e) { localStorage.setItem('hospital_lms_enrollments', JSON.stringify(e)); }
function lmsStat(icon, label, value, color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5"><p class="text-sm text-${color}-300">${icon} ${label}</p><p class="text-2xl font-bold text-white mt-1">${value}</p></div>`;
}
