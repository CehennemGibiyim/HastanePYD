// ===== IZIN YONETIMI - ONAY AKISI & BAKIYE =====
import { getPersonnel } from '../state.js';

function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_leave_mgmt') || '{"requests":[],"balances":{}}'); } catch { return { requests: [], balances: {} }; }
}
function setStorage(d) { localStorage.setItem('hospital_leave_mgmt', JSON.stringify(d)); }

const LEAVE_TYPES = [
  { id: 'annual', label: 'Yıllık İzin', days: 14, icon: '🏖️', color: 'cyan' },
  { id: 'sick', label: 'Raporlu', days: 0, icon: '🤒', color: 'red' },
  { id: 'excuse', label: 'Mazeret İzni', days: 3, icon: '📋', color: 'amber' },
  { id: 'maternity', label: 'Doğum İzni', days: 0, icon: '👶', color: 'pink' },
  { id: 'paternity', label: 'Babalık İzni', days: 5, icon: '👨‍🍼', color: 'blue' },
  { id: 'marriage', label: 'Evlilik İzni', days: 3, icon: '💒', color: 'purple' },
  { id: 'bereavement', label: 'Vefat İzni', days: 3, icon: '🕊️', color: 'slate' },
  { id: 'unpaid', label: 'Ücretsiz İzin', days: 0, icon: '💸', color: 'orange' },
];

const STATUS_MAP = {
  pending: { label: 'Beklemede', color: 'amber', icon: '⏳' },
  approved_manager: { label: 'Sorumlu Onaylı', color: 'blue', icon: '✅' },
  approved: { label: 'Onaylı', color: 'emerald', icon: '✅' },
  rejected: { label: 'Reddedildi', color: 'red', icon: '❌' },
  cancelled: { label: 'İptal', color: 'slate', icon: '🚫' },
};

function getBalance(empId) {
  const data = getStorage();
  if (!data.balances[empId]) {
    data.balances[empId] = {};
    LEAVE_TYPES.forEach(lt => {
      data.balances[empId][lt.id] = { total: lt.days, used: 0 };
    });
    setStorage(data);
  }
  return data.balances[empId];
}

function calcDays(start, end) {
  const s = new Date(start), e = new Date(end);
  if (isNaN(s) || isNaN(e) || e < s) return 0;
  return Math.ceil((e - s) / 86400000) + 1;
}

