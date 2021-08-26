// Define the osMap variable

var osMap;

var COVE_LONG = 180964;
var COVE_LAT = 891029;

var left_island_offset = -892;   // pixels
var left_island_angle = 106.1;    // degrees
var triangulation_offset = -2618;
var triangulation_angle = 140.9;

var hills = [
    {name: "Sail Mhor", height: 767, lon: 203299.66490821, lat: 888706.16754589},
    {name: "An Teallach", height: 1060, lon: 206407.30236777, lat: 883686.36611983},
    {name: "Beinn Dearg Mor", height: 906, lon: 203211.86353608, lat: 879935.19828485},
    {name: "A' Mhaighdean", height: 967, lon: 200776.84972172, lat: 874892.68293556},
    {name: "Slioch", height: 980, lon: 200496.86796237, lat: 868874.02056833},
    {name: "Meall Mheinnidh", height: 722, lon: 195484.83281297, lat: 874848.31605644, className:'left'},
    {name: "Beinn Airigh Charr", height: 792, lon: 193029.83281297, lat: 876178.31605644},
    {name: "Meall a' Ghiuthais", height: 887, lon: 197609.83281297, lat: 863428.31605644},
    {name: "Ruadh-stac Mor", height: 1010, lon: 195141.56998945, lat: 861154.90166647},
    {name: "Sail Mhor (Beinn Eighe)", height: 980, lon: 193816.56998945, lat: 860584.90166647},
    {name: "Baosbheinn", height: 875, lon: 187061.56998945, lat: 865404.86400621},
    {name: "Sgurr Mor (Beinn Alligin)", height: 986, lon: 186556.61120169, lat: 861280.93552449},
]

var pointToDistance = function(map_point) {
    var dx = map_point.lon - COVE_LONG;
    var dy = map_point.lat - COVE_LAT;
    return Math.sqrt((dx * dx) + (dy * dy));
} 

var pointToDegrees = function(map_point) {
    var dx = map_point.lon - COVE_LONG;
    var dy = map_point.lat - COVE_LAT;
    return Math.atan2(dx, dy) * 180 / Math.PI;
};

var degreesToPoint = function(degrees) {
    // pick some distance, then calculate x and y
    var drid_distance = 60000;
    var radians = degrees * Math.PI / 180;
    var dx = Math.sin(radians) * drid_distance;
    var dy = Math.cos(radians) * drid_distance;
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


// This function creates the map and is called by the div in the HTML
function init() {

    "use strict"

    var vectorLayer;

    // Run the init() setup...
    // Create new map...

    var apiKey = 'YNN0DjzxNl9qWGu35kv7BkqRCqSmtsVz';

    var serviceUrl = 'https://api.os.uk/maps/raster/v1/zxy';

    // Setup the EPSG:27700 (British National Grid) projection.
    proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs");
    ol.proj.proj4.register(proj4);

    var tilegrid = new ol.tilegrid.TileGrid({
        resolutions: [896.0, 448.0, 224.0, 112.0, 56.0, 28.0, 14.0, 7.0, 3.5, 1.75],
        origin: [-238375.0, 1376256.0]
    });

    // Initialize the map object.
    var osMap = new ol.Map({
        layers: [
            new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: serviceUrl + '/Leisure_27700/{z}/{x}/{y}.png?key=' + apiKey,
                    projection: 'EPSG:27700',
                    tileGrid: tilegrid
                })
            })
        ],
        target: 'map',
        view: new ol.View({
            projection: 'EPSG:27700',
            extent: [-238375.0, 0.0, 900000.0, 1376256.0],
            resolutions: tilegrid.getResolutions(),
            minZoom: 0,
            maxZoom: 9,
            center: [COVE_LONG, COVE_LAT],
            zoom: 6
        })
    });

    // Add Vector layer for the sight-line
    vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#f0f',
                width: 2
            })
        })
    });
    osMap.addLayer(vectorLayer);


    var drawLineFromCoveToPoint = function(map_point) {
        var polygonFeature = new ol.Feature({
            id: 'line',
            geometry: new ol.geom.LineString([
                [COVE_LONG, COVE_LAT],
                [map_point.lon, map_point.lat]
            ])
        })
        vectorLayer.getSource().clear();
        vectorLayer.getSource().addFeature(polygonFeature);
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
            osMap.getView().setCenter([hill.lon, hill.lat]);
            return false;
        }
        var degrees = offsetToDegrees(-event.offsetX);
        console.log('degrees', degrees);
        var pt = degreesToPoint(degrees);
        drawLineFromCoveToPoint(pt);
        offsetHorizon(degrees);
    }, false);

    osMap.on("click", function(event){
        var coord = event.coordinate;
        var pt = { lon: coord[0], lat: coord[1]}
        drawLineFromCoveToPoint(pt);
        var degrees = pointToDegrees(pt);
        console.log('DEGREES', degrees);
        offsetHorizon(degrees);
    })

    // Add labels to horizon image
    var html = hills.map(function(hill, index){
        var offset = -degreesToOffset(pointToDegrees(hill));
        var distance = pointToDistance(hill) / 1000;   // km
        var miles = Math.round(0.621371 * distance);
        var style = "left:" + offset + "px";
        var className = "hill_label";
        if (hill.className === 'left') {
            style = "right: calc(100% - " + offset + "px)";
            className += " " + hill.className;
        }
        var label = hill.name + "<br/>" + hill.height + " m<br/>" + miles + " miles";
        return "<a data-index='" + index + "' href='#' class='" + className + "' style='" + style + "'>" + label + "</a>";
    }).join("");
    document.getElementById("image_canvas").insertAdjacentHTML("beforeend", html);
}

