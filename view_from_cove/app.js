// Define the osMap variable

var osMap;

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

    var COVE_LONG = 180964;
    var COVE_LAT = 891029;

    var left_island_offset = -846;   // pixels
    var left_island_angle = 105;    // degrees
    var triangulation_offset = -2618;
    var triangulation_angle = 140.9;

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
        document.getElementById("image_canvas").style.left = offset + 'px';
        document.getElementById("scroll_container").style.left = '0px';
    }


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
            drawLineFromCoveToPoint(pt);
            offsetHorizon( pointToDegrees(pt) );
        },
    });

    // Add the clickcontrol to the map
    osMap.addControl(clickcontrol);

}
