function initFunctionality(){
    defaultReportForm()
    initSelectionToolbar();
    
    var queryTask = new esri.tasks.QueryTask("http://sandbox.maps.bcgov/arcserver/rest/services/CEAMF/MuleDeerUWR/MapServer/0");
    //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.        
    ////If this null or not available the buffer operation will not work.  Otherwise it will do a http post to the proxy.
    esri.config.defaults.io.proxyUrl = "http://sandbox.maps.bcgov/test/Proxy/proxy.ashx";        
    esri.config.defaults.io.alwaysUseProxy = false;
    
    var query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outFields = ["RISK"];
    query.outSpatialReference = {
        "wkid":map.spatialReference.wkid
    }; 
    var queryGraphic = null;
    // +++++Listen for QueryTask onComplete event+++++
    dojo.connect(queryTask, "onComplete", function(graphics) {
        alert("queryComplete");
        queryGraphic = graphics.features[0];
        var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new dojo.Color([100,100,100]), 3), new dojo.Color([255,0,0,0.20]));
        queryGraphic.setSymbol(symbol);
    //queryGraphic.setInfoTemplate(infoTemplate);

    });

}

function initSelectionToolbar() {
    selectionToolbar = new esri.toolbars.Draw(map);
    dojo.connect(selectionToolbar, "onDrawEnd", function(geometry) {
        selectionToolbar.deactivate();
        var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASHDOT, new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 255, 0, 0.25]));
        aoiGraphic = new esri.Graphic(geometry, symbol);
        map.graphics.add(aoiGraphic);
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
    alert(aoiGraphic.geometry);
    query.geometry = aoiGraphic.geometry;
    alert("report2");
    query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
    queryTask.execute(query);
    alert("executing, I think");
  
}
function showResults(featureSet) {
    map.graphics.clear();
    var queryFeatures = featureSet.features;
    for (var i=0; i < queryFeatures.length; i++) {
        queryFeatures[i].setSymbol(querySymbol);
        map.graphics.add(queryFeatures[i]);
    }
}  
