// ===== HASTANE PYS - SERVICE WORKER (ENHANCED OFFLINE-FIRST) =====
const CACHE_NAME = 'hastane-pys-v91';
const STATIC_ASSETS = [
  './', './index.html', './styles.css?build=v80', './security.css', './identity-center.css', './access-review.css', './data-quality.css', './critical-alerts.css', './mobile-staff.css', './executive-panels.css', './patient-flow.css', './clinical-results.css', './medication-safety.css', './infection-command-center.css', './patient-safety-center.css', './clinical-risk-center.css', './antibiotic-stewardship.css', './main.js', './main.js?build=v88', './manifest.json',
  './js/app.js', './js/app-core.js', './js/app-core.js?build=v88', './js/state.js', './js/state-extensions.js', './js/notifications.js',
  './js/hr-suite.js', './js/hr-suite.js?build=v80', './js/platform-suite.js', './js/platform-suite.js?build=v80', './js/services/central-storage-bridge.js?build=v88',
  './js/services/hr-storage.js', './js/services/platform-storage.js',
  './js/pages/hr-command-center.js', './js/pages/personnel-detail.js', './js/pages/employee-portal.js', './js/pages/personnel.js', './js/pages/schedule.js', './js/pages/attendance.js', './js/pages/dutyboard.js', './js/pages/calendar.js', './js/pages/contacts.js', './js/pages/leave-management.js', './js/pages/performance.js', './js/pages/reports.js', './js/pages/tasks.js', './js/pages/my-work.js', './js/pages/announcements.js', './js/pages/profile.js', './js/pages/settings.js',
  './js/pages/workflow-center.js', './js/pages/shift-optimizer.js', './js/pages/my-work.js',
  './js/pages/platform-command.js', './js/pages/personnel-360.js',
  './js/pages/governance.js', './js/pages/security-center.js', './js/pages/identity-center.js', './js/services/identity-policy.js', './js/pages/access-review.js', './js/services/access-review.js', './js/pages/data-quality.js', './js/services/data-quality.js', './js/pages/mobile-staff.js', './js/pages/workforce-safety.js',
  './js/pages/employee-operations.js', './js/pages/integration-planning.js',
  './js/pages/platform-ai.js', './js/pages/api-integration.js', './js/pages/market-roadmap.js', './js/pages/executive-panels.js', './js/pages/patient-flow.js', './js/pages/clinical-results.js', './js/pages/medication-safety.js', './js/pages/antibiotic-stewardship.js', './js/pages/infection-command-center.js', './js/services/infection-control-storage.js', './js/pages/infection-control.js', './js/pages/hand-hygiene.js', './js/pages/bed-management.js', './js/pages/critical-alerts.js', './js/services/critical-alerts-storage.js',
  './js/pages/patient-crm.js', './js/pages/disaster-management.js', './js/pages/operations-forecast.js', './js/pages/revenue-cycle.js', './js/pages/patient-safety-center.js', './js/services/patient-safety-storage.js', './js/pages/clinical-risk-center.js', './js/services/clinical-risk-storage.js', './js/pages/training-center.js', './js/services/training-center-storage.js', './js/pages/or-icu-center.js', './js/services/or-icu-storage.js', './js/pages/sterilization-center.js', './js/services/sterilization-center-storage.js', './js/pages/blood-transfusion-center.js', './js/services/blood-transfusion-center-storage.js', './js/pages/clinical-command-center.js', './js/services/clinical-command-storage.js', './js/pages/clinical-research-center.js', './js/services/clinical-research-storage.js', './js/pages/care-coordination.js', './js/services/care-coordination-storage.js', './js/pages/morbidity-mortality.js', './js/services/morbidity-mortality-storage.js', './js/pages/patient-experience-center.js', './js/services/patient-feedback-storage.js', './js/pages/patient-portal.js', './js/pages/telemedicine.js', './js/services/patient-experience-storage.js', './training-center.css', './or-icu-center.css', './sterilization-center.css', './blood-transfusion-center.css', './clinical-command-center.css', './clinical-research-center.css', './care-coordination.css', './mm-center.css', './patient-experience.css', './patient-feedback-center.css', './patient-rights.css', './quality-improvement.css', './js/pages/patient-rights.js', './js/services/patient-rights-storage.js', './js/pages/quality-improvement.js', './js/services/quality-improvement-storage.js', './js/pages/clinical-nutrition-center.js', './js/services/clinical-nutrition-storage.js', './clinical-nutrition-center.css', './js/pages/medication-reconciliation.js', './js/services/medication-reconciliation-storage.js', './medication-reconciliation.css', './js/pages/medical-device-center.js', './js/services/medical-device-center-storage.js', './medical-device-center.css', './js/pages/clinical-protocol-compliance.js', './js/services/clinical-protocol-storage.js', './clinical-protocol-compliance.css', './js/pages/sepsis-monitoring.js', './js/services/sepsis-monitoring-storage.js', './sepsis-monitoring.css', './js/pages/surgical-safety-center.js', './js/services/surgical-safety-storage.js', './surgical-safety-center.css'
, './js/pages/patient-prevention-center.js', './js/services/patient-prevention-storage.js', './patient-prevention-center.css', './js/pages/patient-identification-center.js', './js/services/patient-identification-storage.js', './patient-identification-center.css', './js/pages/patient-transfer-center.js', './js/services/patient-transfer-storage.js', './patient-transfer-center.css', './js/pages/specimen-safety-center.js', './js/services/specimen-safety-storage.js', './specimen-safety-center.css', './js/pages/discharge-safety-center.js', './js/services/discharge-safety-storage.js', './discharge-safety-center.css', './js/pages/patient-education-center.js', './js/services/patient-education-center-storage.js', './patient-education-center.css', './js/pages/pain-management-center.js', './js/services/pain-management-storage.js', './pain-management-center.css', './js/pages/palliative-care-center.js', './js/services/palliative-care-storage.js', './palliative-care-center.css', './js/pages/production-readiness.js', './js/services/secure-storage.js', './js/services/central-storage-bridge.js', './js/services/enterprise-storage.js', './js/pages/audit.js', './js/services/integration-gateway.js', './js/pages/integration-operations.js', './js/services/backup-vault.js', './js/pages/backup-recovery.js', './js/services/signature-vault.js', './js/services/signature-provider.js', './js/pages/signature-center.js', './js/pages/signature-chain.js', './js/pages/enterprise-hub.js', './js/pages/reward-catalog.js', './production-readiness.css', './enterprise-hub.css', './signature-center.css', './integration-sla.css', './js/pages/integration-sla.js', './js/services/integration-sla.js', './kvkk-governance.css', './js/pages/kvkk-governance.js', './js/services/kvkk-governance.js', './disaster-recovery-reporting.css', './js/pages/disaster-recovery-reporting.js', './js/services/disaster-recovery-reporting.js', './enterprise-risk-center.css', './js/pages/enterprise-risk-center.js', './js/services/enterprise-risk.js', './governance-control-center.css', './js/pages/governance-control-center.js', './js/services/governance-control.js', './market-command-center.css', './it-service-center.css', './js/pages/market-command-center.js', './js/services/market-command-center.js', './js/pages/it-service-center.js', './js/services/it-service-center.js', './next-stage-center.css', './js/pages/next-stage-center.js', './js/services/next-stage-center.js', './hospital-control-tower.css', './js/pages/hospital-control-tower.js', './js/services/hospital-control-tower.js', './committee-center.css', './js/pages/committee.js', './js/services/committee-center.js', './reporting-center.css', './js/pages/reporting-center.js', './js/services/reporting-center.js', './offline-ui.css', './offline-runtime.js', './project-download.css', './js/utils/project-archive.js?build=v91'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {
      return Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url).catch(() => {})));
    }))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const own = url.origin === self.location.origin;
  const isCDN = ['cdn.jsdelivr.net', 'cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'unpkg.com']
    .some((host) => url.hostname.includes(host));
  if (own) {
    event.respondWith(caches.match(event.request).then((cached) => {
      const fresh = fetch(event.request).then((response) => {
        if (response && response.status === 200) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        return response;
      }).catch(() => cached);
      return cached || fresh;
    }));
  } else if (isCDN) {
    event.respondWith(fetch(event.request).then((response) => {
      if (response && response.status === 200) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request)));
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Hastane PYS', body: 'Yeni bildirim' };
  event.waitUntil(self.registration.showNotification(data.title || 'Hastane PYS', {
    body: data.body || 'Yeni bildiriminiz var', icon: data.icon, badge: data.badge,
    tag: data.tag || 'default', data: data.data || {}, actions: data.actions || [], vibrate: [200, 100, 200]
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus();
    }
    return self.clients.openWindow('./');
  }));
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') event.waitUntil(self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage({ type: 'SYNC_COMPLETE', timestamp: Date.now() }));
  }));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.open(CACHE_NAME).then((cache) => cache.keys().then((keys) => {
      event.source?.postMessage({ type: 'CACHE_STATUS', cachedCount: keys.length, cacheName: CACHE_NAME });
    }));
  }
});