export function renderLeaveManagementPage(el) {
  const data = getStorage();
  const personnel = getPersonnel({}).filter(p => p.status === 'active');
  const tab = data._tab || 'new';
  const filter = data._filter || 'all';

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🏖️ İzin Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">İzin talepleri, onay akışı ve bakiye takibi</p>
    </div>

    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 fade-in">
      <button class="${tab === 'new' ? 'tab-active' : 'tab-inactive'}" data-tab="new">📝 Yeni Talep</button>
      <button class="${tab === 'pending' ? 'tab-active' : 'tab-inactive'}" data-tab="pending">⏳ Onay Bekleyen</button>
      <button class="${tab === 'history' ? 'tab-active' : 'tab-inactive'}" data-tab="history">📋 Tüm Talepler</button>
      <button class="${tab === 'balance' ? 'tab-active' : 'tab-inactive'}" data-tab="balance">💰 Bakiye Takibi</button>
      <button class="${tab === 'calendar' ? 'tab-active' : 'tab-inactive'}" data-tab="calendar">📅 Takvim</button>
    </div>

    <div id="leave-mgmt-content" class="fade-in"></div>`;

  renderLeaveTab(tab, data, personnel);
  el.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => {
      const d = getStorage(); d._tab = btn.dataset.tab; setStorage(d);
      renderLeaveManagementPage(el);
    };
  });
}

function renderLeaveTab(tab, data, personnel) {
  const container = document.getElementById('leave-mgmt-content');
  if (!container) return;

  if (tab === 'new') renderNewRequest(container, data, personnel);
  else if (tab === 'pending') renderPending(container, data, personnel);
  else if (tab === 'history') renderHistory(container, data, personnel);
  else if (tab === 'balance') renderBalance(container, data, personnel);
  else if (tab === 'calendar') renderCalendarView(container, data, personnel);
}

function renderNewRequest(container, data, personnel) {
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📝 İzin Talebi Oluştur</h3>
        <div class="space-y-4">
          <div>
            <label class="label">Personel</label>
            <select id="leave-emp" class="input-field w-full">
              ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname} — ${p.department}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="label">İzin Türü</label>
            <div class="grid grid-cols-2 gap-2">
              ${LEAVE_TYPES.map(lt => `
                <button class="leave-type-btn flex items-center gap-2 rounded-xl p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition text-left" data-type="${lt.id}">
                  <span class="text-xl">${lt.icon}</span>
                  <div>
                    <p class="text-sm font-medium text-white">${lt.label}</p>
                    <p class="text-[10px] text-slate-400">${lt.days > 0 ? lt.days + ' gün/hak' : 'Sınırsız'}</p>
                  </div>
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="leave-type" value="annual">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Başlangıç</label>
              <input id="leave-start" type="date" class="input-field w-full" value="${new Date().toISOString().slice(0,10)}">
            </div>
            <div>
              <label class="label">Bitiş</label>
              <input id="leave-end" type="date" class="input-field w-full" value="${new Date(Date.now() + 86400000).toISOString().slice(0,10)}">
            </div>
          </div>
          <div id="leave-day-count" class="text-sm text-cyan-300 text-center bg-cyan-500/10 rounded-lg p-2">📅 2 gün</div>
          <div>
            <label class="label">Açıklama</label>
            <textarea id="leave-reason" class="input-field w-full" rows="2" placeholder="İzin nedeni..."></textarea>
          </div>
          <button id="leave-submit" class="btn-primary w-full">📤 Talep Gönder</button>
        </div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📊 Departman Durumu</h3>
        <div id="leave-dept-status" class="space-y-3">
          ${renderDeptStatus(data, personnel)}
        </div>
      </div>
    </div>`;

  let selectedType = 'annual';
  container.querySelectorAll('.leave-type-btn').forEach(btn => {
    btn.onclick = () => {
      selectedType = btn.dataset.type;
      document.getElementById('leave-type').value = selectedType;
      container.querySelectorAll('.leave-type-btn').forEach(b => {
        b.classList.toggle('border-cyan-500/50', b.dataset.type === selectedType);
        b.classList.toggle('bg-cyan-500/10', b.dataset.type === selectedType);
      });
    };
  });
  container.querySelectorAll('.leave-type-btn')[0]?.click();

  const updateDays = () => {
    const days = calcDays(document.getElementById('leave-start').value, document.getElementById('leave-end').value);
    document.getElementById('leave-day-count').textContent = `📅 ${days} gün`;
  };
  document.getElementById('leave-start')?.addEventListener('change', updateDays);
  document.getElementById('leave-end')?.addEventListener('change', updateDays);

  document.getElementById('leave-submit')?.addEventListener('click', () => {
    const empId = parseInt(document.getElementById('leave-emp').value);
    const start = document.getElementById('leave-start').value;
    const end = document.getElementById('leave-end').value;
    const days = calcDays(start, end);
    if (!start || !end || days <= 0) { alert('Geçerli tarih aralığı girin'); return; }
    const d = getStorage();
    d.requests.push({
      id: Date.now(), employeeId: empId, type: selectedType,
      startDate: start, endDate: end, days,
      reason: document.getElementById('leave-reason').value,
      status: 'pending', createdAt: new Date().toISOString(),
      history: [{ action: 'created', date: new Date().toISOString() }],
    });
    setStorage(d);
    alert('İzin talebi oluşturuldu!');
    renderLeaveManagementPage(document.getElementById('content'));
  });
}

function renderDeptStatus(data, personnel) {
  const today = new Date().toISOString().slice(0, 10);
  const depts = [...new Set(personnel.map(p => p.department))];
  return depts.map(dept => {
    const deptEmps = personnel.filter(p => p.department === dept);
    const onLeave = data.requests.filter(r =>
      r.status === 'approved' && deptEmps.some(e => e.id === r.employeeId) &&
      r.startDate <= today && r.endDate >= today
    ).length;
    const ratio = deptEmps.length > 0 ? ((deptEmps.length - onLeave) / deptEmps.length * 100).toFixed(0) : 0;
    const color = ratio < 50 ? 'red' : ratio < 75 ? 'amber' : 'emerald';
    return `<div class="rounded-xl bg-white/5 p-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-white font-medium">${dept}</span>
        <span class="text-xs text-${color}-300">${deptEmps.length - onLeave}/${deptEmps.length} aktif</span>
      </div>
      <div class="h-2 rounded-full bg-white/10 overflow-hidden">
        <div class="h-full rounded-full bg-${color}-500 transition-all" style="width:${ratio}%"></div>
      </div>
    </div>`;
  }).join('');
}

function renderPending(container, data, personnel) {
  const pending = data.requests.filter(r => r.status === 'pending' || r.status === 'approved_manager');
  if (pending.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">⏳</div><div class="title">Onay bekleyen talep yok</div></div>`;
    return;
  }
  container.innerHTML = `
    <div class="space-y-3">
      ${pending.map(r => {
        const emp = personnel.find(p => p.id === r.employeeId);
        const lt = LEAVE_TYPES.find(l => l.id === r.type);
        return `<div class="card flex flex-col md:flex-row md:items-center gap-4">
          <div class="flex items-center gap-3 flex-1">
            <span class="text-2xl">${lt?.icon || '📋'}</span>
            <div>
              <p class="text-sm font-medium text-white">${emp ? emp.name + ' ' + emp.surname : 'Bilinmeyen'}</p>
              <p class="text-xs text-slate-400">${lt?.label} · ${r.startDate} → ${r.endDate} · ${r.days} gün</p>
              <p class="text-xs text-slate-500 mt-1">${r.reason || '-'}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn-primary text-xs px-4 py-2 leave-approve" data-id="${r.id}">✅ Onayla</button>
            <button class="btn-secondary text-xs px-4 py-2 leave-reject" data-id="${r.id}">❌ Reddet</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;

  container.querySelectorAll('.leave-approve').forEach(btn => {
    btn.onclick = () => {
      const d = getStorage();
      const req = d.requests.find(r => r.id === parseInt(btn.dataset.id));
      if (req) {
        req.status = 'approved';
        req.history.push({ action: 'approved', date: new Date().toISOString() });
        const bal = getBalance(req.employeeId);
        if (bal[req.type]) bal[req.type].used += req.days;
        d.balances[req.employeeId] = bal;
        setStorage(d);
        renderLeaveManagementPage(document.getElementById('content'));
      }
    };
  });
  container.querySelectorAll('.leave-reject').forEach(btn => {
    btn.onclick = () => {
      const d = getStorage();
      const req = d.requests.find(r => r.id === parseInt(btn.dataset.id));
      if (req) {
        req.status = 'rejected';
        req.history.push({ action: 'rejected', date: new Date().toISOString() });
        setStorage(d);
        renderLeaveManagementPage(document.getElementById('content'));
      }
    };
  });
}

