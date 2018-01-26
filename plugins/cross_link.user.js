// ==UserScript==
// @id             iitc-plugin-cross-links@mcben
// @name           IITC plugin: cross links
// @category       Layer
// @version        1.1.2.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Checks for existing links that cross planned links. Requires draw-tools plugin.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


window.plugin.crossLinks = function() {};


window.plugin.crossLinks.greatCircleArcIntersect = function (a0,a1,b0,b1) {

  // zero length line tests
  if (a0.equals(a1)) return false;
  if (b0.equals(b1)) return false;

  // lines have a common point
  if (a0.equals(b0) || a0.equals(b1)) return false;
  if (a1.equals(b0) || a1.equals(b1)) return false;

  // check for 'horizontal' overlap in lngitude
  if (Math.min(a0.lng,a1.lng) > Math.max(b0.lng,b1.lng)) return false;
  if (Math.max(a0.lng,a1.lng) < Math.min(b0.lng,b1.lng)) return false;

  // convert to 3d
  var ca0 = toCartesian(a0.lat, a0.lng),
      ca1 = toCartesian(a1.lat, a1.lng),
      cb0 = toCartesian(b0.lat, b0.lng),
      cb1 = toCartesian(b1.lat, b1.lng);

  // plane normales
  var da = cross(ca0, ca1); 
  var db = cross(cb0, cb1); 
  var da0 = cross(da, ca0); 
  var da1 = cross(da, ca1); 
  var db0 = cross(db, cb0);
  var db1 = cross(db, cb1);

  // the intersection line <=> collision point
  var p = cross(da, db); 
  normalize(p);

  // angels to positions
  var s = dot(p, da0);
  var d = dot(p, da1);
  var l = dot(p, db0);
  var f = dot(p, db1);

  if (s > 0 && d < 0 && l > 0 && f < 0) {
    return true;
  }

  if (s < 0 && d > 0 && l < 0 && f > 0) {
    // p inverted
    return true;
  }

  return false;
};

const d2r = Math.PI / 180;

let toCartesian= function(lat,lng) {
  lat *=d2r;
  lng *=d2r;
  var o = Math.cos(lat);
  return [o * Math.cos(lng), o * Math.sin(lng), Math.sin(lat)]
}

let cross= function (t, n) {
  return [t[1] * n[2] - t[2] * n[1], t[2] * n[0] - t[0] * n[2], t[0] * n[1] - t[1] * n[0]]
}

let normalize = function (t) {
  var n = 1/Math.sqrt(t[0] * t[0] + t[1] * t[1] + t[2] * t[2]);
  t[0] *= n, t[1] *= n, t[2] *= n
}

let dot = function(t, n) {
  return t[0] * n[0] + t[1] * n[1] + t[2] * n[2]
}
//////////////////////////////////////////////////////////


window.plugin.crossLinks.testPolyLine = function (polyline, link,closed) {

    let a = link.getLatLngs();
    let b = polyline.getLatLngs();

    for (var i=0;i<b.length-1;++i) {
      if (window.plugin.crossLinks.greatCircleArcIntersect(a[0],a[1],b[i],b[i+1])) return true;
    }

    if (closed) {
      if (window.plugin.crossLinks.greatCircleArcIntersect(a[0],a[1],b[b.length-1],b[0])) return true;
    }

    return false;
}

window.plugin.crossLinks.onLinkAdded = function (data) {
    if (window.plugin.crossLinks.disabled) return;

    plugin.crossLinks.testLink(data.link);
}

window.plugin.crossLinks.checkAllLinks = function() {
    if (window.plugin.crossLinks.disabled) return;

    plugin.crossLinks.linkLayer.clearLayers();
    plugin.crossLinks.linkLayerGuids = {};

    $.each(window.links, function(guid, link) {
        plugin.crossLinks.testLink(link);
    });
}

