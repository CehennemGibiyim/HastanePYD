// ===== FUZZY SEARCH — Enhanced Global Search =====
import { getPersonnel, getDepartments } from '../state.js';
import { getAnnouncements, getKnowledgeArticles, getGoals, getCandidates, getContracts } from '../state-extensions.js';

// Simple fuzzy match: checks if all characters of query appear in order in text
function fuzzyMatch(query, text) {
  query = query.toLowerCase();
  text = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text[ti] === query[qi]) qi++;
  }
  return qi === query.length;
}

// Score: exact > startsWith > contains > fuzzy
function scoreResult(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  if (fuzzyMatch(query, text)) return 40;
  return 0;
}

export function fuzzySearch(query) {
  if (!query || query.length < 2) return [];
  const results = [];

  // Search personnel
  getPersonnel({ status: 'active' }).forEach(p => {
    const name = `${p.name} ${p.surname}`;
    const score = Math.max(scoreResult(query, name), scoreResult(query, p.title || ''), scoreResult(query, p.department || ''), scoreResult(query, p.tc || ''));
    if (score > 0) results.push({ type: 'personnel', icon: '👤', label: name, sublabel: `${p.title} · ${p.department}`, href: `#personnel/${p.id}`, score });
  });

  // Search announcements
  getAnnouncements().forEach(a => {
    const score = Math.max(scoreResult(query, a.title || ''), scoreResult(query, a.content || ''));
    if (score > 0) results.push({ type: 'announcement', icon: '📝', label: a.title, sublabel: a.department, href: '#announcements', score });
  });

  // Search knowledge
  getKnowledgeArticles().forEach(a => {
    const score = Math.max(scoreResult(query, a.title || ''), scoreResult(query, a.content || ''));
    if (score > 0) results.push({ type: 'knowledge', icon: '📚', label: a.title, sublabel: a.category, href: '#knowledge', score });
  });

  // Search goals
  getGoals().forEach(g => {
    const score = scoreResult(query, g.title || '');
    if (score > 0) results.push({ type: 'goal', icon: '🎯', label: g.title, sublabel: g.department, href: '#goals', score });
  });

  // Search candidates
  getCandidates().forEach(c => {
    const score = scoreResult(query, c.name || '');
    if (score > 0) results.push({ type: 'candidate', icon: '📋', label: c.name, sublabel: c.targetDepartment, href: '#recruitment', score });
  });

  // Search pages/modules
  const pages = [
    { id: 'dashboard', icon: '📊', label: 'Gösterge Paneli' },
    { id: 'personnel', icon: '👥', label: 'Personel Yönetimi' },
    { id: 'schedule', icon: '📅', label: 'Nöbet Listesi' },
    { id: 'attendance', icon: '⏰', label: 'Puantaj Sistemi' },
    { id: 'salary', icon: '💰', label: 'Maaş Hesaplama' },
    { id: 'performance', icon: '⭐', label: 'Performans' },
    { id: 'tasks', icon: '📋', label: 'Görev Yönetimi' },
    { id: 'messages', icon: '💬', label: 'Mesajlaşma' },
    { id: 'reports', icon: '📊', label: 'Raporlama' },
    { id: 'calendar', icon: '🗓️', label: 'Takvim' },
    { id: 'contacts', icon: '📞', label: 'Telefon Rehberi' },
    { id: 'documents', icon: '📄', label: 'Doküman Yönetimi' },
    { id: 'ai-assistant', icon: '🤖', label: 'AI HR Asistanı' },
    { id: 'gamification', icon: '🏆', label: 'Gamification' },
    { id: 'leaderboard', icon: '🏆', label: 'Sıralama' },
    { id: 'form-builder', icon: '📋', label: 'Form Oluşturucu' },
    { id: 'accessibility', icon: '♿', label: 'Erişilebilirlik' },
    { id: 'barcode', icon: '📱', label: 'Barkod/QR' },
    { id: 'sms', icon: '📱', label: 'SMS Entegrasyonu' },
    { id: 'offline', icon: '📴', label: 'Offline Mod' },
    { id: 'floor-map', icon: '🗺️', label: 'Kat Planı' },
    { id: 'digital-signature', icon: '✍️', label: 'Dijital İmza' },
    { id: 'ocr', icon: '📷', label: 'OCR Belge Tarama' },
    { id: 'video-conference', icon: '🎥', label: 'Video Konferans' },
    { id: 'settings', icon: '⚙️', label: 'Ayarlar' },
    { id: 'profile', icon: '👤', label: 'Profilim' },
    { id: 'audit', icon: '📜', label: 'Aktivite Logu' },
    { id: 'emergency', icon: '🚨', label: 'Acil Durum' },
    { id: 'budget', icon: '💰', label: 'Bütçe Takibi' },
    { id: 'patients', icon: '👥', label: 'Hasta Yönetimi' },
  ];

  pages.forEach(p => {
    const score = scoreResult(query, p.label);
    if (score > 0) results.push({ type: 'page', icon: p.icon, label: p.label, sublabel: 'Sayfa', href: `#${p.id}`, score });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}

// Recent searches management
export function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem('hospital_recentSearches')) || []; } catch { return []; }
}

export function addRecentSearch(query) {
  let recent = getRecentSearches();
  recent = recent.filter(r => r !== query);
  recent.unshift(query);
  if (recent.length > 10) recent = recent.slice(0, 10);
  localStorage.setItem('hospital_recentSearches', JSON.stringify(recent));
}

export function clearRecentSearches() {
  localStorage.removeItem('hospital_recentSearches');
}

// Popular search suggestions
export function getPopularSearches() {
  return ['Doktor', 'Hemşire', 'Nöbet', 'Maaş', 'İzin', 'Performans', 'Eğitim', 'Acil'];
}
