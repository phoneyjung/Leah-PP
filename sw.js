// Leah-PP service worker: network first (always newest when online), cache as backup when offline.
const CACHE='leahpp-v12';
const FILES=['./','index.html','manifest.json','questions-index.json',
'q-math-6.json','q-math-7.json','q-math-8.json','q-english-6.json','q-english-7.json','q-english-8.json',
'q-thai-6.json','q-thai-7.json','q-thai-8.json','q-chinese-6.json','q-chinese-7.json','q-chinese-8.json',
'q-general-6.json','q-general-7.json','q-general-8.json',
'leah-walk.png','leah-idle.png','dad-idle.png','mom-idle.png','peb-idle.png','nuan-idle.png',
'cave-floor.jpg','cave-wall.jpg','tiles-cave.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>null)))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return r}).catch(()=>caches.match(e.request)));
});
