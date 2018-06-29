const static_cache = "resto-static-cache";
const image_cache = "resto-image-cache";

self.addEventListener('install',function(event) {
    event.waitUntil(
        caches.open(static_cache).then(function(cache){
            // TODO: remove localhost:8000 when relative issue is resolved
            return cache.addAll([  
             'worker.js',   
             '/', 
             'index.html',
             'css/styles.css',
             'js/idb.js',
             'js/dbhelper.js',
             'js/main.js',
             'js/restaurant_info.js'
            ])
        })
    )
})

function serveImage(request) {
    return caches.open(image_cache).then(function(cache){
        return cache.match(request).then(function(response){
            
            if (response) return response;

            return fetch(request).then(function(net_response){
                cache.put(request, net_response.clone());
                return net_response
            })
        })
    })
}

function serveStatic(request) {
    return caches.open(static_cache).then(function(cache){
        return cache.match(request).then(function(response){
            
            // if statically cached item found - return it
            if (response) return response;

            // if it's a restaurant detail page - cache it
            if (request.url.includes("restaurant.html")) {
                return fetch(request).then(function(net_response){
                    cache.put(request, net_response.clone());
                    return net_response
                })
            } else {
              return fetch(request)
            }

           

        })
    })
}


self.addEventListener('fetch', function(event) {

    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
        return;
      }

    if (event.request.url.includes("map")) return;

    if (event.request.url.endsWith(".webp") || event.request.url.endsWith(".jpg")  || event.request.url.endsWith(".svg")) {
        event.respondWith(serveImage(event.request))
    } else {
        event.respondWith(serveStatic(event.request))   
    }
})