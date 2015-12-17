console.log("DATA", DATA.length);

// Define the osMap variable

var osMap;

// This function creates the map and is called by the div in the HTML

function init() {

    var baseStyle ={
        strokeColor: "#ff00ff",
        strokeOpacity: 1,
        strokeWidth: 2,
        fillColor: "#ff00ff",
        fillOpacity: 0.1
    };
    var selectStyle = {
        strokeColor: "#ff00ff",
        strokeOpacity: 1,
        strokeWidth: 2,
        fillColor: "#ff00ff",
        fillOpacity: 0.4
    }
    
    // Create new map
    var options = {resolutions: [2500, 1000, 500, 200, 100, 50, 25, 10, 5]};
    osMap = new OpenSpace.Map('map', options);
    // Set map centre in National Grid Eastings and Northings and select zoom level 0
    osMap.setCenter(new OpenSpace.MapPoint(430000, 380000), 1);
    // Create a new vector layer to hold the polygon
    var vectorLayer = new OpenLayers.Layer.Vector("Vector Layer");

    // This works, but means that you can't drag the map around when over shapes
    var selectControl = new OpenLayers.Control.SelectFeature(vectorLayer, {
        multiple: true,
        clickout: true,
        toggle: true,
        // hover: true,
        selectStyle: selectStyle,
        // onSelect: onFeatureHover,
        // onUnselect: onFeatureHoverOff,
    });    
    osMap.addControl(selectControl);
    // selectControl.activate();

    // function onFeatureHover(feature) {
    //     // var name = feature.attributes.NAME;
    //     feature.style.fillOpacity = 0.1;

    //     console.log(feature, feature.style.fillOpacity);
    // }

    // function onFeatureHoverOff(feature) {
    //     // var name = feature.attributes.NAME;
    //     // feature.style.fillOpacity = 0.2;

    //     console.log(feature, feature.style.fillOpacity);
    // }  
    
    osMap.addLayer(vectorLayer);
    
    // Draw rectangles - p is list of 
    var drawRect = function(p) {
      
        var coords = [[p[0], p[1]],
                    [p[2], p[1]],
                    [p[2], p[3]],
                    [p[0], p[3]] ]
        var corners = coords.map(function(p){
            return new OpenLayers.Geometry.Point(p[0], p[1]);
        });
        var linearRing = new OpenLayers.Geometry.LinearRing(corners);
        var polygonFeature = new OpenLayers.Feature.Vector(linearRing, null, baseStyle);

        vectorLayer.addFeatures([polygonFeature]);
        return polygonFeature;
    };
    
    var sheets = [];
    DATA.forEach(function(data){
        var sheetFeature = drawRect(data.coords);
        sheets.push(sheetFeature);
    });


    var chkboxes = DATA.map(function(data){
        return "<div class='checkbox'><label><input type='checkbox' data-id='" + data.id + "'>" + data.id + " " + data.name + "</label> </div>";
    });

    var html = chkboxes.join("");

    var form = document.getElementById('mapsList');
    form.innerHTML = html;


    // select sheets by IDs
    var selectSheets = function(ids) {
        // Unselect, and activate
        selectControl.unselectAll();
        selectControl.activate();

        ids.forEach(function(sheetId){
            selectControl.select(sheets[sheetId]);
        });
        // deactivate again so we can drag map etc
        selectControl.deactivate();
    }


    // Listen for click events on the form that contains checkboxes.
    var handleCheck = function() {
        var inputs = document.getElementsByTagName("input");
        var checked = [];
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type == "checkbox") {
                if (inputs[i].checked) {
                    if (inputs[i].attributes['data-id']) {
                        var sheetId = inputs[i].attributes['data-id'].value;
                        checked.push(parseInt(sheetId, 10));
                    }
                }
            }
        }
        selectSheets(checked);
    }
    form.addEventListener("click", handleCheck, false);
  }
