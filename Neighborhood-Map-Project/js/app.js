var map;

function startMap() {

    // Constructor creates a new map with given location
    map = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 13,
        center: {
            lat: 24.7136,
            lng: 46.6753
        }
    });

    //this function will activiate knockout
    ko.applyBindings(new MapViewModel());

}

//this function will handle errors of Google map API request ex. no internet connection
function MapErrorHandler() {
    alert('Google Maps has failed to load correctly. Please check your Wifi connection then try again later.');
}

// create view model for the application
function MapViewModel() {

    
    var self = this;
    this.filter = ko.observable('');
	this.weather_date = ko.observable('');
	this.weather_temp_min = ko.observable('');
	this.weather_temp_max = ko.observable('');
	this.weather_text = ko.observable('');
	this.url = ko.observable('');

    this.locationItems = ko.observableArray([
        new Location('Riyadh Exhibition Center', 24.751508, 46.725883, '4bb1b5fff964a520df9f3ce3'),
        new Location('Royal Saudi Air Force Museum', 24.754899, 46.740775, '4f1c2a31e4b0c7ea68bac522'),
        new Location('King Salman Social Center', 24.754587, 46.728759, '4eaee6a59adf5c72deece894'),
        new Location('Masmak Fortress', 24.631252, 46.713330, '4cb88d8cdd41a35dcbcadba0'),
        new Location('King Abdulla Financial District', 24.764291, 46.640911, '4ddbd5a6d164b4610a69911c'),
        new Location('Tamkeen Tower', 24.821513, 46.619691, '50642b94e4b066548fcff4c7')
    ]);


    //This function is called when user input some search text, will filter the search and then show only locations that fit the search criteria, inspired from:	
    //http://stackoverflow.com/questions/36283070/search-filter-with-knockoutjs
    //https://stackoverflow.com/questions/17557789/using-contains-instead-of-stringstartswith-knockout-js	
    self.filterdItems = ko.computed(function() {

        var filter = self.filter().toLowerCase();

        if (!filter) {
            self.locationItems().forEach(function(item) {
                item.visible(true);
            });
            return self.locationItems();
        } else { 
            return ko.utils.arrayFilter(self.locationItems(), function(item) {				         	
                item.visible(item.title.toLowerCase().search(filter) >= 0);
                return item.title.toLowerCase().indexOf(filter) !== -1;
            });
        }
    }, self);


    //Yahoo weather API PART
	//https://www.igorkromin.net/index.php/2016/04/15/example-yahoo-weather-yql-to-fetch-forecasts-and-render-with-jquery/
    var iconUrl = 'https://s.yimg.com/zz/combo?a/i/us/we/52/';
    var yahooWeatherURL = "https://query.yahooapis.com/v1/public/yql?q=select title, units.temperature, item.forecast from weather.forecast where woeid in (select woeid from geo.places(1) where text='Riyadh') and u='c'&format=json";
	
	
    // Ajax call to weahter API	
    $.ajax({

        url: yahooWeatherURL,
        success: function(data) {
            
            self.weather_date(data.query.results.channel[0].item.forecast.date);
            self.weather_temp_min(data.query.results.channel[0].item.forecast.low + data.query.results.channel[0].units.temperature);
            self.weather_temp_max(data.query.results.channel[0].item.forecast.high + data.query.results.channel[0].units.temperature);
            self.url(iconUrl + data.query.results.channel[0].item.forecast.code + '.gif');
            self.weather_text(data.query.results.channel[0].item.forecast.text);
           
        },

        error: function(jqXHR) {
            var msg = '';
            if (jqXHR.status === 0) {
                msg = 'No Internet Connection.\n Check Network.';
            } else if (jqXHR.status == 404) {
                msg = 'The Requested weather page was not found. [404]';
            } else if (jqXHR.status == 500) {
                msg = 'Internal Server Error [500].';
            } else {
                msg = 'Uncaught Error.\n' + jqXHR.responseText;
            }
            alert(msg);
        },
    });
	
	
	self.toggleClick = function() {
		    var x = document.getElementById('toggleContainer')
            x.classList.toggle("change");
		    $("#wrapper").toggleClass("toggled");
        }

}

