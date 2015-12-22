// Define the osMap variable

var osMap;

var editable;

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
        selectStyle: selectStyle,
    });
    osMap.addControl(selectControl);

    
    osMap.addLayer(vectorLayer);

    // When we finished drag-move, update the selected
    // sheets (won't have been selected if off-screen)
    osMap.events.register('moveend', null, function(event){
        var binary = getBinaryStringFromCheckboxes();
        selectSheets(binary);
    });


    var mouseCoords = {};
    $(osMap.getViewport())
    .on('mousemove', function(event) {
        var ft = vectorLayer.getFeatureFromEvent(event);
        if (ft) {
            $("#mapsList .checkbox").css('background', '#fff');
            var mapId = ft.attributes.id;
            $("#mapsList input[data-id='" + mapId + "']")
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
    .on('click', function(event) {
        if (event.clientX == mouseCoords.x && event.clientY == mouseCoords.y) {
            var ft = vectorLayer.getFeatureFromEvent(event);
            if (ft) {
                var mapId = ft.attributes.id;
                $("#mapsList input[data-id='" + mapId + "']").click();
            }
        }
    });
    
    // Draw rectangles - p is list of 
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
    
    var sheets = [];
    DATA.forEach(function(data){
        var sheetFeature = drawRect(data.coords, data.id);
        sheets.push(sheetFeature);
    });


    var chkboxes = DATA.map(function(data){
        return "<div class='checkbox'><label><input type='checkbox' data-id='" + data.id + "'>" + data.id + " " + data.name + "</label> </div>";
    });
    var html = chkboxes.join("");
    var form = document.getElementById('mapsList');
    form.innerHTML = html;


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

    // Listen for click events on the form that contains checkboxes.
    var handleCheck = function() {
        var binary = getBinaryStringFromCheckboxes();
        selectSheets(binary);

        // Save to localStorage
        saveToLocalStorage(binary);
    };
    form.addEventListener("click", handleCheck, false);


    var saveToLocalStorage = function(binaryString) {
        var h = binarytohex(binaryString);
        console.log("Saving: ", h);
        localStorage.setItem('landranger', h);

        // Validate that we can convert back to get same value
        var b = hextobinary(h);
        b = b.substr(0, binaryString.length);
        if (b !== binaryString) {
            console.log("Ooops! - BUG in converting to hex!");
            console.log(binaryString);
            console.log(b);
        }
    };

    var setCheckboxes = function setCheckboxes(binaryString) {

        getCheckboxes().forEach(function(checkbox, idx){
            if (binaryString[idx] === "1") {
                checkbox.checked = true;
            }
        });

    };


    $("#bookmark").click(function(event) {
        event.preventDefault();

        var binary = getBinaryStringFromCheckboxes();
        var h = binarytohex(binary);
        var count = getCheckedCount(binary);
        document.location.href = getUrlWithoutHash() + "#" + h;

        $("#sheetCount").html(count);
        $("#mapsListDialog").addClass("showBookmark");
        enableEditing(false);
    });

    $(".editAndSave").click(function(event) {
        event.preventDefault();

        // Save to localStorage
        var binary = getBinaryStringFromCheckboxes();
        saveToLocalStorage(binary);

        // Start editing (with no hash in url)
        document.location.href = getUrlWithoutHash();
        enableEditing(true);
    });

    $(".backToStored").click(function(event){
        // Start editing (with no hash in url)
        document.location.href = getUrlWithoutHash();
        enableEditing(true);
    });

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
    };

    // Also check for any hash from url
    var hash = location.href.split("#")[1];

    if (hash) {
        // Give warning about overwriting data set
        $("#warningModal").modal("show");
        $("#mapsListDialog").addClass("showReadonly");

        loadFromHex(hash);
        enableEditing(false);
    } else {
        // On Load, we check localStorage for data
        var h = localStorage.getItem('landranger', h);
        if (h) {
            loadFromHex(h);
        }
    }
  }
