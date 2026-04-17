// ── PWA Manifest ──────────────────────────────────────────────────────────────
// Generates the manifest dynamically so the app works as a single-file deploy
// or from any subdirectory (e.g. GitHub Pages /repo-name/).
(function generateManifest() {
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="100" fill="#0a0f1e"/>
    <circle cx="256" cy="256" r="180" fill="none" stroke="#6366f1" stroke-width="30"/>
    <path d="M160 256h40m112 0h40M200 256v-60m0 120v-60M312 256v-60m0 120v-60"
      stroke="#6366f1" stroke-width="28" stroke-linecap="round"/>
  </svg>`;

  const iconDataUrl = 'data:image/svg+xml,' + encodeURIComponent(svgIcon);

  const manifest = {
    name: "Fitness Tracker",
    short_name: "Fitness",
    description: "Track workouts",
    start_url: "./",
    display: "standalone",
    background_color: "#0a0f1e",
    theme_color: "#0a0f1e",
    orientation: "portrait",
    icons: [{ src: iconDataUrl, sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }],
    screenshots: [{ src: iconDataUrl, sizes: "512x512", type: "image/svg+xml", form_factor: "narrow" }],
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  document.getElementById('manifest-placeholder').href = URL.createObjectURL(blob);
})();


// ── Service Worker ────────────────────────────────────────────────────────────
// Smart update strategy: never interrupts a mid-workout session.
window._swUpdateReady = false;
window._swReg = null;

if ('serviceWorker' in navigator) {
  const CACHE_VERSION = 'fitness-v27';
  const PAGE_URL = location.href.split('?')[0];

  // All assets the SW should cache (listed explicitly since we now have multiple files)
  const ASSETS_TO_CACHE = [
    PAGE_URL,
    './css/styles.css',
    './js/pwa.js',
    './js/db.js',
    './js/themes.js',
    './js/data.js',
    './js/google-drive.js',
    './js/utils.js',
    './js/constants.js',
    './js/components/icons.js',
    './js/components/ui.js',
    './js/components/charts.js',
    './js/components/muscle-selector.js',
    './js/components/exercise-picker.js',
    './js/components/set-row.js',
    './js/components/workout-entry-card.js',
    './js/components/install-banner.js',
    './js/screens/editor.js',
    './js/screens/detail.js',
    './js/screens/quick-log.js',
    './js/screens/log.js',
    './js/screens/stats.js',
    './js/screens/library.js',
    './js/screens/settings.js',
    './js/app.js',
    './js/react.production.min.js',
  ];

  const swScript = `
const CACHE = '${CACHE_VERSION}';
const ASSETS = ${JSON.stringify(ASSETS_TO_CACHE)};
const PAGE = '${PAGE_URL}';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cache each asset independently so one failure doesn't block the rest
    await Promise.all(ASSETS.map(url => cache.add(url).catch(() => {})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const isNavigation = event.request.mode === 'navigate';
  if (isNavigation) {
    // Network-first for navigation; fall back to cache when offline
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || await caches.match(PAGE) || new Response('Offline', { status: 503 });
        })
    );
  } else {
    // Cache-first for all other assets (scripts, styles, etc.)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
`;

  try {
    const blob = new Blob([swScript], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);

    navigator.serviceWorker.register(swUrl).then(registration => {
      window._swReg = registration;

      if (registration.waiting) {
        window._swUpdateReady = true;
        window.dispatchEvent(new Event('swupdateready'));
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window._swUpdateReady = true;
            window.dispatchEvent(new Event('swupdateready'));
          }
        });
      });

      // Reload the page when a new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      // Periodically check for updates (every hour)
      setInterval(() => registration.update(), 60 * 60 * 1000);
    }).catch(() => {});
  } catch (_) {}
}


// ── Install Prompt ────────────────────────────────────────────────────────────
// Captures the browser's "Add to Home Screen" prompt for use in the UI.
window._installPrompt = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  window._installPrompt = event;
  if (window._onInstallPromptReady) window._onInstallPromptReady();
});
