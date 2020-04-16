//  *************************
//  DEFINITIONS SECTION (1/3)
//  *************************

// Define the basic map
var basic =  
  L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.streets-basic",
    accessToken: API_KEY
  })

// Define the light map
var light = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
  attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
  maxZoom: 18,
  id: "mapbox.light",
  accessToken: API_KEY
});

// Define the baseMaps options
var baseMaps = {
  Basic: basic,
  Light: light
};

// Define the path for the fault lines' GEOJSON
var Boundaries = "static/js/Boundaries.json"

// Deine the Color list
var colorList = ['#8c510a','#d8b365','#f6e8c3','#c7eae5','#5ab4ac','#01665e']

// Define a control layer for the legend
var info = L.control({
  position: "bottomright"
});

// Define a function that takes a number and produces an array item from the Color List
function myColor(x) {
  if (x > 6) { return colorList[0]}
  else if (x > 5.7) {return colorList[1]}
  else if (x > 5.4) {return colorList[2]}
  else if (x > 5.1) {return colorList[3]}
  else if (x > 4.8) {return colorList[4]}
  else              {return colorList[5]}
}

// Define a function that formats the time from float to a date
var formatTime = d3.timeFormat("%B %d, %Y %H:%M");


// ****************************
// DATA READING SECTION (2/3)
// ****************************

// Read the json file of all the earthquakes over 4.5 for the past month, then   
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson", function(data){

  // Define the features library in the GEOJSON file, and three lists we'll use
  features = data.features;
  magnitude = [];
  longitude = [];
  latitude = [];

  // Loop through the 'features' library and push the 
  for (var i = 0; i < features.length; i++) {
    magnitude.push(features[i].properties.mag)
    longitude.push(features[i].geometry.coordinates[0]);
    latitude.push(features[i].geometry.coordinates[1]);
  }

  // Data in Greenland screwed up the size of the bubbles, so for now, I just cut it out
  latitude.splice(157,1);
  longitude.splice(157,1);

  // Define an array for the circle markers
  quakeCircles = [];

  // Loop through remaining coordinates, push circles into the array above
  for (var j = 0; j < 156; j++) {
    quakeCircles.push(
      L.circle([latitude[j],longitude[j]], {
        opacity: 1,
        fillOpacity: 1,
        color: myColor(magnitude[j]),
        fillColor: myColor(magnitude[j]),
        // radius proportional to magnitude
        radius:  50000 * magnitude[j]
        // Include a Pop-up when you click on each circle
      }).bindPopup("<h4>Location: "+features[j].properties.place+"</h4>"+
                   "<p>Time: "+formatTime(features[j].properties.time)+"</p>"+
                   "<p>Magnitude: "+magnitude[j]+"</p>"
                  )
    )
  };

  // Load the Fault line GEOJSON data, then add it to the map.
  d3.json( Boundaries, function( faultjson ) {
    var bounds = faultjson
    var boundStyle = {"color": "brown", "weight": 3};
    L.geoJSON(bounds, {style:boundStyle}).addTo(myMap)
  });
  
  // *******************************
  // MAP VISUALIZATION SECTION (3/3)
  // *******************************
  
  // Define a layer from the array of circles, then define that layer as an overlay
  var quakeLayer = L.layerGroup(quakeCircles);
  var overlayMaps = {Quakes: quakeLayer};

  // Create a map object and include the basic map and the quake layer to start
  var myMap = L.map("map", {
  center: [10.5994, -0.6731],
  zoom: 2,
  layers: [basic, quakeLayer]
  });

  // Include the base maps and the overlay maps into the defined map.
  L.control.layers(baseMaps, overlayMaps).addTo(myMap);

  // When the layer control is added, insert a div with the class of "legend"
  info.onAdd = function() {
    var div = L.DomUtil.create("div", "legend");
    return div;
  };

  // Add the legend section to the map
  info.addTo(myMap);

  // Add the colors and the text to the legend
  document.querySelector(".legend").innerHTML = [
  '<i style="background:'+colorList[0]+'"></i> 6.0+ <br>',
  '<i style="background:'+colorList[1]+'"></i> 5.7 - 6.0 <br>',
  '<i style="background:'+colorList[2]+'"></i> 5.4 - 5.7 <br>',
  '<i style="background:'+colorList[3]+'"></i> 5.1 - 5.4 <br>',
  '<i style="background:'+colorList[4]+'"></i> 4.8 - 5.1 <br>',
  '<i style="background:'+colorList[5]+'"></i> 4.5 - 4.8 <br>',
  ].join("");

});