const static_cache = "resto-static-cache";
const image_cache = "resto-image-cache";

self.addEventListener('install',function(event) {
    event.waitUntil(
        caches.open(static_cache).then(function(cache){
            return cache.addAll([
             'index.html',
             'restaurant.html',
             'css/styles.css',
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
            
            if (response) return response;
            return fetch(request)

        })
    })
}


self.addEventListener('fetch', function(event) {

    if (event.request.url.endsWith(".webp") || event.request.url.endsWith(".jpg")) {
        event.respondWith(serveImage(event.request))
    } else {
        event.respondWith(serveStatic(event.request))   
    }
})