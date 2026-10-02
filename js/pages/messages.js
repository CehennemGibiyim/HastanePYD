// ===== DAHİLİ MESAJLAŞMA SAYFASI =====

import {
  getPersonnel, getCurrentUser, isDepartmentRestricted, getUserDepartment,
  getMessages, saveMessages,
} from '../state.js';
import { showToast } from '../notifications.js';

export function renderMessagesPage(el) {
  const user = getCurrentUser();
  let messages = getMessages();
  const myMessages = messages.filter(m =>
    m.to === user?.username || m.from === user?.username
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const unread = myMessages.filter(m => m.to === user?.username && !m.read).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">💬 Dahili Mesajlaşma</h1>
          <p class="text-slate-400 text-sm mt-1">Personel içi mesaj gönderme ve alma</p>
        </div>
        <button id="compose-btn" class="btn-primary text-sm">✉️ Yeni Mesaj</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 fade-in">
      <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5">
        <p class="text-sm text-cyan-300">📨 Toplam Mesaj</p>
        <p class="text-3xl font-bold text-white mt-1">${myMessages.length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 p-5">
        <p class="text-sm text-red-300">🔴 Okunmamış</p>
        <p class="text-3xl font-bold text-white mt-1">${unread}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 p-5">
        <p class="text-sm text-green-300">📤 Gönderilen</p>
        <p class="text-3xl font-bold text-white mt-1">${myMessages.filter(m => m.from === user?.username).length}</p>
      </div>
    </div>

    <div class="flex gap-2 mb-4 fade-in">
      <button data-msg-tab="inbox" class="msg-tab tab-active">📥 Gelen (${unread})</button>
      <button data-msg-tab="sent" class="msg-tab tab-inactive">📤 Giden</button>
    </div>

    <div id="msg-list" class="space-y-2 fade-in"></div>
    <div id="msg-compose" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"></div>`;

  let currentTab = 'inbox';
  renderMsgList('inbox');

  document.querySelectorAll('.msg-tab').forEach(btn => {
    btn.onclick = () => {
      currentTab = btn.dataset.msgTab;
      document.querySelectorAll('.msg-tab').forEach(b => {
        b.className = `msg-tab ${b.dataset.msgTab === currentTab ? 'tab-active' : 'tab-inactive'}`;
      });
      renderMsgList(currentTab);
    };
  });

  document.getElementById('compose-btn').onclick = () => openCompose();

  function renderMsgList(tab) {
    const container = document.getElementById('msg-list');
    const filtered = tab === 'inbox'
      ? myMessages.filter(m => m.to === user?.username)
      : myMessages.filter(m => m.from === user?.username);

    if (!filtered.length) {
      container.innerHTML = `<div class="text-center py-12 text-slate-500"><p class="text-4xl mb-2">${tab === 'inbox' ? '📥' : '📤'}</p><p>${tab === 'inbox' ? 'Gelen mesajınız yok' : 'Gönderilen mesajınız yok'}</p></div>`;
      return;
    }

    container.innerHTML = filtered.map(m => {
      const isUnread = !m.read && m.to === user?.username;
      const time = new Date(m.createdAt);
      const timeStr = time.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      return `<div class="card flex items-start gap-3 ${isUnread ? 'border-cyan-500/30 bg-cyan-500/5' : ''}" data-msg-id="${m.id}">
        <div class="w-10 h-10 rounded-full ${isUnread ? 'bg-cyan-500/20' : 'bg-white/10'} flex items-center justify-center text-lg shrink-0">${tab === 'inbox' ? '👤' : '📤'}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium ${isUnread ? 'text-white' : 'text-slate-300'}">${tab === 'inbox' ? m.fromName : m.toName}</span>
            ${isUnread ? '<span class="w-2 h-2 rounded-full bg-cyan-400"></span>' : ''}
          </div>
          <p class="text-sm ${isUnread ? 'text-slate-200' : 'text-slate-400'} mt-0.5 ${tab === 'inbox' && !m.read ? 'font-medium' : ''}">${m.subject || '(Konu yok)'}</p>
          <p class="text-xs text-slate-500 mt-1 line-clamp-1">${m.body}</p>
          <p class="text-[10px] text-slate-600 mt-1">${timeStr}</p>
        </div>
        <div class="flex flex-col gap-1 shrink-0">
          ${isUnread ? `<button data-read-msg="${m.id}" class="text-cyan-400 hover:text-cyan-300 text-[10px] px-1.5 py-0.5 rounded hover:bg-cyan-500/10">✓ Oku</button>` : ''}
          <button data-del-msg="${m.id}" class="text-red-400/60 hover:text-red-300 text-[10px] px-1.5 py-0.5 rounded hover:bg-red-500/10">🗑️</button>
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('[data-read-msg]').forEach(btn => {
      btn.onclick = () => {
        const allMsgs = getMessages();
        const msg = allMsgs.find(m => m.id === parseInt(btn.dataset.readMsg));
        if (msg) {
          msg.read = true;
          saveMessages(allMsgs);
          showMsgDetail(msg);
          renderMsgList(tab);
        }
      };
    });

    container.querySelectorAll('[data-msg-id]').forEach(card => {
      card.ondblclick = () => {
        const allMsgs = getMessages();
        const msg = allMsgs.find(m => m.id === parseInt(card.dataset.msgId));
        if (msg) {
          if (!msg.read && msg.to === user?.username) {
            msg.read = true;
            saveMessages(allMsgs);
          }
          showMsgDetail(msg);
          renderMsgList(tab);
        }
      };
    });

    container.querySelectorAll('[data-del-msg]').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Bu mesajı silmek istediğinize emin misiniz?')) {
          const remaining = getMessages().filter(m => m.id !== parseInt(btn.dataset.delMsg));
          saveMessages(remaining);
          showToast('Mesaj silindi', 'success');
          renderMsgList(tab);
        }
      };
    });
  }

  function showMsgDetail(msg) {
    const modal = document.getElementById('msg-compose');
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-white">📩 ${msg.subject || '(Konu yok)'}</h3>
          <button id="msg-detail-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">✕</button>
        </div>
        <div class="text-xs text-slate-400 mb-3">
          <p>Gönderen: <span class="text-white">${msg.fromName}</span></p>
          <p>Alıcı: <span class="text-white">${msg.toName}</span></p>
          <p>Tarih: <span class="text-white">${new Date(msg.createdAt).toLocaleString('tr-TR')}</span></p>
        </div>
        <div class="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-slate-200 whitespace-pre-wrap">${msg.body}</div>
        <button id="msg-reply" class="btn-primary w-full mt-4">💬 Yanıtla</button>
      </div>`;
    modal.classList.remove('hidden');
    modal.onclick = (e) => { if (e.target.id === 'msg-compose') modal.classList.add('hidden'); };
    document.getElementById('msg-detail-close').onclick = () => modal.classList.add('hidden');
    document.getElementById('msg-reply').onclick = () => {
      modal.classList.add('hidden');
      openCompose(msg.from, msg.fromName, 'Re: ' + (msg.subject || ''));
    };
  }

  function openCompose(toUsername, toName, subject) {
    const modal = document.getElementById('msg-compose');
    const personnel = getPersonnel({ status: 'active' });

    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">✉️ Yeni Mesaj</h3>
          <button id="compose-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">✕</button>
        </div>
        <div class="space-y-3">
          <div><label class="label">Alıcı</label>
            <select id="msg-to" class="input-field w-full">
              <option value="">Seçiniz</option>
              ${personnel.map(p => `<option value="${p.name} ${p.surname}" ${p.name + ' ' + p.surname === toName ? 'selected' : ''}>${p.name} ${p.surname} (${p.department})</option>`).join('')}
            </select>
          </div>
          <div><label class="label">Konu</label><input id="msg-subject" class="input-field w-full" value="${subject || ''}" placeholder="Mesaj konusu"></div>
          <div><label class="label">Mesaj</label><textarea id="msg-body" class="input-field w-full" rows="5" placeholder="Mesajınızı yazın..."></textarea></div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="msg-send" class="btn-primary flex-1">📤 Gönder</button>
          <button id="msg-discard" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;

    modal.classList.remove('hidden');
    modal.onclick = (e) => { if (e.target.id === 'msg-compose') modal.classList.add('hidden'); };
    document.getElementById('compose-close').onclick = () => modal.classList.add('hidden');
    document.getElementById('msg-discard').onclick = () => modal.classList.add('hidden');

    document.getElementById('msg-send').onclick = () => {
      const toName = document.getElementById('msg-to').value;
      const body = document.getElementById('msg-body').value.trim();
      if (!toName) { showToast('Alıcı seçimi gereklidir', 'error'); return; }
      if (!body) { showToast('Mesaj içeriği gereklidir', 'error'); return; }

      const allMsgs = getMessages();
      const toPerson = personnel.find(p => p.name + ' ' + p.surname === toName);
      allMsgs.push({
        id: Date.now(),
        from: user?.username,
        fromName: user?.name || user?.username,
        to: toPerson?.name?.toLowerCase() || toName.toLowerCase(),
        toName,
        subject: document.getElementById('msg-subject').value,
        body,
        read: false,
        createdAt: new Date().toISOString(),
      });
      saveMessages(allMsgs);
      modal.classList.add('hidden');
      showToast('Mesaj gönderildi', 'success');
      renderMessagesPage(el);
    };
  }
}
