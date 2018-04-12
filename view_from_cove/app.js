// Define the osMap variable

var osMap;

// This function creates the map and is called by the div in the HTML
function init() {

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
    osMap.setCenter(new OpenSpace.MapPoint(180964.5, 891029), 7);
    // Create a new vector layer
    vectorLayer = new OpenLayers.Layer.Vector("Vector Layer");
    osMap.addLayer(vectorLayer);

    

    var drawLine = function(centre) {
      
        console.log('drawLine', centre.lon, centre.lat);
        var cove = new OpenLayers.Geometry.Point(180964, 891029);
        var point = new OpenLayers.Geometry.Point(centre.lon, centre.lat);

        var dx = centre.lon - 180964;
        var dy = centre.lat - 891029;
        console.log('dx', dx)
        console.log('dy', dy)
        var degrees = Math.atan2(dx, dy) * 180 / Math.PI;

        offsetHorizon(degrees);

        var linearRing = new OpenLayers.Geometry.LinearRing([cove, point]);
        var polygonFeature = new OpenLayers.Feature.Vector(linearRing, {}, lineStyle);

        vectorLayer.addFeatures([polygonFeature]);
        return polygonFeature;
    };
    

    var offsetHorizon = function(degrees) {

        var left_island_offset = -846;   // pixels
        var left_island_angle = 105;    // degrees
        var triangulation_offset = -3501;
        var triangulation_angle = 158;

        var offset_range = triangulation_offset - left_island_offset;
        var angle_fraction = (degrees - left_island_angle) / (triangulation_angle - left_island_angle);
        var offset = (angle_fraction * offset_range) + left_island_offset;

        document.getElementById("image_canvas").style.left = offset + 'px';
    }




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
            pt = osMap.getLonLatFromViewPortPx(event.xy);
            console.log('click', pt);
            vectorLayer.removeAllFeatures();
            drawLine(pt);
        },
    });

    // Add the clickcontrol to the map
    osMap.addControl(clickcontrol);

}
