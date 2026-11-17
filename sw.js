// Service worker: keeps the site working offline.
// Pages, styles, scripts and icons: served from the cache, refreshed in the background.
// Data files: network first (so online visitors always get the newest run), cache as the fallback.
const CACHE = "jetset-v2";
const SHELL = [
  "./", "index.html", "browse.html", "trends.html",
  "assets/style.css", "assets/app.js", "assets/charts.js", "assets/decor.js", "assets/globe.js",
  "assets/vendor/d3-array.min.js", "assets/vendor/d3-geo.min.js",
  "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
];
const DATA = ["data/history.csv", "data/status.json", "assets/land-110m.json"];
const MAP_CDN = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL).then(() => Promise.all(DATA.map((d) => c.add(d).catch(() => {})))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.href === MAP_CDN) {
    // the globe's coastlines (fallback copy): cache first, so the globe still has land offline
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;

  if (url.pathname.includes("/data/")) {
    // network first, then the last copy this device loaded
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url.pathname, copy));
        }
        return res;
      }).catch(() => caches.match(url.pathname).then((hit) => hit || caches.match(req, { ignoreSearch: true })))
    );
    return;
  }

  // everything else: cache first, update the cache in the background
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const network = fetch(req).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => hit || caches.match("index.html"));
      return hit || network;
    })
  );
});
