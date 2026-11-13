// public/sw.js — 📱 Seneha PWA service worker (phone එකේ app එකක් වගේ install කරන්න)
// ⚠️ Pages / data cache කරන්නේ නෑ — හැම වෙලේම අලුත්ම දේ server එකෙන් (පෞද්ගලික දත්ත phone එකේ ඉතුරු වෙන්නේ නෑ)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // network එකටම යනවා (browser default)
});
