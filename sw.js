/* 考公补给站 Service Worker — 离线缓存 */
const CACHE_NAME='kaogong-v34';
const CORE_FILES=[
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/robots.txt',
  '/items.json',
  '/version.txt',
];

// Install: pre-cache core shell
self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(c){
      return c.addAll(CORE_FILES);
    }).then(function(){return self.skipWaiting();})
  );
});

// Activate: clean old caches, notify clients
self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE_NAME;}).map(function(k){return caches.delete(k);}));
    }).then(function(){
      return self.clients.claim();
    }).then(function(){
      // Notify all open clients about the update
      return self.clients.matchAll({type:'window'}).then(function(clients){
        clients.forEach(function(client){
          client.postMessage({type:'SW_UPDATED',version:'v34'});
        });
      });
    })
  );
});

// Message handler
self.addEventListener('message',function(e){
  if(e.data&&e.data.type==='SKIP_WAITING'){
    self.skipWaiting();
  }
});

// Fetch: stale-while-revalidate for HTML/data, cache-first for assets
self.addEventListener('fetch',function(e){
  var url=new URL(e.request.url);
  if(e.request.method!=='GET')return;

  // HTML & data.json: stale-while-revalidate (instant from cache, update in background)
  var isHTML=url.pathname==='/'||url.pathname.endsWith('.html');
  var isData=url.pathname.endsWith('data.json')||url.pathname.endsWith('items.json');
  if(isHTML||isData){
    e.respondWith(
      caches.match(e.request).then(function(cached){
        var networkFetch=fetch(e.request).then(function(r){
          if(r.ok){
            var resp=r.clone();
            caches.open(CACHE_NAME).then(function(c){return c.put(e.request,resp);});
          }
          return r;
        }).catch(function(){return null;});
        // Return cached immediately if available, otherwise wait for network
        return cached||networkFetch||new Response('Offline',{status:503});
      })
    );
    return;
  }

  // version.txt: always network
  if(url.pathname.endsWith('version.txt')){
    e.respondWith(
      fetch(e.request).catch(function(){
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