function renderHistory(container, data, personnel) {
  const all = [...data.requests].reverse();
  if (all.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📋</div><div class="title">Henüz izin talebi yok</div></div>`;
    return;
  }
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead><tr>
          <th class="th">Personel</th>
          <th class="th">Tür</th>
          <th class="th">Tarih</th>
          <th class="th">Gün</th>
          <th class="th">Durum</th>
          <th class="th">İşlem</th>
        </tr></thead>
        <tbody>
          ${all.map(r => {
            const emp = personnel.find(p => p.id === r.employeeId);
            const lt = LEAVE_TYPES.find(l => l.id === r.type);
            const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
            return `<tr class="border-t border-white/5 hover:bg-white/5">
              <td class="td font-medium text-white">${emp ? emp.name + ' ' + emp.surname : '-'}</td>
              <td class="td">${lt?.icon} ${lt?.label}</td>
              <td class="td text-xs">${r.startDate} → ${r.endDate}</td>
              <td class="td text-center">${r.days}</td>
              <td class="td"><span class="badge bg-${st.color}-500/15 text-${st.color}-300">${st.icon} ${st.label}</span></td>
              <td class="td">
                ${r.status === 'pending' ? `<button class="text-xs text-red-400 hover:underline leave-cancel" data-id="${r.id}">İptal</button>` : '-'}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  container.querySelectorAll('.leave-cancel').forEach(btn => {
    btn.onclick = () => {
      const d = getStorage();
      const req = d.requests.find(r => r.id === parseInt(btn.dataset.id));
      if (req) { req.status = 'cancelled'; setStorage(d); renderLeaveManagementPage(document.getElementById('content')); }
    };
  });
}

function renderBalance(container, data, personnel) {
  container.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead><tr>
          <th class="th">Personel</th>
          ${LEAVE_TYPES.map(lt => `<th class="th text-center">${lt.icon}<br>${lt.label}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${personnel.map(emp => {
            const bal = getBalance(emp.id);
            return `<tr class="border-t border-white/5 hover:bg-white/5">
              <td class="td font-medium text-white">${emp.name} ${emp.surname}</td>
              ${LEAVE_TYPES.map(lt => {
                const b = bal[lt.id] || { total: lt.days, used: 0 };
                const remaining = Math.max(0, b.total - b.used);
                const color = remaining === 0 ? 'red' : remaining <= 2 ? 'amber' : 'emerald';
                return `<td class="td text-center">
                  <span class="text-${color}-300 font-bold">${remaining}</span>
                  <span class="text-slate-500 text-xs">/${b.total}</span>
                </td>`;
              }).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderCalendarView(container, data, personnel) {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay() || 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  const approved = data.requests.filter(r => r.status === 'approved');
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  let cells = '';
  for (let i = 1; i < firstDay; i++) cells += '<div class="att-day-empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const onLeave = approved.filter(r => r.startDate <= dateStr && r.endDate >= dateStr);
    const isToday = dateStr === now.toISOString().slice(0, 10);
    cells += `<div class="att-calendar-day ${onLeave.length > 0 ? 'att-day-overtime' : 'att-day-normal'} ${isToday ? 'att-day-today' : ''}" title="${onLeave.map(r => { const e = personnel.find(p => p.id === r.employeeId); return e ? e.name + ' ' + e.surname : ''; }).join(', ')}">
      <span class="day-num">${d}</span>
      ${onLeave.length > 0 ? `<span class="day-hours">${onLeave.length} izinli</span>` : ''}
    </div>`;
  }
  container.innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">📅 ${monthName} İzin Takvimi</h3>
      <div class="att-calendar">
        ${dayNames.map(d => `<div class="att-calendar-header">${d}</div>`).join('')}
        ${cells}
      </div>
      <div class="flex gap-4 mt-4 justify-center">
        <div class="att-legend-item"><div class="att-legend-dot" style="background:rgba(245,158,11,0.3)"></div>İzinli</div>
        <div class="att-legend-item"><div class="att-legend-dot" style="background:rgba(34,197,94,0.3)"></div>Normal</div>
      </div>
    </div>`;
}
