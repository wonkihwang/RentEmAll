// localmap.html
var map, infoWindow;

function localMap() {
    map = new google.maps.Map(document.getElementById('localMap'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 15
    });
    infoWindow = new google.maps.InfoWindow;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Current Location');
            infoWindow.open(map);
            map.setCenter(pos);
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

// contactus.html
var contactusMap;
      function rentemAllMap() {
        var latLng = {lat: 43.7712938, lng: -79.5020157};

        contactusMap = new google.maps.Map(document.getElementById('ourMap'), {
          center: latLng,
          zoom: 16
        });

        var marker = new google.maps.Marker({
          position: latLng,
          map: contactusMap,
          title: "Rent'emAll"
        });
      }