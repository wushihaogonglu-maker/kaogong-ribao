/* 考公补给站 Service Worker — 离线缓存 */
const CACHE_NAME='kaogong-v16';
const CORE_FILES=[
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/robots.txt',
];

// Install: pre-cache core shell
self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      return c.addAll(CORE_FILES);
    }).then(function(){return self.skipWaiting();})
  );
});

// Activate: clean old caches
self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    }).then(function(){return self.clients.claim();})
  );
});

// Fetch: network-first for data, cache-first for assets
self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);
  if(e.request.method!=='GET')return;

  // data.json: network first, fallback to cache, max-age 120s
  if(url.pathname.endsWith('data.json')){
    e.respondWith(
      fetch(e.request).then(function(r){
        var resp=r.clone();
        caches.open(CACHE_NAME).then(function(c){return c.put(e.request,resp);});
        return r;
      }).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }

  // Everything else: cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached||fetch(e.request).then(function(r){
        var resp=r.clone();
        caches.open(CACHE_NAME).then(function(c){return c.put(e.request,resp);});
        return r;
      });
    })
  );
});
