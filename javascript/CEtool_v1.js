function initFunctionality(){
    defaultReportForm()
    initSelectionToolbar(map);
    
    var queryTask = new esri.tasks.QueryTask("http://sandbox.maps.bcgov/arcserver/rest/services/CEAMF/MuleDeer/MapServer/0");
 var queryTaskTouches = new esri.tasks.QueryTask("http://sandbox.maps.bcgov/arcserver/rest/services/CEAMF/MuleDeer/MapServer/0");
    //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
    //If this null or not available the buffer operation will not work.  Otherwise it will do a http post to the proxy.
    //esriConfig.defaults.io.proxyUrl = "http://184.173.193.97/~braeuer/temporary4work/proxy.php";
    //esriConfig.defaults.io.alwaysUseProxy = false;

    // Query
    var query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outFields = ["RISK"];
    var infoTempContent = "POP2007 = ${RISK}<br/>"
    + "<br/><A href='#' onclick='map.graphics.clear();map.infoWindow.hide();'>Remove Selected Features</A>";
    //Create InfoTemplate for styling the result infowindow.
    var infoTemplate = new esri.InfoTemplate("Block: ${RISK}", infoTempContent);
    map.infoWindow.resize(275,190);

    var currentClick = null;
    // +++++Listen for map onClick event+++++
    dojo.connect(map, "onClick", function(evt) {
        map.graphics.clear();
        map.infoWindow.hide();
        currentClick = query.geometry = evt.mapPoint;
        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
        queryTask.execute(query);
        //dojo.byId('messages').innerHTML = "<b>Executing Point Intersection Query...</b>";
        dojo.byId('loading').innerHTML = "Executing Point Intersection Query...";
        esri.show(dojo.byId('loadingCon'));
    });

    var firstGraphic = null;
    // +++++Listen for QueryTask onComplete event+++++
    dojo.connect(queryTask, "onComplete", function(graphics) {
        firstGraphic = graphics.features[0];
        var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new dojo.Color([0,255,255]), 3), new dojo.Color([255,0,0,0.0]));
        firstGraphic.setSymbol(symbol);
        firstGraphic.setInfoTemplate(infoTemplate);

        map.graphics.add(firstGraphic);
        query.geometry = esri.geometry.webMercatorToGeographic(firstGraphic.geometry);
        query.spatialRelationship = esri.tasks.Query.SPATIAL_REL_TOUCHES;
        //queryTaskTouches.execute(query);
 
 

    //dojo.byId('messages').innerHTML = "<b>Executing Polygon Touches Query...</b>";

    });
    // +++++Listen for QueryTask executecomplete event+++++
    dojo.connect(queryTaskTouches, "onComplete", function(fset) {
        var symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new dojo.Color([0,100,100]), 2), new dojo.Color([0,0,255,0.20]));

        var resultFeatures = fset.features;
        for (var i=0, il=resultFeatures.length; i<il; i++) {
            var graphic = resultFeatures[i];
            graphic.setSymbol(symbol);
            graphic.setInfoTemplate(infoTemplate);
            map.graphics.add(graphic);
        }
          
        map.infoWindow.setTitle("Comparing " + firstGraphic.attributes.RISK + " census block group with surrounding block groups");
        var content = "<table border='1'><th><td>Selected</td><td>Average Surrounding</td></th>"
        + "<tr><td>Pop 2007</td><td>" + firstGraphic.attributes.RISK + "</td><td>" + firstGraphic.attributes.RISK + "</td></tr>"
        + "<tr><td>Pop 2000</td><td>" + firstGraphic.attributes.RISK + "</td><td>" + firstGraphic.attributes.RISK + "</td></tr>"
        + "<tr><td>Males</td><td>" + firstGraphic.attributes.RISK + "</td><td>" + firstGraphic.attributes.RISK + "</td></tr>"
        + "<tr><td>Females</td><td>" + firstGraphic.attributes.RISK + "</td><td>" + firstGraphic.attributes.RISK + "</td></tr>"
        + "</table>";
        map.infoWindow.setContent(content);
        map.infoWindow.show(map.toScreen(currentClick),map.getInfoWindowAnchor(map.toScreen(currentClick)));
          
        dojo.byId('loading').innerHTML = "Done";
        //esri.hide(dojo.byId('loadingCon'));
    });

}
function average(fset, att) {
    var features = fset.features;
    var sum = 0;
    var featuresLength = features.length;
    for (var x = 0; x < featuresLength; x++) {
        sum = sum + features[x].attributes[att];
    }
    return Math.round(sum/featuresLength);
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
    query.geometry = esri.geometry.webMercatorToGeographic(aoiGraphic.geometry);
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
