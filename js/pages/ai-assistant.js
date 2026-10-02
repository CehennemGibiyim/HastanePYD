// ===== AI HR ASISTANI — ÜCRETSİZ YEREL ANALİZ MOTORU =====
// Hiçbir API'ye bağlanmaz, kredi harcamaz. Hastane verilerini yerel olarak analiz eder.
import { getPersonnel, getDepartmentStats, getTodaySchedules, getMonthlyReport, getCurrentUser } from '../state.js';
import { getActiveReminders, getWorkforcePlan, getPatientStaffRatio, getMoodStats } from '../state-extensions.js';

let isOpen = false;

/* ─── Localize helper ─── */
const t = (key, fb) => {
  try { return window.miniappI18n?.t(key) ?? fb ?? key; } catch { return fb ?? key; }
};

/* ─── Data builder ─── */
function getData() {
  const user = getCurrentUser();
  const depts = getDepartmentStats();
  const today = getTodaySchedules();
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const report = getMonthlyReport(monthStr);
  const reminders = getActiveReminders();
  const workforce = getWorkforcePlan();
  const patientRatio = getPatientStaffRatio();
  const personnel = getPersonnel({ status: 'active' });
  let moodStats = null;
  try { moodStats = getMoodStats(); } catch { /* ok */ }

  return {
    user, personnel, depts, today, report, reminders, workforce, patientRatio, moodStats, now, monthStr,
    total: personnel.length,
    doctors: personnel.filter(p => p.type === 'Doktor').length,
    nurses: personnel.filter(p => p.type === 'Hemşire').length,
    deptEntries: Object.entries(depts).filter(([, v]) => v > 0),
    dutyDoctors: today.filter(s => s.type === 'doctor').length,
    dutyNurses: today.filter(s => s.type === 'nurse').length,
    dutyCleaning: today.filter(s => s.type === 'cleaning').length,
    dutySecurity: today.filter(s => s.type === 'security').length,
    totalOvertime: Math.round(report.reduce((s, r) => s + r.overtimeHours, 0) * 10) / 10,
    totalWorkHours: Math.round(report.reduce((s, r) => s + r.totalHours, 0)),
    criticalDepts: workforce.filter(d => d.status === 'critical'),
    normalDepts: workforce.filter(d => d.status === 'normal'),
    highUtilDepts: workforce.filter(d => d.utilization >= 80),
  };
}

/* ─── Progress bar helper ─── */
function pctBar(val, max, color = '#22d3ee') {
  const pct = Math.min(100, Math.round((val / (max || 1)) * 100));
  return `<div style="background:rgba(255,255,255,0.06);border-radius:6px;height:8px;width:100%;overflow:hidden"><div style="background:${color};height:100%;width:${pct}%;border-radius:6px;transition:width .4s"></div></div>`;
}

function statusDot(st) {
  const colors = { critical: '#ef4444', warning: '#f59e0b', normal: '#22c55e', good: '#22d3ee' };
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[st] || '#94a3b8'}"></span>`;
}

