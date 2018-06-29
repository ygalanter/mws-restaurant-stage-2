

var dbPromise = idb.open("restaurant_reviews",1, function(upgradeDB) {
  upgradeDB.createObjectStore("restaurants", {keyPath:"id"});
})



/**
 * Common database helper functions.
 */
class DBHelper {

  /* Database URL */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    
    return `http://localhost:${port}/restaurants`; //USE THIS TO TEST ON DEV MACHINE ITSELF, COMMENT OTHERWISE
    //return `http://192.168.1.26:${port}/restaurants`;
    //return `http://10.100.102.18:${port}/restaurants`; //USE THIS TO TEST OVER NETWORK FROM REMOTE DEVICE (use correct IP) COMMENT OTHERWISE
  }

  static get NO_IMAGE() {
    return "noimage"
  }

  static get LOADING_IMAGE() {
    return "img/loading.svg"
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    // Trying to get restaurants from IndexDB
    dbPromise.then(function(db){
      var tx = db.transaction("restaurants");
      var restaurantStore = tx.objectStore("restaurants");
      return restaurantStore.getAll()
    }).then(function(restaurants) {
      
      if (restaurants.length !== 0) { // if restaurants already in IndexDB - return them

        callback(null, restaurants)

      } else { // If restaurants aren't in DB yet - fetch them from API

          fetch(DBHelper.DATABASE_URL)
          .then(response => response.json())
          .then(restaurants => {

            // Once restaurants are successfully fetched - add them to IndexDB
            dbPromise.then(function(db){
              var tx = db.transaction("restaurants", "readwrite");
              var restaurantStore = tx.objectStore("restaurants");

              for (let restaurant of restaurants) {
                restaurantStore.put(restaurant)
              }

              return tx.complete 

            }).then(function() { // successfully added restaurants to IndexDB
              
              console.log("Restaurants added to Index DB successfully")

            }).catch(function(error) { // failed adding restaurants to IndexDB
              
              console.log(error)

            }).finally(function(error) { // no matter whether adding to IndexDB was successfull or not - returning fetched data to caller

              callback(null, restaurants)

            })

            
          })
          .catch(error => callback(error, null))

      }


    })

    

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {

    // Trying to get restaurant by ID  from IndexDB
    dbPromise.then(function(db){

      var tx = db.transaction("restaurants");
      var restaurantStore = tx.objectStore("restaurants");
      return restaurantStore.get(parseInt(id))

    }).then(function(restaurant) {
      
      if (restaurant) { // if restaurants already in IndexDB - return them

        callback(null, restaurant)

      } else { // if restaurants aren't in Index DB - call API

        fetch(DBHelper.DATABASE_URL + '/' + id)
          .then(response => response.json())
          .then(restaurants => callback(null, restaurants))
          .catch(error => callback(error, null))
      }

    })
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph? restaurant.photograph: DBHelper.NO_IMAGE }`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

