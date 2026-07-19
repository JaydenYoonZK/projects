/*! Projects by Jayden Yoon ZK | Copyright (c) 2026 Jayden Yoon ZK | MIT License | https://github.com/JaydenYoonZK/projects */
/* Offline shell for the directory: cached pages open instantly and the
   GitHub refresh simply skips when there is no network. */
const VERSION = "?v=1.1.2";
const CACHE = "projects-" + VERSION;
const SHELL = ["./", "404.html", "notfound.js" + VERSION, "styles.css" + VERSION, "app.js" + VERSION, "directory.js" + VERSION];

addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // GitHub API calls pass through untouched
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      const refresh = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => hit);
      if (hit) { refresh.catch(() => {}); return hit; }
      const res = await refresh;
      if (res) return res;
      if (req.mode === "navigate") return cache.match("./");
      return Response.error();
    })
  );
});
