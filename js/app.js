// Define the osMap variable

var osMap;

var editable;

var STORAGE_KEY = "dads_maps";

// This function creates the map and is called by the div in the HTML

function init() {

    var baseStyle ={
        strokeColor: "#ff00ff",
        strokeOpacity: 1,
        strokeWidth: 2,
        fillColor: "#ff00ff",
        fillOpacity: 0
    };
    var selectStyle = {
        strokeColor: "#ff00ff",
        strokeOpacity: 1,
        strokeWidth: 2,
        fillColor: "#ff00ff",
        fillOpacity: 0.3
    };


    var options;
    var vectorLayer;
    var selectControl;
    var sheets = [];

    // define various functions...

    // Draw rectangles - p is list of x, y, x2, y2
    var drawRect = function(p, id) {
      
        var coords = [[p[0], p[1]],
                    [p[2], p[1]],
                    [p[2], p[3]],
                    [p[0], p[3]] ];
        var corners = coords.map(function(p){
            return new OpenLayers.Geometry.Point(p[0], p[1]);
        });
        var linearRing = new OpenLayers.Geometry.LinearRing(corners);
        var polygonFeature = new OpenLayers.Feature.Vector(linearRing, {'id': id}, baseStyle);

        vectorLayer.addFeatures([polygonFeature]);
        return polygonFeature;
    };

    // select sheets with string "100010010..." etc
    var selectSheets = function(binaryString) {
        selectControl.unselectAll();
        sheets.forEach(function(sheet, idx) {
            if (binaryString[idx] === "1") {
                selectControl.select(sheet);
            }
        });
    };

    // Returns a string of 6 hex characters from a number 0 - 16777215.
    // E.g. 16777215 -> "ffffff"
    // E.g. 2 -> "000002"  (adds padding)
    var b2hex = function(b) {
        // the 24-shifted bit gives us padding and is removed by substr
        return ((1 << 24) + b).toString(16).substr(1);
    };

    var binarytohex = function(binary) {
        binary = binary.split("").reverse().join("");
        var chunk;
        var hexes = [];
        while (binary.length > 0) {
            chunk = binary.substr(binary.length - 24);
            binary = binary.substr(0, binary.length - 24);
            var digit = parseInt(chunk, 2);
            var hex = b2hex(digit);
            hexes.push(hex);
        }
        hexes.reverse();
        return hexes.join("");
    };

    // Returns a 24-length binary number with padding
    // E.g. 5 -> "000000000000000000000101"
    var dig2bin = function(digital) {
        return (16777216 + digital).toString(2).substr(1);
    };
    var hextobinary = function(hex) {
        var chunk, binary;
        var binaries = [];
        while (hex.length > 0) {
            chunk = hex.substr(hex.length - 6);
            hex = hex.substr(0, hex.length - 6);
            binary = parseInt(chunk, 16);
            binaries.push(dig2bin(binary));
        }
        binaries.reverse();
        binary = binaries.join("");
        binary = binary.split("").reverse().join("");
        return binary;
    };


    var getCheckboxes = function() {
        var checkboxes = [];
        var inputs = document.getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i++) {
            if (inputs[i].type == "checkbox" && inputs[i].attributes['data-id']) {
                checkboxes.push(inputs[i]);
            }
        }
        return checkboxes;
    };

    var getBinaryStringFromCheckboxes = function() {
        var checkboxes = getCheckboxes();
        var binary = checkboxes.map(function(checkbox){
            if (checkbox.checked) {
                return "1";
            }
            return "0";
        });
        binary = binary.join("");
        return binary;
    };

    var getCheckedCount = function(binaryString) {
        var count = binaryString.split("").reduce(function(prev, bit){
            if (bit === "1") return prev + 1;
            return prev;
        }, 0);
        return count;
    };

    var setLocalStorage = function(binaryString) {
        var h = binarytohex(binaryString);
        console.log("Saving: ", h);
        localStorage.setItem(STORAGE_KEY, h);

        // Validate that we can convert back to get same value
        var b = hextobinary(h);
        b = b.substr(0, binaryString.length);
        if (b !== binaryString) {
            console.log("Ooops! - BUG in converting to hex!");
            console.log(binaryString);
            console.log(b);
        }
    };

    var getLocalStorage = function() {
        return localStorage.getItem(STORAGE_KEY, h);
    };

    var setCheckboxes = function(binaryString) {
        // Non-jQuery selection of checkbox DOM elements
        getCheckboxes().forEach(function(checkbox, idx){
            if (binaryString[idx] === "1") {
                checkbox.checked = true;
            }
        });
    };

    var getUrlWithoutHash = function() {
        var url = location.href;
        return url.split("#")[0];
    };

    var enableEditing = function(canEdit) {

        editable = canEdit;

        getCheckboxes().forEach(function(checkbox, idx){
            checkbox.disabled = !editable;
        });

        if (canEdit) {
            $("#mapsListDialog").removeClass("showBookmark");
        }
    };


    var loadFromHex = function(hex) {
        var b = hextobinary(hex);
        setCheckboxes(b);
        selectSheets(b);
        return b;
    };
    

    // Run the init() setup...
    // Create new map...

    options = {resolutions: [2500, 1000, 500, 200, 100, 50, 25, 10, 5]};
    osMap = new OpenSpace.Map('map', options);
    // Set map centre in National Grid Eastings and Northings and select zoom level 0
    osMap.setCenter(new OpenSpace.MapPoint(430000, 380000), 1);
    // Create a new vector layer to hold the polygon
    vectorLayer = new OpenLayers.Layer.Vector("Vector Layer");

    // This creates a 'selectControl' we can use later for setting a sheet as 'selected'
    selectControl = new OpenLayers.Control.SelectFeature(vectorLayer, {
        selectStyle: selectStyle,
    });
    osMap.addControl(selectControl);
    osMap.addLayer(vectorLayer);

    // Draw all the sheets, adding them to vectorLayer. We add the features
    // to a list for subsequent selection.
    DATA.forEach(function(data){
        var sheetFeature = drawRect(data.coords, data.id);
        sheets.push(sheetFeature);
    });

    // When we finished drag-move, update the selected
    // sheets (won't have been selected if off-screen)
    osMap.events.register('moveend', null, function(event){
        var binary = getBinaryStringFromCheckboxes();
        selectSheets(binary);
    });

    // Use jQuery to listen for events on map viewport, triggered by the map
    var mouseCoords = {};
    $(osMap.getViewport())
    // When we move over a sheet, highlight the corresponding checkbox & name
    // and focus the checkbox so that the list scrolls to show it.
    .on('mousemove', function(event) {
        var ft = vectorLayer.getFeatureFromEvent(event);
        if (ft) {
            $("#mapsList .checkbox").css('background', '#fff');
            var mapId = ft.attributes.id;
            // we will only try to focus etc if list is showing (.showBody)
            $(".showBody input[data-id='" + mapId + "']")
                .focus()
                .parent().parent().css('background', '#ddf');
        }
    })
    // We want to know if the 'click' is really a click or a drag-end,
    // so we check if the location is same as mousedown.
    .on('mousedown', function(event) {
        mouseCoords.x = event.clientX;
        mouseCoords.y = event.clientY;
    })
    // If this is a real click (same location as mousedown) then we click()
    // the corresponding checkbox to toggle sheet selection.
    .on('click', function(event) {
        if (event.clientX == mouseCoords.x && event.clientY == mouseCoords.y) {
            var ft = vectorLayer.getFeatureFromEvent(event);
            if (ft) {
                var mapId = ft.attributes.id;
                $("#mapsList input[data-id='" + mapId + "']").click();
            }
        }
    });

    // We build the checkbox list html from the sheet DATA
    var chkboxes = DATA.map(function(data){
        var chbxHtml = "" +
        "<div class='checkbox'><label>" +
            "<input type='checkbox' data-id='" + data.id + "'>" + data.id + " " + data.name +
        "</label> </div>";
        return chbxHtml;
    });
    var html = chkboxes.join("");
    var form = document.getElementById('mapsList');
    form.innerHTML = html;


    // Listen for click events on the form that contains checkboxes.
    form.addEventListener("click", function() {
        var binary = getBinaryStringFromCheckboxes();
        selectSheets(binary);

        // Save to localStorage
        setLocalStorage(binary);
    }, false);


    // Button for setting the hash as the url
    $("#bookmark").click(function(event) {
        event.preventDefault();

        if ($(".readonlyMessage").is(":visible")) {
            return;
        }

        var binary = getBinaryStringFromCheckboxes();
        var h = binarytohex(binary);
        var count = getCheckedCount(binary);
        document.location.href = getUrlWithoutHash() + "#" + h;

        $("#sheetCount").html(count);
        $("#mapsListDialog").addClass("showBookmark");
        enableEditing(false);
    });

    // 'Edit and Save' button shown when we're looking at list from url hash
    $(".editAndSave").click(function(event) {
        event.preventDefault();

        // Save to localStorage
        var binary = getBinaryStringFromCheckboxes();
        setLocalStorage(binary);

        // Start editing (with no hash in url)
        document.location.href = getUrlWithoutHash();
        enableEditing(true);
    });

    $(".backToStored").click(function(event){
        // Start editing (with no hash in url)
        document.location.href = getUrlWithoutHash();
        enableEditing(true);
    });

    $("#collapseList").click(function(event){
        event.preventDefault();
        $("#mapsListDialog").toggleClass("showBody");
    });

    // On Load, we check for any hash from url
    var hash = location.href.split("#")[1];

    if (hash) {
        // Give warning about overwriting data set
        $("#warningModal").modal("show");
        $("#mapsListDialog").addClass("showReadonly");

        var binaryStr = loadFromHex(hash);
        var newCount = getCheckedCount(binaryStr);
        $(".newSheetCount").html(newCount);
        enableEditing(false);
    } else {
        // Otherwise, we check localStorage for data
        var h = getLocalStorage();
        if (h) {
            loadFromHex(h);
        }
    }
}
