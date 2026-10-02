// ===== PROTOKOL & KILAVUZ KUTUPHANESI =====
function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_protocols') || '{"protocols":[],"categories":[],"nextId":1}'); } catch { return { protocols: [], categories: [], nextId: 1 }; }
}
function setStorage(d) { localStorage.setItem('hospital_protocols', JSON.stringify(d)); }

const PROTOCOL_CATEGORIES = [
  { id: 'clinical', label: 'Klinik Protokoller', icon: '🩺', color: 'blue' },
  { id: 'nursing', label: 'Hemşirelik Protokolleri', icon: '👩‍⚕️', color: 'cyan' },
  { id: 'emergency', label: 'Acil Müdahale', icon: '🚨', color: 'red' },
  { id: 'infection', label: 'Enfeksiyon Kontrolü', icon: '🦠', color: 'amber' },
  { id: 'surgery', label: 'Cerrahi Protokoller', icon: '🔪', color: 'purple' },
  { id: 'pharmacy', label: 'Eczane Protokolleri', icon: '💊', color: 'emerald' },
  { id: 'admin', label: 'İdari Prosedürler', icon: '📋', color: 'slate' },
  { id: 'safety', label: 'İş Güvenliği', icon: '🛡️', color: 'orange' },
];

function seedProtocols() {
  const data = getStorage();
  if (data.protocols.length > 0) return;
  const protocols = [
    { category: 'clinical', title: 'Kan Alma Protokolü', version: '3.1', author: 'Dr. Ayşe Kaya', updatedAt: '2025-06-15', content: '1. Hasta kimlik doğrulama\n2. Venöz erişim sağlama\n3. Tüp sırası: Kan kültürü → Sitrat → EDTA → Serum\n4. Etiketleme ve taşıma kuralları\n5. Laboratuvara teslim', status: 'active', views: 245 },
    { category: 'clinical', title: 'IV Tedavi Protokolü', version: '2.4', author: 'Dr. Mehmet Ali', updatedAt: '2025-05-20', content: '1. Periferik IV kateter yerleştirme\n2. Infüzyon hızı hesaplama\n3. İnkompatibilite kontrolü\n4. 72 saatte bir kateter değişimi\n5. Enfeksiyon belirtileri izleme', status: 'active', views: 189 },
    { category: 'nursing', title: 'Hasta Değerlendirme Formu', version: '4.0', author: 'Başhemşire Fatma', updatedAt: '2025-07-01', content: '1. ABCDE değerlendirmesi\n2. Vital bulgu kaydı\n3. Ağrı skalası (NRS)\n4. Düşme riski değerlendirmesi\n5. Bası yarası riski (Braden Skalası)\n6. Beslenme taraması', status: 'active', views: 312 },
    { category: 'nursing', title: 'İlaç Verme Protokolü', version: '3.2', author: 'Başhemşire Fatma', updatedAt: '2025-06-28', content: '1. 5 Doğru kuralı (Hasta, İlaç, Doz, Yol, Zaman)\n2. Barkod okutma\n3. İlaç etkileşim kontrolü\n4. Alerji kontrolü\n5. Verme sonrası izleme', status: 'active', views: 428 },
    { category: 'emergency', title: 'KPR Protokolü (Güncel 2025)', version: '5.0', author: 'Dr. Acil Servis', updatedAt: '2025-01-15', content: '1. Responsivite kontrolü\n2. 112 Arama\n3. 30:2 kompresyon ventilasyon\n4. AED kullanımı\n5. Adrenalin 3-5 dk aralıkla\n6. Geri dönüşüm değerlendirmesi', status: 'active', views: 567 },
    { category: 'emergency', title: 'Anafilaksi Yönetimi', version: '2.1', author: 'Dr. Acil Servis', updatedAt: '2025-04-10', content: '1. Epinefrin 0.5 mg IM (uyluk)\n2. Oksijen desteği\n3. IV sıvı resüsitasyonu\n4. Antihistaminik + kortikosteroid\n5. 4-6 saat gözlem', status: 'active', views: 234 },
    { category: 'infection', title: 'El Hijyeni Protokolü', version: '6.0', author: 'Enfeksiyon Komitesi', updatedAt: '2025-03-01', content: 'WHO 5 Anı:\n1. Hasta temasından önce\n2. Aseptik prosedürden önce\n3. Vücut sıvı temasından sonra\n4. Hasta temasından sonra\n5. Hasta çevresi temasından sonra', status: 'active', views: 890 },
    { category: 'infection', title: 'İZOLASYON Protokolü', version: '3.5', author: 'Enfeksiyon Komitesi', updatedAt: '2025-05-15', content: '1. Temas izolasyonu (MRSA, VRE, C.diff)\n2. Damlacık izolasyonu (Grip, COVID)\n3. Hava izolasyonu (Tüberküloz)\n4. Kişisel koruyucu ekipman seçimi\n5. Oda dezenfeksiyonu', status: 'active', views: 456 },
    { category: 'surgery', title: 'Ameliyat Öncesi Checklist', version: '4.2', author: 'Cerrahi Komite', updatedAt: '2025-06-01', content: 'WHO Cerrahi Güvenlik Checklist:\n1. Giriş kapısı (Anestezi öncesi)\n2. Zaman çizelgesi (Cerrahi başlamadan)\n3. Çıkış kapısı (Ameliyathaneden ayrılmadan)\n4. Hasta kimlik doğrulama\n5. Ameliyat yeri işaretleme\n6. Antibiyotik profilaksisi', status: 'active', views: 678 },
    { category: 'pharmacy', title: 'Yüksek Riskli İlaçlar', version: '2.8', author: 'Eczacıbaşı', updatedAt: '2025-04-20', content: '1. Heparin, Warfarin (Antikoagülanlar)\n2. İnsulin\n3. Kemoterapi ajanları\n4. Opioid analjezikler\n5. Potasyum klorür konsantre\n6. Çift kontrol zorunlu', status: 'active', views: 345 },
    { category: 'admin', title: 'Hasta Hakları Prosedürü', version: '3.0', author: 'Başhekimlik', updatedAt: '2025-02-01', content: '1. Bilgilendirme ve onam\n2. Mahremiyet ve gizlilik\n3. Tedaviyi reddetme hakkı\n4. İkinci görüş alma\n5. Şikayet başvuru süreci\n6. Refakatçi hakkı', status: 'active', views: 198 },
    { category: 'safety', title: 'Yangın Tahliye Protokolü', version: '2.5', author: 'İSG Uzmanı', updatedAt: '2025-03-15', content: 'RACE:\n1. Rescue (Kurtar)\n2. Alarm (Uyarı)\n3. Contain (Kontrol et)\n4. Evacuate (Tahliye et)\n\nPASS Yangın Söndürücü:\n1. Pull (Çek)\n2. Aim (Hedefle)\n3. Squeeze (Sık)\n4. Sweep (Süpür)', status: 'active', views: 523 },
  ];
  data.protocols = protocols.map((p, i) => ({ ...p, id: i + 1 }));
  data.nextId = protocols.length + 1;
  setStorage(data);
}