window.plugin.crossLinks.testLink = function (link) {
    if (plugin.crossLinks.linkLayerGuids[link.options.guid]) return;

    for (var i in plugin.drawTools.drawnItems._layers) { 
       var layer = plugin.drawTools.drawnItems._layers[i];
       if (layer instanceof L.GeodesicPolygon) {
           if (plugin.crossLinks.testPolyLine(layer, link,true)) {
               plugin.crossLinks.showLink(link);
               break;
           }
        } else if (layer instanceof L.GeodesicPolyline) {
            if (plugin.crossLinks.testPolyLine(layer, link)) {
                plugin.crossLinks.showLink(link);
                break;
            }
        }
    };
}


window.plugin.crossLinks.showLink = function(link) {

    var poly = L.geodesicPolyline(link.getLatLngs(), {
       color: '#d22',
       opacity: 0.7,
       weight: 5,
       clickable: false,
       dashArray: [8,8],

       guid: link.options.guid
    });

    poly.addTo(plugin.crossLinks.linkLayer);
    plugin.crossLinks.linkLayerGuids[link.options.guid]=poly;
}

window.plugin.crossLinks.onMapDataRefreshEnd = function () {
    if (window.plugin.crossLinks.disabled) return;

    window.plugin.crossLinks.linkLayer.bringToFront();

    window.plugin.crossLinks.testForDeletedLinks();
}

window.plugin.crossLinks.testAllLinksAgainstLayer = function (layer) {
    if (window.plugin.crossLinks.disabled) return;

    $.each(window.links, function(guid, link) {
        if (!plugin.crossLinks.linkLayerGuids[link.options.guid])
        {
            if (layer instanceof L.GeodesicPolygon) {
                if (plugin.crossLinks.testPolyLine(layer, link,true)) {
                    plugin.crossLinks.showLink(link);
                }
            } else if (layer instanceof L.GeodesicPolyline) {
                if (plugin.crossLinks.testPolyLine(layer, link)) {
                    plugin.crossLinks.showLink(link);
                }
            }
        }
    });
}

window.plugin.crossLinks.testForDeletedLinks = function () {
    window.plugin.crossLinks.linkLayer.eachLayer( function(layer) {
        var guid = layer.options.guid;
        if (!window.links[guid]) {
            plugin.crossLinks.linkLayer.removeLayer(layer);
            delete plugin.crossLinks.linkLayerGuids[guid];
        }
    });
}

window.plugin.crossLinks.createLayer = function() {
    window.plugin.crossLinks.linkLayer = new L.FeatureGroup();
    window.plugin.crossLinks.linkLayerGuids={};
    window.addLayerGroup('Cross Links', window.plugin.crossLinks.linkLayer, true);

    map.on('layeradd', function(obj) {
      if(obj.layer === window.plugin.crossLinks.linkLayer) {
        delete window.plugin.crossLinks.disabled;
        window.plugin.crossLinks.checkAllLinks();
      }
    });
    map.on('layerremove', function(obj) {
      if(obj.layer === window.plugin.crossLinks.linkLayer) {
        window.plugin.crossLinks.disabled = true;
        window.plugin.crossLinks.linkLayer.clearLayers();
        plugin.crossLinks.linkLayerGuids = {};
      }
    });

    // ensure 'disabled' flag is initialised
    if (!map.hasLayer(window.plugin.crossLinks.linkLayer)) {
        window.plugin.crossLinks.disabled = true;
    }
}

var setup = function() {
    if (window.plugin.drawTools === undefined) {
       alert("'Cross-Links' requires 'draw-tools'");
       return;
    }

    // this plugin also needs to create the draw-tools hook, in case it is initialised before draw-tools
    window.pluginCreateHook('pluginDrawTools');

    window.plugin.crossLinks.createLayer();

    // events
    window.addHook('pluginDrawTools',function(e) {
        if (e.event == 'layerCreated') {
            // we can just test the new layer in this case
            window.plugin.crossLinks.testAllLinksAgainstLayer(e.layer);
        } else {
            // all other event types - assume anything could have been modified and re-check all links
            window.plugin.crossLinks.checkAllLinks();
        }
    });

    window.addHook('linkAdded', window.plugin.crossLinks.onLinkAdded);
    window.addHook('mapDataRefreshEnd', window.plugin.crossLinks.onMapDataRefreshEnd);
}

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
