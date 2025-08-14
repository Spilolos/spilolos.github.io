const CACHE='edughana-v3';
const APP_SHELL=[
  'index.html','lessons.html','quizzes.html','app.js','admin.js','manifest.json','assets/hero.jpg',
  'assets/icon-192.png','assets/icon-512.png',
  'assets/mathematics.jpg','assets/science.jpg','assets/ghanaian_history.jpg','assets/english.jpg','assets/career_technology.jpg',
  'https://cdn.tailwindcss.com'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL))); self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
      const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return res;
    }).catch(()=>caches.match('index.html')))
  );
});