export function renderProtocolLibraryPage(el) {
  seedProtocols();
  const data = getStorage();
  const search = data._search || '';
  const activeCat = data._cat || 'all';

  let filtered = data.protocols;
  if (activeCat !== 'all') filtered = filtered.filter(p => p.category === activeCat);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
  }

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📚 Protokol & Kılavuz Kütüphanesi</h1>
          <p class="text-slate-400 text-sm mt-1">Klinik protokoller, SOP'lar ve prosedürler</p>
        </div>
        <button id="proto-add" class="btn-primary">➕ Yeni Protokol</button>
      </div>
    </div>

    <!-- Arama -->
    <div class="mb-4 fade-in">
      <input id="proto-search" type="text" class="input-field w-full" placeholder="🔍 Protokol ara... (başlık, içerik, yazar)" value="${search}">
    </div>

    <!-- Kategori Filtre -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 fade-in">
      <button class="${activeCat === 'all' ? 'tab-active' : 'tab-inactive'}" data-cat="all">📚 Tümü (${data.protocols.length})</button>
      ${PROTOCOL_CATEGORIES.map(c => {
        const count = data.protocols.filter(p => p.category === c.id).length;
        return count > 0 ? `<button class="${activeCat === c.id ? 'tab-active' : 'tab-inactive'}" data-cat="${c.id}">${c.icon} ${c.label} (${count})</button>` : '';
      }).join('')}
    </div>

    <!-- Protokol Listesi -->
    <div id="proto-list" class="space-y-3 fade-in"></div>

    <!-- Yeni Protokol Modal -->
    <div id="proto-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 class="text-xl font-bold text-white mb-4">➕ Yeni Protokol Ekle</h3>
        <div class="space-y-3">
          <div>
            <label class="label">Kategori</label>
            <select id="proto-cat" class="input-field w-full">${PROTOCOL_CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')}</select>
          </div>
          <div><label class="label">Başlık</label><input id="proto-title" class="input-field w-full" placeholder="Protokol başlığı"></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Versiyon</label><input id="proto-version" class="input-field w-full" value="1.0"></div>
            <div><label class="label">Yazar</label><input id="proto-author" class="input-field w-full" placeholder="Yazar adı"></div>
          </div>
          <div><label class="label">İçerik</label><textarea id="proto-content" class="input-field w-full" rows="8" placeholder="Protokol içeriği..."></textarea></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="proto-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="proto-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>
    </div>`;

  renderProtocolList(filtered, data);
  el.querySelectorAll('[data-cat]').forEach(btn => {
    btn.onclick = () => {
      const d = getStorage(); d._cat = btn.dataset.cat; setStorage(d);
      el.querySelectorAll('[data-cat]').forEach(b => { b.className = b.dataset.cat === btn.dataset.cat ? 'tab-active' : 'tab-inactive'; });
      const f = btn.dataset.cat === 'all' ? d.protocols : d.protocols.filter(p => p.category === btn.dataset.cat);
      const q = document.getElementById('proto-search')?.value?.toLowerCase() || '';
      renderProtocolList(q ? f.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)) : f, d);
    };
  });

  document.getElementById('proto-search')?.addEventListener('input', (e) => {
    const d = getStorage();
    const q = e.target.value.toLowerCase();
    let f = d._cat === 'all' ? d.protocols : d.protocols.filter(p => p.category === d._cat);
    if (q) f = f.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    renderProtocolList(f, d);
  });

  document.getElementById('proto-add')?.addEventListener('click', () => document.getElementById('proto-modal').classList.remove('hidden'));
  document.getElementById('proto-cancel')?.addEventListener('click', () => document.getElementById('proto-modal').classList.add('hidden'));
  document.getElementById('proto-save')?.addEventListener('click', () => {
    const title = document.getElementById('proto-title').value.trim();
    if (!title) { alert('Başlık zorunludur'); return; }
    const d = getStorage();
    d.protocols.push({
      id: d.nextId++,
      category: document.getElementById('proto-cat').value,
      title,
      version: document.getElementById('proto-version').value || '1.0',
      author: document.getElementById('proto-author').value || 'Anonim',
      content: document.getElementById('proto-content').value,
      status: 'active',
      views: 0,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setStorage(d);
    document.getElementById('proto-modal').classList.add('hidden');
    renderProtocolLibraryPage(document.getElementById('content'));
  });
}

function renderProtocolList(protocols, data) {
  const container = document.getElementById('proto-list');
  if (!container) return;
  if (protocols.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📚</div><div class="title">Protokol bulunamadı</div><div class="desc">Arama kriterlerinizi değiştirin veya yeni protokol ekleyin</div></div>`;
    return;
  }
  container.innerHTML = protocols.map(p => {
    const cat = PROTOCOL_CATEGORIES.find(c => c.id === p.category);
    return `<div class="card cursor-pointer hover:bg-white/10 transition proto-detail" data-id="${p.id}">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-${cat?.color || 'slate'}-500/15 flex items-center justify-center text-2xl">${cat?.icon || '📋'}</div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="text-base font-semibold text-white">${p.title}</h3>
            <span class="badge text-[10px]">v${p.version}</span>
            <span class="badge bg-${cat?.color || 'slate'}-500/15 text-${cat?.color || 'slate'}-300 text-[10px]">${cat?.label || ''}</span>
          </div>
          <p class="text-xs text-slate-400">✍️ ${p.author} · 📅 ${p.updatedAt} · 👁️ ${p.views} görüntülenme</p>
        </div>
        <span class="text-slate-500">→</span>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.proto-detail').forEach(card => {
    card.onclick = () => {
      const proto = data.protocols.find(p => p.id === parseInt(card.dataset.id));
      if (!proto) return;
      proto.views = (proto.views || 0) + 1;
      setStorage(data);
      const cat = PROTOCOL_CATEGORIES.find(c => c.id === proto.category);
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
      modal.innerHTML = `
        <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl">${cat?.icon || '📋'}</span>
              <div>
                <h2 class="text-xl font-bold text-white">${proto.title}</h2>
                <p class="text-sm text-slate-400">${cat?.label} · v${proto.version} · ${proto.author}</p>
              </div>
            </div>
            <button class="text-slate-400 hover:text-white text-2xl" onclick="this.closest('.fixed').remove()">✕</button>
          </div>
          <div class="rounded-xl bg-white/5 border border-white/10 p-6 mb-4">
            <pre class="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">${proto.content}</pre>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500">Son güncelleme: ${proto.updatedAt} · ${proto.views} görüntülenme</span>
            <button class="btn-secondary text-xs" onclick="navigator.clipboard.writeText(${JSON.stringify(proto.content)});this.textContent='✅ Kopyalandı'">📋 Kopyala</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    };
  });
}
