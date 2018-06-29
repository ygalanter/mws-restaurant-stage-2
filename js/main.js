let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

// lighthouse suggestion for automatic http->https redirect
// if (location.protocol != 'https:')
// {
//  location.href = 'https://' + location.hostname + ':444/' + location.pathname + location.search
// }


//Registering service worker
if (navigator.serviceWorker) {
  navigator.serviceWorker.register('/worker.js', {scope: '/'}).then(function(){
    console.log('SW Registration success!');
  }).catch(function(e) {
    console.log(e);
  })
}



/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
  
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  
  try {
    self.newMap = L.map('map', {
          center: [40.722216, -73.987501],
          zoom: 12,
          scrollWheelZoom: false
        });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
      mapboxToken: 'pk.eyJ1IjoieWdhbGFudGVyIiwiYSI6ImNqaWxzOGIwYzAxNzkzbG85cmRhZjU4ZnUifQ.J2fvK2vYB2xZIWGDv_46Zw',
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(newMap);
  } catch (e) {
     document.querySelector("#map").innerHTML  = "<h1>Map is offline</h1>"
  }

  updateRestaurants();

    
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });

  try {
    addMarkersToMap();
  }
  catch (e){}
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  name.setAttribute("tabIndex","0");
  li.append(name);

  // picture element with WEBP source set for browsers that support it
  const picture = document.createElement('picture');
  picture.className = 'restaurant-img';
  picture.setAttribute('data-srcset', DBHelper.imageUrlForRestaurant(restaurant) + '.webp')
  picture.setAttribute('alt', restaurant.name)
  picture.setAttribute('title', restaurant.name)
  li.append(picture);

  const source = document.createElement('source');
  source.setAttribute('type', "image/webp");
  source.setAttribute('srcset', DBHelper.LOADING_IMAGE);
  picture.append(source);

  // fallback img element with JPG sources that don't support the above
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant) + '.jpg') ;
  image.setAttribute('src', DBHelper.LOADING_IMAGE);
  image.setAttribute('alt', restaurant.name)
  image.setAttribute('title', restaurant.name)
  picture.append(image);
  

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.setAttribute("tabIndex","0");
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.setAttribute("tabIndex","0");
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

} 
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

// bypassing map in keyboard navigation
document.querySelector("#home").addEventListener("keydown",function(event){
  if (event.keyCode == 9 && !event.shiftKey) {
    event.preventDefault();
    document.querySelector("#neighborhoods-select").focus();
  }
})

document.querySelector("#neighborhoods-select").addEventListener("keydown",function(event){
  if (event.keyCode == 9 && event.shiftKey) {
    event.preventDefault();
    document.querySelector("#home").focus();
  }
})


//******* lazy loading of offscreen images 

// function to detect if element is visible (c) https://stackoverflow.com/a/12418814/961695
function inViewport (el) {

  var r, html;
  if ( !el || 1 !== el.nodeType ) { return false; }
  html = document.documentElement;
  r = el.getBoundingClientRect();

  return ( !!r 
    && r.bottom >= 0 
    && r.right >= 0 
    && r.top <= html.clientHeight 
    && r.left <= html.clientWidth 
  );

}

function lazyLoad () {
  
  for (var pic of document.querySelectorAll('picture[data-srcset]')) {
    if (inViewport(pic)) {
      let source = pic.querySelector("source");

      source.setAttribute('srcset', pic.getAttribute('data-srcset'));
      pic.removeAttribute('data-srcset');

      let img = pic.querySelector("img");
      img.setAttribute('src',img.getAttribute('data-src'));
      img.removeAttribute('data-src');
    }
  }

};
 
addEventListener('DOMContentLoaded', lazyLoad, false); 
addEventListener('load', lazyLoad, false); 
addEventListener('scroll', lazyLoad, false); 
addEventListener('resize', lazyLoad, false); 