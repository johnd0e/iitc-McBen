// ==UserScript==
// @id             iitc-plugin-basemap-osm_tjanster@mcben
// @name           IITC plugin: OpenStreetMap.se (Tjänster) map tiles
// @category       Map Tiles
// @version        0.1.1.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] Add OpenStreetMap.se map tiles as an optional layer.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.mapTileOpenStreetMapTjanster = {
  addLayer: function() {

    var osmOpt = {
      attribution: '&copy; <a href="http://openstreetmap.se">Tj&auml;nstr</a> contributors',
      maxZoom: 18,
      subdomains: 'abc'
    };

    var layers = {
      'http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png': 'Tj&auml;nstr full',
      'http://{s}.tile.openstreetmap.se/osm/{z}/{x}/{y}.png': 'Tj&auml;nstr OSM'
    };

    for(var url in layers) {
      var layer = new L.TileLayer(url, osmOpt);
      layerChooser.addBaseLayer(layer, layers[url]);
    }
  },
};

var setup =  window.plugin.mapTileOpenStreetMapTjanster.addLayer;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
