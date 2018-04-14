// Define the osMap variable

var osMap;

var COVE_LONG = 180964;
var COVE_LAT = 891029;

var left_island_offset = -846;   // pixels
var left_island_angle = 105;    // degrees
var triangulation_offset = -2618;
var triangulation_angle = 140.9;

var hills = [
    {name: "Sail Mhor", height: 767, lon: 203299.66490821, lat: 888706.16754589},
    {name: "An Teallach", height: 1060, lon: 206407.30236777, lat: 883686.36611983},
    {name: "Beinn Dearg Mor", height: 906, lon: 203211.86353608, lat: 879935.19828485},
    {name: "A' Mhaighdean", height: 967, lon: 200776.84972172, lat: 874892.68293556},
    {name: "Slioch", height: 980, lon: 200496.86796237, lat: 868874.02056833},
    {name: "Meall Mheinnidh", height: 722, lon: 195484.83281297, lat: 874848.31605644},
    {name: "Beinn Airigh Charr", height: 792, lon: 193029.83281297, lat: 876178.31605644},
    {name: "Meall a' Ghiuthais", height: 887, lon: 197609.83281297, lat: 863428.31605644},
    {name: "Ruadh-stac Mor", height: 1010, lon: 195141.56998945, lat: 861154.90166647},
    {name: "Sail Mhor (Beinn Eighe)", height: 980, lon: 193816.56998945, lat: 860584.90166647},
]


var pointToDegrees = function(map_point) {
    var dx = map_point.lon - COVE_LONG;
    var dy = map_point.lat - COVE_LAT;
    
    var distance = Math.sqrt((dx * dx) + (dy * dy));
    console.log('distance', distance);
    return Math.atan2(dx, dy) * 180 / Math.PI;
};


var degreesToPoint = function(degrees) {
    // pick some distance, then calculate x and y
    var drid_distance = 60000;
    var radians = degrees * Math.PI / 180;
    var dx = Math.sin(radians) * drid_distance;
    var dy = Math.cos(radians) * drid_distance;
    console.log('dx, dy', dx, dy);

    var map_point = {lon: COVE_LONG + dx,
                     lat: COVE_LAT + dy};
    return map_point;
}


var offsetToDegrees = function(offset) {
    // Pixels offset on horizon to compass bearing from Cove
    var offset_range = triangulation_offset - left_island_offset;
    var offset_fraction = (offset - left_island_offset) / offset_range;
    var angle = (offset_fraction * (triangulation_angle - left_island_angle)) + left_island_angle;
    return angle;
}

var degreesToOffset = function(degrees) {
    // Compass bearing from Cove to pixels offset for horizon
    var angle_fraction = (degrees - left_island_angle) / (triangulation_angle - left_island_angle);
    var offset_range = triangulation_offset - left_island_offset;
    var offset = (angle_fraction * offset_range) + left_island_offset;
    return offset;
}

var offsetHorizon = function(degrees) {

    var offset = degreesToOffset(degrees);
    console.log("OFFSET", offset);
    document.getElementById("image_canvas").style.left = offset + 'px';
    document.getElementById("scroll_container").style.left = '0px';
}


// This function creates the map and is called by the div in the HTML
function init() {

    "use strict"

    var lineStyle ={
        strokeColor: "#ff00ff",
        strokeOpacity: 1,
        strokeWidth: 2,
        fillColor: "#ff00ff",
        fillOpacity: 0
    };

    var options;
    var vectorLayer;

    // Run the init() setup...
    // Create new map...

    options = {resolutions: [2500, 1000, 500, 200, 100, 50, 25, 10, 5]};
    osMap = new OpenSpace.Map('map', options);
    // Set map centre in National Grid Eastings and Northings and select zoom level 0
    osMap.setCenter(new OpenSpace.MapPoint(COVE_LONG, COVE_LAT), 7);
    // Create a new vector layer
    vectorLayer = new OpenLayers.Layer.Vector("Vector Layer");
    osMap.addLayer(vectorLayer);
    

    var drawLineFromCoveToPoint = function(map_point) {
      
        var cove = new OpenLayers.Geometry.Point(COVE_LONG, COVE_LAT);
        var point = new OpenLayers.Geometry.Point(map_point.lon, map_point.lat);
        var linearRing = new OpenLayers.Geometry.LinearRing([cove, point]);
        var polygonFeature = new OpenLayers.Feature.Vector(linearRing, {}, lineStyle);

        vectorLayer.removeAllFeatures();
        vectorLayer.addFeatures([polygonFeature]);
        return polygonFeature;
    };


    var drag_start_x;
    var scroll_left;
    var image_frame = document.getElementById("image_frame");
    image_frame.addEventListener("dragstart", function( event ) {
        drag_start_x = event.pageX;
        scroll_left = parseInt(document.getElementById("scroll_container").style.left) || 0;
    }, false);
    image_frame.addEventListener("dragend", function( event ) {
        drag_start_x = event.pageX;
    }, false);
    image_frame.addEventListener("drag", function(event){
        if (event.pageX === 0) return;
        var drag_x = event.pageX - drag_start_x;
        document.getElementById("scroll_container").style.left = scroll_left + drag_x + 'px';
        event.preventDefault();
        return false;
    }, false);

    document.getElementById("image_canvas").addEventListener("click", function( event ) {
        console.log(event.offsetX, event.target);
        if (event.target.tagName.toLowerCase() === 'a') {
            // get the data-index attribute
            var hill_index = event.target.dataset.index;
            var hill = hills[hill_index];
            drawLineFromCoveToPoint(hill);
            offsetHorizon(pointToDegrees(hill));
            osMap.setCenter(new OpenSpace.MapPoint(hill.lon, hill.lat));
            return false;
        }
        // var click_left = event.offsetX 
        var degrees = offsetToDegrees(-event.offsetX);
        console.log('degrees', degrees);
        var pt = degreesToPoint(degrees);
        drawLineFromCoveToPoint(pt);
        offsetHorizon(degrees);
    }, false);

    // Define a clickcontrol to extend the OpenLayers.Control class.
    // From https://www.ordnancesurvey.co.uk/business-and-government/help-and-support/web-services/os-openspace/tutorials/stijn-html-context-menu-on-map-click.html
    var clickcontrol = new OpenLayers.Control();
    OpenLayers.Util.extend(clickcontrol, {
        // The draw method is called when the control is initialized
        draw: function () {
            // When mouse is clicked, we want to call the onClick method
            this.clickhandler = new OpenLayers.Handler.Click(this, {"click": this.onClick});
            this.clickhandler.activate();
        },
        onClick: function (event) {
            // The mouse position is converted into a map position via the Map.getLonLatFromViewportPx(). This returns a point in the coordinate system of the map base layer, in our case this is British National Grid.
            var pt = osMap.getLonLatFromViewPortPx(event.xy);
            console.log('click', pt);
            drawLineFromCoveToPoint(pt);
            var degrees = pointToDegrees(pt);
            console.log('DEGREES', degrees);
            offsetHorizon(degrees);
        },
    });

    // Add the clickcontrol to the map
    osMap.addControl(clickcontrol);

    // Add labels to horizon image
    var html = hills.map(function(hill, index){
        var offset = -degreesToOffset(pointToDegrees(hill));
        return "<a data-index='" + index + "' href='#' class='hill_label' style='left:" + offset + "px'>" + hill.name + "</a>";
    }).join("");
    console.log(html);
    document.getElementById("image_canvas").insertAdjacentHTML("beforeend", html);
}

