function createReport() {
    alert("dgkslgj");
}

function initSelectionToolbar(myMap) {
    selectionToolbar = new esri.toolbars.Draw(map);
    dojo.connect(selectionToolbar, "onDrawEnd", function(geometry) {
        selectionToolbar.deactivate();
        var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 255, 0, 0.25]));
        var graphic = new esri.Graphic(geometry, symbol);
        map.graphics.add(graphic);
        document.getElementById("btnReport").disabled = false;

    });
}

function AOIFormElements() {
    defaultReportForm();
    var AOIValue = document.getElementById("selAOI").value
    if (AOIValue == "draw") {
        setVis("show", "divDraw");
    }
    else{
        setVis("hide", "divDraw");
    }
}

function defaultReportForm() {
    var divs = ["divDraw"];
    for (var i = 0; i < divs.length; i++) {
        setVis("hide", divs[i]);
    }
}

function setVis(mode, element) {
    if (mode == "show") {
        if (document.all) {
            document.all[element].style.visibility = "visible";
            //document.all[element].style.display = "block";
        } else if (document.layers) {
            document.layers[element].visibility = "show";
           // document.layers[element].display = "block";
        } else if (document.getElementById) {
            document.getElementById(element).style.display = "block";
        }
    }
    if (mode == "hide") {
        if (document.all) {
            document.all[element].style.visibility = "hidden";
            //document.all[element].style.display = "none";
        } else if (document.layers) {
            document.layers[element].visibility = "hide";
           // document.layers[element].display = "none";
        } else if (document.getElementById) {
            document.getElementById(element).style.display = "none";
                        
        }
    }
}
function createReport(){
    alert("report");
    document.getElementById("btnReport").disabled = true;
    var transitDistUnit = new esri.tasks.LinearUnit();
    transitDistUnit.distance = 1;
    transitDistUnit.units = "esriMiles";
    var highwayDistUnit = new esri.tasks.LinearUnit();
    highwayDistUnit.distance = .5;
    highwayDistUnit.units = "esriMiles";
    gpTask.execute( {
        dist_transit:transitDistUnit,
        dist_highways:highwayDistUnit
    }, showResults); 
}
function showResults(resultsParam) {

    dojo.forEach(resultsParam[0].value.features, function(feature){
        map.graphics.add(feature);
        var featExtent = feature.geometry.getExtent();
        map.setExtent(featExtent);
    })
}    
