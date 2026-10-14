const C='em-v4';
const F=['./','index.html','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','icon-512-maskable.png','icon-apple-touch.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise=fetch(e.request).then(res=>{
        if(res && res.status===200 && res.type==='basic'){
          const copy=res.clone();
          caches.open(C).then(c=>c.put(e.request,copy));
        }
        return res;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })
  );
});
