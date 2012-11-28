dojo.require("esri.map");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.arcgis.utils");
dojo.require("esri.IdentityManager");
dojo.require("dijit.dijit");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.StackContainer");
dojo.require('esri.dijit.Attribution');
dojo.requireLocalization("esriTemplate", "template");

var map, urlObjects, i18n;

function initMap() {
    patchID();

    //get the localization strings
    i18n = dojo.i18n.getLocalization("esriTemplate", "template");

    dojo.byId('loading').innerHTML = i18n.viewer.loading.message;
    dojo.byId('legTogText').innerHTML = i18n.viewer.legToggle.down;
    dojo.byId('toolTogText').innerHTML = i18n.viewer.toolToggle.down;
    if (configOptions.geometryserviceurl && location.protocol === "https:") {
        configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:', 'https:');
    }
    esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);

    if (!configOptions.sharingurl) {
        configOptions.sharingurl = location.protocol + '//' + location.host + "/sharing/content/items";
    }
    esri.arcgis.utils.arcgisUrl = configOptions.sharingurl;

    if (!configOptions.proxyurl) {
        configOptions.proxyurl = location.protocol + '//' + location.host + "/sharing/proxy";
    }

    esri.config.defaults.io.proxyUrl = configOptions.proxyurl;

    esri.config.defaults.io.alwaysUseProxy = false;

    urlObject = esri.urlToObject(document.location.href);
    urlObject.query = urlObject.query || {};

    if (urlObject.query.title) {
        configOptions.title = urlObject.query.title;
    }
    if (urlObject.query.subtitle) {
        configOptions.title = urlObject.query.subtitle;
    }
    if (urlObject.query.webmap) {
        configOptions.webmap = urlObject.query.webmap;
    }
    if (urlObject.query.bingMapsKey) {
        configOptions.bingmapskey = urlObject.query.bingMapsKey;
    }

    var mapDeferred = esri.arcgis.utils.createMap(configOptions.webmap, "map", {
        mapOptions : {
            slider : true,
            sliderStyle : 'small',
            showAttribution : true,
            nav : false,
            wrapAround180 : true
        },
        ignorePopups : false,
        bingMapsKey : configOptions.bingmapskey
    });

    mapDeferred.addCallback(function(response) {

        document.title = configOptions.title || response.itemInfo.item.title || "";
        dojo.byId("title").innerHTML = configOptions.title || response.itemInfo.item.title || "";
        dojo.byId("subtitle").innerHTML = configOptions.subtitle || response.itemInfo.item.snippet || "";

        map = response.map;

        dojo.connect(map, "onUpdateEnd", function() {
            esri.hide(dojo.byId('loadingCon'));
        });

        var layers = response.itemInfo.itemData.operationalLayers;
        if (map.loaded) {
            initUI(layers);
            initFunctionality();
        } else {
            dojo.connect(map, "onLoad", function() {
                initUI(layers);
                initFunctionality(map);
            });
        }
        //resize the map when the browser resizes
        dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
    });

    mapDeferred.addErrback(function(error) {
        alert(i18n.viewer.errors.createMap + dojo.toJson(error.message));
    });

}

function initUI(layers) {
    //set symbology for gp service results
    //var gpResultSymbol = new esri.symbol.SimpleFillSymbol();
    //gpResultSymbol.setColor(new dojo.Color([0,255,0,0.5]));
    //map.graphics.setRenderer(new esri.renderer.SimpleRenderer(gpResultSymbol));
    
    
    //add chrome theme for popup
    dojo.addClass(map.infoWindow.domNode, "chrome");
    //add the scalebar
    var scalebar = new esri.dijit.Scalebar({
        map : map,
        scalebarUnit : i18n.viewer.main.scaleBarUnits //metric or english
    });

    var layerInfo = buildLayersList(layers);

    if (layerInfo.length > 0) {
        var legendDijit = new esri.dijit.Legend({
            map : map,
            layerInfos : layerInfo
        }, "legendDiv");
        legendDijit.startup();
    } else {
        dojo.byId('legendDiv').innerHTML = "";
    }
}

function buildLayersList(layers) {

    //layers  arg is  response.itemInfo.itemData.operationalLayers;
    var layerInfos = [];
    dojo.forEach(layers, function(mapLayer, index) {
        var layerInfo = {};
        if (mapLayer.featureCollection && mapLayer.type !== "CSV") {
            if (mapLayer.featureCollection.showLegend === true) {
                dojo.forEach(mapLayer.featureCollection.layers, function(fcMapLayer) {
                    if (fcMapLayer.showLegend !== false) {
                        layerInfo = {
                            "layer" : fcMapLayer.layerObject,
                            "title" : mapLayer.title,
                            "defaultSymbol" : false
                        };
                        if (mapLayer.featureCollection.layers.length > 1) {
                            layerInfo.title += " - " + fcMapLayer.layerDefinition.name;
                        }
                        layerInfos.push(layerInfo);
                    }
                });
            }
        } else if (mapLayer.showLegend !== false && mapLayer.layerObject) {
            var showDefaultSymbol = false;
            if (mapLayer.layerObject.version < 10.1 && (mapLayer.layerObject instanceof esri.layers.ArcGISDynamicMapServiceLayer || mapLayer.layerObject instanceof esri.layers.ArcGISTiledMapServiceLayer)) {
                showDefaultSymbol = true;
            }
            layerInfo = {
                "layer" : mapLayer.layerObject,
                "title" : mapLayer.title,
                "defaultSymbol" : showDefaultSymbol
            };
            //does it have layers too? If so check to see if showLegend is false
            if (mapLayer.layers) {
                var hideLayers = dojo.map(dojo.filter(mapLayer.layers, function(lyr) {
                    return (lyr.showLegend === false);
                }), function(lyr) {
                    return lyr.id;
                });
                if (hideLayers.length) {
                    layerInfo.hideLayers = hideLayers;
                }
            }
            layerInfos.push(layerInfo);
        }
    });
    return layerInfos;
}

function patchID() {//patch id manager for use in apps.arcgis.com
    esri.id._isIdProvider = function(server, resource) {
        // server and resource are assumed one of portal domains

        var i = -1, j = -1;

        dojo.forEach(this._gwDomains, function(domain, idx) {
            if (i === -1 && domain.regex.test(server)) {
                i = idx;
            }
            if (j === -1 && domain.regex.test(resource)) {
                j = idx;
            }
        });

        var retVal = false;

        if (i > -1 && j > -1) {
            if (i === 0 || i === 4) {
                if (j === 0 || j === 4) {
                    retVal = true;
                }
            } else if (i === 1) {
                if (j === 1 || j === 2) {
                    retVal = true;
                }
            } else if (i === 2) {
                if (j === 2) {
                    retVal = true;
                }
            } else if (i === 3) {
                if (j === 3) {
                    retVal = true;
                }
            }
        }

        return retVal;
    };
}

//Jquery Layout
$(document).ready(function(e) {
    $("#legendToggle").click(function() {
        if ($("#legendDiv").css('display') == 'none') {
            $("#legTogText").html(i18n.viewer.legToggle.up);
        } else {
            $("#legTogText").html(i18n.viewer.legToggle.down);
        }
        $("#legendDiv").slideToggle();
    });
    $("#toolToggle").click(function() {
        if ($("#toolDiv").css('display') == 'none') {
            $("#toolTogText").html(i18n.viewer.toolToggle.up);
        } else {
            $("#toolTogText").html(i18n.viewer.toolToggle.down);
        }
        $("#toolDiv").slideToggle();
    });
});