/* ─── Keyword-based response engine ─── */
function analyzeQuestion(text) {
  const q = text.toLowerCase().replace(/[?!.,;:]+/g, ' ').replace(/\s+/g, ' ').trim();
  const d = getData();

  // === 1. NÖBET / BUGÜN ===
  if (/nöbet|bugün.*nöbet|nöbet.*bugün|duty|vardiya/i.test(q)) {
    const total = d.today.length;
    return {
      title: '📋 Bugünkü Nöbet Özeti',
      html: `
        <p style="margin-bottom:12px">Bugün <strong>${total}</strong> kişi nöbet görevinde:</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#4ade80">${d.dutyDoctors}</div><div style="font-size:11px;color:#94a3b8">🩺 Doktor</div>
          </div>
          <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#60a5fa">${d.dutyNurses}</div><div style="font-size:11px;color:#94a3b8">💉 Hemşire</div>
          </div>
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#fbbf24">${d.dutyCleaning}</div><div style="font-size:11px;color:#94a3b8">🧹 Temizlik</div>
          </div>
          <div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#c084fc">${d.dutySecurity}</div><div style="font-size:11px;color:#94a3b8">🛡️ Güvenlik</div>
          </div>
        </div>
        ${d.criticalDepts.length ? `<p style="color:#f87171;font-size:12px">⚠️ Kritik departman: ${d.criticalDepts.map(c => c.department + ' (%' + c.utilization + ')').join(', ')}</p>` : '<p style="color:#4ade80;font-size:12px">✅ Tüm departmanlar normal seviyede.</p>'}
      `
    };
  }

  // === 2. DEPARTMAN ===
  if (/departman|bölüm|birim/i.test(q)) {
    const rows = d.deptEntries.sort((a, b) => b[1] - a[1]).slice(0, 12);
    const max = rows[0]?.[1] || 1;
    return {
      title: '🏢 Departman Dağılımı',
      html: `
        <p style="margin-bottom:10px">Toplam <strong>${d.total}</strong> aktif personel, <strong>${d.deptEntries.length}</strong> departmanda görevli:</p>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${rows.map(([dept, cnt]) => `
            <div style="display:flex;align-items:center;gap:8px;font-size:12px">
              <span style="min-width:100px;color:#cbd5e1">${dept}</span>
              <div style="flex:1">${pctBar(cnt, max)}</div>
              <span style="min-width:30px;text-align:right;font-weight:600;color:#67e8f9">${cnt}</span>
            </div>
          `).join('')}
        </div>
      `
    };
  }

  // === 3. FAZLA MESAİ ===
  if (/mesai|fazla.*mesai|overtime|mesai.*limit|aşım/i.test(q)) {
    const overLimit = d.report.filter(r => r.overtimeHours > 30);
    return {
      title: '⚠️ Fazla Mesai Analizi',
      html: `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#fbbf24">${d.totalOvertime}s</div><div style="font-size:10px;color:#94a3b8">Bu Ay Toplam</div>
          </div>
          <div style="background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#67e8f9">${d.totalWorkHours}s</div><div style="font-size:10px;color:#94a3b8">Toplam Çalışma</div>
          </div>
          <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#f87171">${overLimit.length}</div><div style="font-size:10px;color:#94a3b8">Limit Aşan</div>
          </div>
        </div>
        ${overLimit.length > 0 ? `
          <p style="color:#f87171;font-size:12px;margin-bottom:6px">⚠️ 30 saatten fazla mesai yapan personel:</p>
          <div style="font-size:12px;color:#cbd5e1">${overLimit.map(r => `• ${r.name} — <strong>${r.overtimeHours}s</strong>`).join('<br>')}</div>
        ` : '<p style="color:#4ade80;font-size:12px">✅ Hiç kimse limit aşımında değil. Sistem sağlıklı.</p>'}
        <p style="font-size:11px;color:#94a3b8;margin-top:8px">💡 Öneri: 30 saatten fazla mesai yapan personele ek dinlenme günü tanımayı düşünün.</p>
      `
    };
  }

  // === 4. HASTA / ORAN ===
  if (/hasta|patient|oran|hasta.*personel/i.test(q)) {
    if (!d.patientRatio.length) return { title: '🏥 Hasta/Personel Oranı', html: '<p style="color:#94a3b8">Hasta verisi bulunamadı.</p>' };
    return {
      title: '🏥 Hasta/Personel Oranları',
      html: `
        <p style="margin-bottom:10px">Departman bazlı hasta/personel oranları:</p>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${d.patientRatio.map(p => {
            const color = p.status === 'critical' ? '#ef4444' : p.status === 'warning' ? '#f59e0b' : '#22c55e';
            return `
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <span style="font-size:13px;font-weight:600;color:#e2e8f0">${p.department}</span>
                  <span style="font-size:13px;font-weight:700;color:${color}">${p.ratio} hasta/personel</span>
                </div>
                ${pctBar(p.ratio, 10, color)}
                <div style="font-size:10px;color:#94a3b8;margin-top:4px">${statusDot(p.status)} ${p.status === 'critical' ? 'Kritik — Acil personel takviyesi gerekli' : p.status === 'warning' ? 'Dikkat — Kapasite dolmak üzere' : 'Normal seviyede'}</div>
              </div>
            `;
          }).join('')}
        </div>
      `
    };
  }

  // === 5. İŞ GÜCÜ / WORKFORCE ===
  if (/iş\s*gü[cç]|workforce|kapasite|yetersiz/i.test(q)) {
    return {
      title: '👥 İş Gücü Planlama Durumu',
      html: `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#4ade80">${d.normalDepts.length}</div><div style="font-size:10px;color:#94a3b8">Normal</div>
          </div>
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#fbbf24">${d.highUtilDepts.length}</div><div style="font-size:10px;color:#94a3b8">Yoğun</div>
          </div>
          <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#f87171">${d.criticalDepts.length}</div><div style="font-size:10px;color:#94a3b8">Kritik</div>
          </div>
        </div>
        ${d.workforce.length ? `
          <div style="font-size:12px;color:#cbd5e1">
            ${d.workforce.map(w => {
              const c = w.status === 'critical' ? '#f87171' : w.utilization >= 80 ? '#fbbf24' : '#4ade80';
              return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="min-width:90px">${w.department}</span>${pctBar(w.utilization, 100, c)}<span style="min-width:35px;text-align:right;font-weight:600;color:${c}">%${w.utilization}</span></div>`;
            }).join('')}
          </div>
        ` : ''}
        ${d.criticalDepts.length ? `<p style="color:#f87171;font-size:11px;margin-top:8px">🚨 ${d.criticalDepts.map(c => c.department).join(', ')} departmanında personel açığı kritik seviyede. Acil işe alım veya transfer önerilir.</p>` : ''}
      `
    };
  }

  // === 6. RUH HALİ / MOOD ===
  if (/ruh\s*hali|mood|memnuniyet|moral|motivasyon/i.test(q)) {
    if (!d.moodStats) return { title: '😊 Ruh Hali', html: '<p style="color:#94a3b8">Ruh hali verisi bulunamadı.</p>' };
    const m = d.moodStats;
    return {
      title: '😊 Ruh Hali & Memnuniyet Analizi',
      html: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:2rem">${m.avgMood >= 4 ? '😊' : m.avgMood >= 3 ? '😐' : '😟'}</div>
            <div style="font-size:1.25rem;font-weight:700;color:#67e8f9">${(m.avgMood || 0).toFixed(1)}/5</div>
            <div style="font-size:10px;color:#94a3b8">Ortalama Ruh Hali</div>
          </div>
          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#4ade80">${m.participation || 0}%</div>
            <div style="font-size:10px;color:#94a3b8">Katılım Oranı</div>
            ${pctBar(m.participation || 0, 100, '#22c55e')}
          </div>
        </div>
        <div style="font-size:12px;color:#cbd5e1">
          <div style="margin-bottom:4px">😊 Pozitif: <strong style="color:#4ade80">${m.positive || 0}%</strong></div>
          <div>😟 Negatif: <strong style="color:#f87171">${m.negative || 0}%</strong></div>
        </div>
        ${(m.negative || 0) > 30 ? '<p style="color:#f87171;font-size:11px;margin-top:8px">⚠️ Negatif oran yüksek. Departman bazlı anket ve birebir görüşmeler önerilir.</p>' : ''}
      `
    };
  }

  // === 7. HATIRLATMA / REMINDER ===
  if (/hatırlatm|reminder|deadline|süre|son\s*tarih/i.test(q)) {
    const overdue = d.reminders.filter(r => new Date(r.dueDate) < d.now);
    const upcoming = d.reminders.filter(r => new Date(r.dueDate) >= d.now);
    return {
      title: '⏰ Hatırlatmalar & Deadlines',
      html: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#f87171">${overdue.length}</div><div style="font-size:10px;color:#94a3b8">Gecikmiş</div>
          </div>
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#fbbf24">${upcoming.length}</div><div style="font-size:10px;color:#94a3b8">Yaklaşan</div>
          </div>
        </div>
        ${d.reminders.length ? `<div style="font-size:12px;color:#cbd5e1">${d.reminders.slice(0, 8).map(r => {
          const isLate = new Date(r.dueDate) < d.now;
          return `<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05)">${isLate ? '🔴' : '🟡'} ${r.message} <span style="color:#64748b;font-size:10px">(${r.dueDate})</span></div>`;
        }).join('')}</div>` : '<p style="color:#4ade80;font-size:12px">✅ Aktif hatırlatma yok.</p>'}
      `
    };
  }

  // === 8. DOĞUM GÜNÜ ===
  if (/doğum\s*günü|birthday|yıldönüm|anniversary/i.test(q)) {
    const today = d.now;
    const todayMD = `${today.getMonth() + 1}-${String(today.getDate()).padStart(2, '0')}`;
    const bdToday = d.personnel.filter(p => { if (!p.birthDate) return false; const d2 = new Date(p.birthDate); return `${d2.getMonth() + 1}-${String(d2.getDate()).padStart(2, '0')}` === todayMD; });
    const upcoming = d.personnel.filter(p => {
      if (!p.birthDate) return false;
      const d2 = new Date(p.birthDate);
      const thisYear = `${today.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
      const diff = (new Date(thisYear) - today) / 86400000;
      return diff > 0 && diff <= 30;
    }).slice(0, 10);
    return {
      title: '🎂 Doğum Günleri',
      html: `
        ${bdToday.length ? `<div style="background:linear-gradient(135deg,rgba(168,85,247,0.15),rgba(59,130,246,0.15));border:1px solid rgba(168,85,247,0.3);border-radius:10px;padding:14px;margin-bottom:12px;text-align:center">
          <div style="font-size:2rem;margin-bottom:4px">🎉🎂🎈</div>
          <div style="font-size:14px;font-weight:700;color:#e2e8f0">Bugün doğum günü olanlar:</div>
          <div style="font-size:13px;color:#c084fc;margin-top:4px">${bdToday.map(p => p.name).join(', ')}</div>
        </div>` : ''}
        ${upcoming.length ? `<p style="font-size:12px;color:#94a3b8;margin-bottom:6px">📅 Önümüzdeki 30 gün:</p><div style="font-size:12px;color:#cbd5e1">${upcoming.map(p => { const d2 = new Date(p.birthDate); return `<div style="padding:3px 0">🎂 ${p.name} — ${d2.getDate()}/${d2.getMonth() + 1} (${p.department})</div>`; }).join('')}</div>` : '<p style="color:#94a3b8;font-size:12px">Yakın tarihte doğum günü yok.</p>'}
      `
    };
  }

  // === 9. BÜTÇE / COST ===
  if (/bütçe|maliyet|cost|maaş.*toplam|salary.*total/i.test(q)) {
    const avgSalary = d.personnel.length ? Math.round(d.personnel.reduce((s, p) => s + (p.salary || 0), 0) / d.personnel.length) : 0;
    const totalSalary = d.personnel.reduce((s, p) => s + (p.salary || 0), 0);
    const overtimeCost = Math.round(d.totalOvertime * 150);
    return {
      title: '💰 Bütçe & Maliyet Analizi',
      html: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.1rem;font-weight:700;color:#67e8f9">₺${totalSalary.toLocaleString('tr-TR')}</div><div style="font-size:10px;color:#94a3b8">Aylık Maaş Toplamı</div>
          </div>
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.1rem;font-weight:700;color:#fbbf24">₺${overtimeCost.toLocaleString('tr-TR')}</div><div style="font-size:10px;color:#94a3b8">Mesai Maliyeti (Tahmini)</div>
          </div>
        </div>
        <div style="font-size:12px;color:#cbd5e1">
          <div>📊 Ortalama maaş: <strong>₺${avgSalary.toLocaleString('tr-TR')}</strong></div>
          <div>👤 Toplam personel: <strong>${d.total}</strong></div>
          <div>⏱️ Bu ay mesai: <strong>${d.totalOvertime} saat</strong></div>
        </div>
      `
    };
  }

  // === 10. EKİPMAN / ZİMMET ===
  if (/ekipman|zimmet|equipment|malzeme/i.test(q)) {
    return {
      title: '🛠️ Ekipman & Zimmet Durumu',
      html: `<p style="color:#cbd5e1;font-size:12px">Ekipman modülünden detaylı takip yapılabilir. Hızlı özet:</p>
        <div style="font-size:12px;color:#cbd5e1;margin-top:8px">
          <div>💻 Toplam zimmetli ekipman verileri <strong>Zimmet & Ekipman</strong> modülünde.</div>
          <div style="margin-top:6px">💡 Öneri: Düzenli envanter kontrolü ve bakım takvimi oluşturun.</div>
        </div>`
    };
  }

  // === 11. İŞE ALIM / RECRUITMENT ===
  if (/işe\s*alım|recruitment|aday|başvuru|ilan|mülakat/i.test(q)) {
    return {
      title: '📋 İşe Alım Pipeline',
      html: `<p style="font-size:12px;color:#cbd5e1;margin-bottom:8px">İşe alım süreci modülünden detaylı takip yapılabilir.</p>
        <div style="font-size:12px;color:#cbd5e1">
          <div>📊 Aktif departman ihtiyacı: <strong>${d.criticalDepts.length}</strong> kritik departman</div>
          <div>🏢 En çok ihtiyaç: <strong>${d.criticalDepts[0]?.department || 'Belirlenmedi'}</strong></div>
          <div style="margin-top:8px;padding:8px;background:rgba(245,158,11,0.08);border-radius:6px;border:1px solid rgba(245,158,11,0.2)">💡 Kritik departmanlara öncelik vererek işe alım sürecini hızlandırın.</div>
        </div>`
    };
  }

  // === 12. PERFORMANS ===
  if (/performans|performance|değerlendirme|kpi/i.test(q)) {
    return {
      title: '📊 Performans Özeti',
      html: `<p style="font-size:12px;color:#cbd5e1;margin-bottom:8px">Performans değerlendirme modülünden detaylı analiz yapılabilir.</p>
        <div style="font-size:12px;color:#cbd5e1">
          <div>👥 Toplam personel: <strong>${d.total}</strong></div>
          <div>🏢 Departman sayısı: <strong>${d.deptEntries.length}</strong></div>
          <div style="margin-top:8px;padding:8px;background:rgba(34,211,238,0.08);border-radius:6px;border:1px solid rgba(34,211,238,0.2)">💡 360° değerlendirme ve hedef/KPI modüllerini kullanarak kapsamlı performans analizi yapın.</div>
        </div>`
    };
  }

  // === 13. İZİN / LEAVE ===
  if (/izin|leave|raporlu|yıllık\s*izin/i.test(q)) {
    const onLeave = d.personnel.filter(p => p.leaveStatus === 'on_leave' || p.status === 'leave').length;
    return {
      title: '🏖️ İzin Durumu',
      html: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#60a5fa">${onLeave}</div><div style="font-size:10px;color:#94a3b8">İzinli Personel</div>
          </div>
          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#4ade80">${d.total - onLeave}</div><div style="font-size:10px;color:#94a3b8">Aktif Çalışan</div>
          </div>
        </div>
        <p style="font-size:12px;color:#cbd5e1">İzin takvimi ve onay süreçleri için <strong>İzin Takvimi</strong> modülünü kullanın.</p>
      `
    };
  }

  // === 14. PUANTAJ / DEVAM ===
  if (/puantaj|devam|mesai\s*saat|timeclock|giriş.*çıkış/i.test(q)) {
    return {
      title: '⏰ Puantaj & Devam Durumu',
      html: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#67e8f9">${d.totalWorkHours}s</div><div style="font-size:10px;color:#94a3b8">Bu Ay Toplam Çalışma</div>
          </div>
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.25rem;font-weight:700;color:#fbbf24">${d.totalOvertime}s</div><div style="font-size:10px;color:#94a3b8">Fazla Mesai</div>
          </div>
        </div>
        <p style="font-size:12px;color:#cbd5e1">Puantaj sistemi ve mesai saat takibi modüllerinden detaylı rapor alınabilir.</p>
      `
    };
  }

  // === 15. YETENEK / SKILLS ===
  if (/yetenek|skill|sertifika|eğitim|eğitim\s*takip/i.test(q)) {
    return {
      title: '🎓 Yetenek & Eğitim Durumu',
      html: `<p style="font-size:12px;color:#cbd5e1;margin-bottom:8px">Personel yetenek matrisi ve eğitim takibi modüllerinden detaylı analiz yapılabilir.</p>
        <div style="font-size:12px;color:#cbd5e1">
          <div>👥 Toplam personel: <strong>${d.total}</strong></div>
          <div>🏢 Departman: <strong>${d.deptEntries.length}</strong></div>
          <div style="margin-top:8px;padding:8px;background:rgba(34,211,238,0.08);border-radius:6px;border:1px solid rgba(34,211,238,0.2)">💡 Yetenek matrisi ve eğitim takvimi modüllerini kullanarak personel gelişim planı oluşturun.</div>
        </div>`
    };
  }

  // === 16. TURNOVER / AYRILMA ===
  if (/turnover|ayrılma|istifa|devir\s*hız/i.test(q)) {
    return {
      title: '🔄 Turnover & Ayrılma Riski',
      html: `<p style="font-size:12px;color:#cbd5e1;margin-bottom:8px">Turnover analizi modülünden detaylı rapor alınabilir.</p>
        <div style="font-size:12px;color:#cbd5e1">
          <div>👥 Toplam aktif personel: <strong>${d.total}</strong></div>
          <div>🏢 Kritik departman: <strong>${d.criticalDepts.length}</strong></div>
          <div style="margin-top:8px;padding:8px;background:rgba(239,68,68,0.08);border-radius:6px;border:1px solid rgba(239,68,68,0.2)">💡 Kritik departmanlardaki personel memnuniyetini artırmak için ruh hali anketleri ve birebir görüşmeler yapın.</div>
        </div>`
    };
  }

  // === 17. KIDEM / SENIORITY ===
  if (/kıdem|seniority|tazminat|emeklilik/i.test(q)) {
    return {
      title: '🏅 Kıdem & Emeklilik',
      html: `<p style="font-size:12px;color:#cbd5e1;margin-bottom:8px">Kıdem tazminatı ve emeklilik sayacı modüllerinden detaylı bilgi alınabilir.</p>
        <div style="font-size:12px;color:#cbd5e1">
          <div>👥 Toplam personel: <strong>${d.total}</strong></div>
          <div style="margin-top:8px;padding:8px;background:rgba(168,85,247,0.08);border-radius:6px;border:1px solid rgba(168,85,247,0.2)">💡 Emeklilik yaklaşıyan personel için bilgi transferi planı oluşturun.</div>
        </div>`
    };
  }

  // === 18. GENEL DURUM / ÖZET ===
  if (/genel|durum|özet|summary|overview|durum\s*nedir|nasıl\s*gidiyor/i.test(q)) {
    return {
      title: '📊 Genel Durum Özeti',
      html: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#67e8f9">${d.total}</div><div style="font-size:10px;color:#94a3b8">Aktif Personel</div>
          </div>
          <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#60a5fa">${d.deptEntries.length}</div><div style="font-size:10px;color:#94a3b8">Departman</div>
          </div>
          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#4ade80">${d.today.length}</div><div style="font-size:10px;color:#94a3b8">Nöbetçi</div>
          </div>
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:1.5rem;font-weight:700;color:#fbbf24">${d.reminders.length}</div><div style="font-size:10px;color:#94a3b8">Hatırlatma</div>
          </div>
        </div>
        <div style="font-size:12px;color:#cbd5e1">
          <div>🩺 Doktor: <strong>${d.doctors}</strong> · 💉 Hemşire: <strong>${d.nurses}</strong></div>
          <div>📋 Bu ay mesai: <strong>${d.totalOvertime}s</strong> · ⏱️ Toplam çalışma: <strong>${d.totalWorkHours}s</strong></div>
          ${d.criticalDepts.length ? `<div style="color:#f87171;margin-top:4px">🚨 Kritik departman: ${d.criticalDepts.map(c => c.department).join(', ')}</div>` : '<div style="color:#4ade80;margin-top:4px">✅ Kritik departman yok</div>'}
        </div>
      `
    };
  }

  // === 19. UYARI / ALERT ===
  if (/uyarı|alert|kritik|sorun|problem|tehlike/i.test(q)) {
    const alerts = [];
    if (d.criticalDepts.length) alerts.push({ icon: '🚨', text: `${d.criticalDepts.length} departman kritik seviyede`, color: '#ef4444' });
    if (d.totalOvertime > 100) alerts.push({ icon: '⚠️', text: `Fazla mesai ${d.totalOvertime}s — limit aşımı riski`, color: '#f59e0b' });
    const overdue = d.reminders.filter(r => new Date(r.dueDate) < d.now);
    if (overdue.length) alerts.push({ icon: '⏰', text: `${overdue.length} gecikmiş hatırlatma`, color: '#f59e0b' });
    if (!alerts.length) alerts.push({ icon: '✅', text: 'Sistem durumu normal — kritik uyarı yok', color: '#22c55e' });
    return {
      title: '🚨 Sistem Uyarıları',
      html: `<div style="display:flex;flex-direction:column;gap:8px">${alerts.map(a => `
        <div style="background:rgba(${a.color === '#ef4444' ? '239,68,68' : a.color === '#f59e0b' ? '245,158,11' : '34,197,94'},0.08);border:1px solid rgba(${a.color === '#ef4444' ? '239,68,68' : a.color === '#f59e0b' ? '245,158,11' : '34,197,94'},0.2);border-radius:8px;padding:10px;font-size:12px;color:#e2e8f0">
          ${a.icon} ${a.text}
        </div>`).join('')}</div>`
    };
  }

  // === 20. ÖNERİ / RECOMMENDATION ===
  if (/öneri|recommend|tavsiye|ne\s*yap|nasıl\s*geliştir/i.test(q)) {
    const recs = [];
    if (d.criticalDepts.length) recs.push({ icon: '👥', title: 'Personel Takviyesi', text: `${d.criticalDepts.map(c => c.department).join(', ')} departmanına acil personel alımı veya transfer önerilir.` });
    if (d.totalOvertime > 50) recs.push({ icon: '⏱️', title: 'Mesai Yönetimi', text: 'Fazla mesai oranları yüksek. Vardiya planlaması gözden geçirilmeli.' });
    if (d.reminders.length > 5) recs.push({ icon: '📋', title: 'Hatırlatma Temizliği', text: `${d.reminders.length} aktif hatırlatma var. Öncelik sıralaması yapılmalı.` });
    recs.push({ icon: '📊', title: 'Periyodik Raporlama', text: 'Haftalık departman bazlı performans raporları oluşturun.' });
    recs.push({ icon: '🎓', title: 'Eğitim Planı', text: 'Personel yetenek matrisini güncelleyip eksik eğitimleri planlayın.' });
    recs.push({ icon: '😊', title: 'Memnuniyet Anketi', text: 'Aylık ruh hali anketi ile personel memnuniyetini takip edin.' });
    return {
      title: '💡 Öneriler & Aksiyonlar',
      html: `<div style="display:flex;flex-direction:column;gap:8px">${recs.map((r, i) => `
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px">
          <div style="font-size:12px;font-weight:600;color:#67e8f9;margin-bottom:2px">${r.icon} ${i + 1}. ${r.title}</div>
          <div style="font-size:11px;color:#94a3b8">${r.text}</div>
        </div>`).join('')}</div>`
    };
  }

  // === 21. SMS ===
  if (/sms|mesaj\s*gönder|toplu\s*mesaj/i.test(q)) {
    return { title: '📱 SMS Entegrasyonu', html: '<p style="font-size:12px;color:#cbd5e1">SMS modülünden toplu bildirim, nöbet hatırlatmaları ve acil durum mesajları gönderebilirsiniz. <strong>SMS Entegrasyonu</strong> sayfasına gidin.</p>' };
  }

  // === 22. SÖZLEŞME ===
  if (/sözleşme|contract|kontrat/i.test(q)) {
    return { title: '📋 Sözleşme Takibi', html: '<p style="font-size:12px;color:#cbd5e1">Sözleşme & Belge Takibi modülünden tüm personel sözleşmelerini görüntüleyebilir, süresi dolacak olanları filtreleyebilirsiniz.</p>' };
  }

  // === 23. DUYURU ===
  if (/duyuru|announcement|ilan/i.test(q)) {
    return { title: '📢 Duyuru Yönetimi', html: '<p style="font-size:12px;color:#cbd5e1">Duyuru Panosu modülünden kurum içi duyurular oluşturabilir, sabitleyebilir ve öncelik belirleyebilirsiniz.</p>' };
  }

  // === 24. TAKVİM / CALENDAR ===
  if (/takvim|calendar|etkinlik|event/i.test(q)) {
    return { title: '📅 Takvim', html: '<p style="font-size:12px;color:#cbd5e1">Takvim modülünden nöbet, izin, eğitim ve etkinlikleri tek görünümde takip edebilirsiniz. iCal dışa aktarma desteklenir.</p>' };
  }

  // === 25. RAPOR ===
  if (/rapor|report|dışa\s*aktar|export|csv|pdf/i.test(q)) {
    return { title: '📈 Raporlama', html: '<p style="font-size:12px;color:#cbd5e1">Raporlama Merkezi ve Gelişmiş Rapor Oluşturucu modüllerinden departman, personel, fazla mesai, izin, performans ve maaş raporları oluşturabilirsiniz. CSV ve PDF olarak dışa aktarılabilir.</p>' };
  }

  // === DEFAULT / YARDIM ===
  return {
    title: '🤖 Ücretsiz AI Asistan',
    html: `
      <p style="font-size:12px;color:#cbd5e1;margin-bottom:10px">Merhaba! Ben hastane verilerinizi yerel olarak analiz eden <strong>ücretsiz</strong> asistanınızım. Kredi gerektirmez! 🎉</p>
      <p style="font-size:12px;color:#94a3b8;margin-bottom:8px">Aşağıdaki konularda soru sorabilirsiniz:</p>
      <div style="display:flex;flex-wrap:wrap;gap:4px;font-size:11px">
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">📋 Nöbet özeti</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">🏢 Departman dağılımı</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">⚠️ Fazla mesai analizi</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">🏥 Hasta/personel oranı</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">👥 İş gücü planlama</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">😊 Ruh hali analizi</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">⏰ Hatırlatmalar</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">🎂 Doğum günleri</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">💰 Bütçe analizi</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">💡 Öneriler</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">🚨 Uyarılar</span>
        <span style="background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:6px;padding:3px 8px;color:#67e8f9">📊 Genel özet</span>
      </div>
    `
  };
}

/* ─── Floating chatbot (FAB) ─── */
export function initAIAssistant() {
  const existing = document.getElementById('ai-chatbot-btn');
  if (existing) return;
  const btn = document.createElement('button');
  btn.id = 'ai-chatbot-btn';
  btn.className = 'ai-chatbot-fab';
  btn.setAttribute('aria-label', 'AI Asistan');
  btn.innerHTML = '🤖';
  btn.onclick = toggleChat;
  document.body.appendChild(btn);
}

function toggleChat() {
  isOpen = !isOpen;
  let panel = document.getElementById('ai-chat-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'ai-chat-panel';
    panel.className = 'ai-chat-panel';
    panel.innerHTML = `
      <div class="ai-chat-header">
        <div class="flex items-center gap-2">
          <span>🤖</span>
          <span class="font-semibold text-white text-sm">AI HR Asistanı</span>
          <span style="font-size:9px;background:rgba(34,197,94,0.2);color:#4ade80;padding:1px 6px;border-radius:9999px">ÜCRETSİZ</span>
        </div>
        <button id="ai-chat-close" class="text-slate-400 hover:text-white transition text-lg">✕</button>
      </div>
      <div id="ai-chat-messages" class="ai-chat-messages">
        <div class="ai-msg ai-msg-bot">
          <p>Merhaba! Ben AI HR Asistanınızım. 👋</p>
          <p class="mt-1 text-xs opacity-70">Kredi gerektirmez, hastane verilerinizi anlık analiz eder.</p>
        </div>
      </div>
      <div id="ai-chat-suggestions" class="ai-chat-suggestions">
        <button class="ai-suggestion-btn" data-q="Bugünkü nöbet özeti nedir?">📋 Nöbet Özeti</button>
        <button class="ai-suggestion-btn" data-q="Departman bazlı personel dağılımını göster">🏢 Departmanlar</button>
        <button class="ai-suggestion-btn" data-q="Fazla mesai limitini aşan personel var mı?">⚠️ Mesai Uyarı</button>
        <button class="ai-suggestion-btn" data-q="Hasta/personel oranı nasıl?">🏥 Hasta Oranı</button>
        <button class="ai-suggestion-btn" data-q="Sistem uyarıları neler?">🚨 Uyarılar</button>
        <button class="ai-suggestion-btn" data-q="Genel durum özeti">📊 Özet</button>
      </div>
      <div class="ai-chat-input-area">
        <input id="ai-chat-input" type="text" class="ai-chat-input" placeholder="Sorunuzu yazın..." autocomplete="off">
        <button id="ai-chat-send" class="ai-chat-send-btn">➤</button>
      </div>`;
    document.body.appendChild(panel);
    document.getElementById('ai-chat-close').onclick = () => { isOpen = false; panel.classList.remove('open'); };
    document.getElementById('ai-chat-send').onclick = sendFABMessage;
    document.getElementById('ai-chat-input').onkeydown = (e) => { if (e.key === 'Enter') sendFABMessage(); };
    panel.querySelectorAll('.ai-suggestion-btn').forEach(btn => {
      btn.onclick = () => { document.getElementById('ai-chat-input').value = btn.dataset.q; sendFABMessage(); };
    });
  }
  panel.classList.toggle('open', isOpen);
  if (isOpen) setTimeout(() => document.getElementById('ai-chat-input')?.focus(), 200);
}

function addMessage(html, role, containerId = 'ai-chat-messages') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const div = document.createElement('div');
  div.className = `ai-msg ${role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`;
  div.innerHTML = html;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function sendFABMessage() {
  const input = document.getElementById('ai-chat-input');
  const text = input?.value?.trim();
  if (!text) return;
  input.value = '';
  addMessage(text, 'user');
  const sugBox = document.getElementById('ai-chat-suggestions');
  if (sugBox) sugBox.style.display = 'none';

  // Simulate brief thinking
  const loadId = 'ld-' + Date.now();
  addMessage('<span class="ai-typing">Analiz ediyorum<span class="dot-anim">...</span></span>', 'bot');

  setTimeout(() => {
    const msgs = document.getElementById('ai-chat-messages');
    if (msgs?.lastChild) msgs.removeChild(msgs.lastChild); // remove loading
    const result = analyzeQuestion(text);
    addMessage(`<div style="font-weight:600;color:#67e8f9;margin-bottom:6px">${result.title}</div>${result.html}`, 'bot');
  }, 400 + Math.random() * 300);
}

/* ─── Full-page AI Assistant ─── */
export function renderAIAssistantPage(el) {
  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex items-center gap-3 mb-1">
        <h1 class="text-2xl font-bold text-white">🤖 AI HR Asistanı</h1>
        <span style="font-size:10px;background:rgba(34,197,94,0.2);color:#4ade80;padding:2px 8px;border-radius:9999px;font-weight:600">ÜCRETSİZ — Kredi Gerektirmez</span>
      </div>
      <p class="text-slate-400 text-sm mt-1">Hastane verilerinizi anlık analiz eden akıllı asistan. Tüm veriler yerel olarak işlenir.</p>
    </div>

    <!-- Quick Analysis Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-in" id="ai-quick-cards"></div>

    <!-- Chat Area -->
    <div class="card fade-in mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">💬 Akıllı Analiz</h3>
      <div id="ai-page-chat" style="height:400px" class="overflow-y-auto mb-4 space-y-3 p-4 rounded-xl bg-white/5">
        <div class="ai-msg ai-msg-bot"><p>Merhaba! 👋 Hastane verilerinizi <strong>ücretsiz</strong> analiz edebilirim.</p><p class="mt-1 text-xs opacity-70">Aşağıdaki hızlı analiz kartlarını kullanın veya sorunuzu yazın.</p></div>
      </div>
      <div class="flex gap-2 flex-wrap mb-3">
        <button class="ai-page-suggestion" data-q="Genel durum özeti">📊 Genel Özet</button>
        <button class="ai-page-suggestion" data-q="Bugünkü nöbet özeti">📋 Nöbet</button>
        <button class="ai-page-suggestion" data-q="Departman dağılımını göster">🏢 Departmanlar</button>
        <button class="ai-page-suggestion" data-q="Fazla mesai analizi">⚠️ Mesai</button>
        <button class="ai-page-suggestion" data-q="Hasta/personel oranı">🏥 Hasta</button>
        <button class="ai-page-suggestion" data-q="İş gücü planlama durumu">👥 İş Gücü</button>
        <button class="ai-page-suggestion" data-q="Sistem uyarıları">🚨 Uyarılar</button>
        <button class="ai-page-suggestion" data-q="Öneriler ve aksiyonlar">💡 Öneriler</button>
        <button class="ai-page-suggestion" data-q="Bütçe ve maliyet analizi">💰 Bütçe</button>
        <button class="ai-page-suggestion" data-q="Doğum günleri">🎂 Doğum Günü</button>
      </div>
      <div class="flex gap-2">
        <input id="ai-page-input" type="text" class="input-field flex-1" placeholder="Sorunuzu yazın... (ör: nöbet özeti, departman analizi, mesai uyarısı)" autocomplete="off">
        <button id="ai-page-send" class="btn-primary">Analiz Et ➤</button>
      </div>
    </div>`;

  // Render quick analysis cards
  renderQuickCards();

  const pageInput = document.getElementById('ai-page-input');
  const pageSend = document.getElementById('ai-page-send');
  const pageChat = document.getElementById('ai-page-chat');

  function sendPageMessage() {
    const text = pageInput.value.trim();
    if (!text) return;
    pageInput.value = '';
    const userDiv = document.createElement('div');
    userDiv.className = 'ai-msg ai-msg-user';
    userDiv.textContent = text;
    pageChat.appendChild(userDiv);
    pageChat.scrollTop = pageChat.scrollHeight;

    const loadDiv = document.createElement('div');
    loadDiv.className = 'ai-msg ai-msg-bot';
    loadDiv.innerHTML = '<span class="ai-typing">Analiz ediyorum<span class="dot-anim">...</span></span>';
    pageChat.appendChild(loadDiv);
    pageChat.scrollTop = pageChat.scrollHeight;

    setTimeout(() => {
      const result = analyzeQuestion(text);
      loadDiv.innerHTML = `<div style="font-weight:600;color:#67e8f9;margin-bottom:6px">${result.title}</div>${result.html}`;
      pageChat.scrollTop = pageChat.scrollHeight;
    }, 300 + Math.random() * 200);
  }

  pageSend.onclick = sendPageMessage;
  pageInput.onkeydown = (e) => { if (e.key === 'Enter') sendPageMessage(); };
  el.querySelectorAll('.ai-page-suggestion').forEach(btn => {
    btn.onclick = () => { pageInput.value = btn.dataset.q; sendPageMessage(); };
  });
}

/* ─── Quick analysis cards on the page ─── */
function renderQuickCards() {
  const container = document.getElementById('ai-quick-cards');
  if (!container) return;
  const d = getData();
  const cards = [
    { icon: '👥', label: 'Personel', value: d.total, color: '#67e8f9' },
    { icon: '📋', label: 'Nöbetçi', value: d.today.length, color: '#4ade80' },
    { icon: '⚠️', label: 'Kritik Dept.', value: d.criticalDepts.length, color: d.criticalDepts.length ? '#f87171' : '#4ade80' },
    { icon: '⏰', label: 'Hatırlatma', value: d.reminders.length, color: '#fbbf24' },
  ];
  container.innerHTML = cards.map(c => `
    <div class="card" style="text-align:center;cursor:pointer" onclick="this.querySelector('.val')?.click()">
      <div style="font-size:1.5rem;margin-bottom:4px">${c.icon}</div>
      <div class="val" style="font-size:1.5rem;font-weight:700;color:${c.color}">${c.value}</div>
      <div style="font-size:11px;color:#94a3b8">${c.label}</div>
    </div>
  `).join('');
}