//Location constructor function
var Location = function(title, lat, lng, venueID) {
    var self = this;
    this.title = title;
    this.lng = lng;
    this.lat = lat;
    this.venueID = venueID;
    this.venueContentString = '';
    this.imageContentString = '';
    this.visible = ko.observable(true);
	
	//foursquare API PART
    //foursquare string request to get venues along with its address
    var foursquareURL = "https://api.foursquare.com/v2/venues/search?v=20161016&ll=" + this.lat + ',' + this.lng + "&intent=checkin&client_id=RFUSLGR0VIB3OZYMM2RRNHYBVAID3J1DGTEUF0XLTQLEOMBU&client_secret=5GW1KDO1BYHH5WRNC2S5T5WPSFCEITMAGDTQNC4PWXI5VA42";

    // Ajax call to foursquare API	
    $.ajax({

        url: foursquareURL,
        success: function(data) {
            			 
            self.venueContentString =
                '<div><b>' + self.title + '</b></div>' +
                '<div>' + (data.response.venues[0].name || 'Name of venue was not found') + '</div>' +
                '<div>' + (data.response.venues[0].location.formattedAddress[0] || 'address was not found') + '</div>' +
                '<div>' + (data.response.venues[0].location.formattedAddress[1] ||  'secondry address was not found') + '</div>';
        },

        error: function(jqXHR) {
            var msg = '';
            if (jqXHR.status === 0) {
                msg = 'No Internet Connection.\n Check Network.';
            } else if (jqXHR.status == 404) {
                msg = 'The Requested page for foursquare API was not found. [404]';
            } else if (jqXHR.status == 500) {
                msg = 'Internal Server Error [500].';
            } else {
                msg = 'Uncaught Error.\n' + jqXHR.responseText;
            }
            alert(msg);
        },
    });


    //foursquare API string request to get the profile picture of each venue if any
    var venueURL = "https://api.foursquare.com/v2/venues/" + this.venueID + "/photos?sort=recent&limit=5&v=20150609&client_id=RFUSLGR0VIB3OZYMM2RRNHYBVAID3J1DGTEUF0XLTQLEOMBU&client_secret=5GW1KDO1BYHH5WRNC2S5T5WPSFCEITMAGDTQNC4PWXI5VA42";


    $.ajax({

        url: venueURL,
        success: function(data) {

            self.imageContentString = "<div><img src='" + data.response.photos.items[0].prefix + '200x100' + data.response.photos.items[0].suffix + "' alt='Image from foursquare API'></div>";

        },

        error: function(jqXHR) {
            var msg = '';
            if (jqXHR.status === 0) {
                msg = 'No Internet Connection.\n Check Network.';
            } else if (jqXHR.status == 404) {
                msg = 'The Requested page for foursquare API was not found. [404]';
            } else if (jqXHR.status == 500) {
                msg = 'Internal Server Error [500].';
            } else {
                msg = 'Uncaught Error.\n' + jqXHR.responseText;
            }
            alert(msg);
        },
    });


    self.marker = new google.maps.Marker({
        position: new google.maps.LatLng(this.lat, this.lng),
        map: map
    });

    //this function is called when user click on the list item, which will trigger marker click function
    self.itemClicked = function() {

        google.maps.event.trigger(self.marker, 'click');

    };
	
	this.showMarker = ko.computed(function() {
        if (this.visible() === true) {
            this.marker.setVisible(true);
        } else {
            this.marker.setVisible(false);
        }
        return true;
    }, this);


    //function is invoke when user click on marker	
    self.marker.addListener('click', function() {

        self.infoWindow = new google.maps.InfoWindow({
            content: self.imageContentString + self.venueContentString
        });

        self.infoWindow.open(map, this);

        //toggle the animation
        self.marker.setAnimation(google.maps.Animation.BOUNCE);

        //change the color of a marker once selected
        self.marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');

        // This function will set time limit for the bounce & color and will close info window once time limit is reached
        setTimeout(function() {
            self.marker.setAnimation(null);
            self.marker.setIcon(null);
            self.infoWindow.close();
        }, 5000);


    });
	
	 
};


