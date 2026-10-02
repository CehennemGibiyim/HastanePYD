// ===== ICAL DISA AKTARMA YARDIMCISI =====
// Nobet/vardiya verilerini .ics formatinda disa aktarir

const SHIFT_TIMES = {
  morning: { start: '070000', end: '150000', summary: 'Sabah Vardiyasi' },
  evening: { start: '150000', end: '230000', summary: 'Aksam Vardiyasi' },
  night:   { start: '230000', end: '070000', summary: 'Gece Vardiyasi' },
};

const CR_LF = String.fromCharCode(13) + String.fromCharCode(10);
const BS = String.fromCharCode(92);
const NL = String.fromCharCode(10);

export function exportSchedulesToICal(schedules, personnelMap, filename) {
  const now = new Date();
  const dtStamp = formatICalDate(now);
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Hastane PYS//Nobet Takvimi//TR');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:' + (filename || 'Nobet Listesi'));
  lines.push('X-WR-TIMEZONE:Europe/Istanbul');

  schedules.forEach(function(s, idx) {
    const person = personnelMap[s.personnelId];
    const personName = person ? person.name + ' ' + person.surname : 'Personel';
    const shiftInfo = SHIFT_TIMES[s.shift] || SHIFT_TIMES.morning;
    const dateStr = s.date.replace(/-/g, '');

    const summary = s.notes
      ? shiftInfo.summary + ' - ' + personName + ' (' + s.notes.substring(0, 50) + ')'
      : shiftInfo.summary + ' - ' + personName;

    lines.push('BEGIN:VEVENT');
    lines.push('DTSTART:' + dateStr + 'T' + shiftInfo.start);
    lines.push('DTEND:' + dateStr + 'T' + shiftInfo.end);
    lines.push('DTSTAMP:' + dtStamp);
    lines.push('UID:hastane-pys-' + (s.id || idx) + '-' + dateStr + '@hastane.local');
    lines.push('SUMMARY:' + escapeICal(summary));
    const sDesc = 'Departman: ' + (s.department || '-') + NL +
      'Tur: ' + (s.type || '-') + NL +
      'Sure: ' + (s.duration || 8) + 's' + (s.notes ? NL + 'Not: ' + s.notes : '');
    lines.push('DESCRIPTION:' + escapeICal(sDesc));
    lines.push('LOCATION:' + (s.department || 'Devlet Hastanesi'));
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join(CR_LF)], { type: 'text/calendar;charset=utf-8' });
  const fname = (filename || 'nobet_takvimi') + '_' + new Date().toISOString().split('T')[0] + '.ics';
  triggerDownload(blob, fname);
}

export function exportLeavesToICal(leaves, personnelMap, filename) {
  const now = new Date();
  const dtStamp = formatICalDate(now);
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Hastane PYS//Izin Takvimi//TR');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:' + (filename || 'Izin Takvimi'));

  leaves.forEach(function(l, idx) {
    const person = personnelMap[l.personnelId];
    const personName = person ? person.name + ' ' + person.surname : 'Personel';
    const startDate = l.startDate.replace(/-/g, '');
    const endDate = l.endDate.replace(/-/g, '');

    lines.push('BEGIN:VEVENT');
    lines.push('DTSTART;VALUE=DATE:' + startDate);
    lines.push('DTEND;VALUE=DATE:' + endDate);
    lines.push('DTSTAMP:' + dtStamp);
    lines.push('UID:hastane-izin-' + (l.id || idx) + '@hastane.local');
    lines.push('SUMMARY:' + escapeICal('Izinli - ' + personName + ' (' + (l.type || 'Yillik Izin') + ')'));
    const lDesc = 'Departman: ' + (l.department || '-') + NL +
      'Izin Turu: ' + (l.type || '-') + NL +
      'Gun: ' + (l.days || '-');
    lines.push('DESCRIPTION:' + escapeICal(lDesc));
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join(CR_LF)], { type: 'text/calendar;charset=utf-8' });
  const fname = (filename || 'izin_takvimi') + '_' + new Date().toISOString().split('T')[0] + '.ics';
  triggerDownload(blob, fname);
}

function formatICalDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeICal(text) {
  var str = String(text || '');
  var out = '';
  for (var i = 0; i < str.length; i++) {
    var ch = str.charAt(i);
    if (ch === ';') out += BS + ';';
    else if (ch === ',') out += BS + ',';
    else if (ch === NL) out += BS + 'n';
    else out += ch;
  }
  return out;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
