// helper
global.includeJS = function (f) {
  var res = require(f);
  for (p in window) { global[p]=window[p]; };
  return res;
}

// Simulate Browser Enviroment
var fs = require('fs');
var jsdom = require('jsdom');
var html  = fs.readFileSync(__dirname+'/../test_data/IngressIntelMap.html').toString()
navigator = {userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0'};
global.document = jsdom.jsdom(html, {url: "https://www.ingress.com/intel"});
global.window = document.defaultView;


// jquery
global.$ = window.jQuery = require('jquery');

// Leaflet
L=require('../../external/leaflet-src');

// iitc environment
window.plugin = {};

// iitc-code
includeJS('./main_win')

// iitc boot code
isLayerGroupDisplayed = function() {};
layerChooser = new L.Control.Layers();

// FIXME: looks like "L.DomUtil" is running in a wrong context
// NOT_OKAY: console.log( L.DomUtil.get('map') );
// OKAY: console.log( document.getElementById('map') !== null);
/*map = new L.Map('map', {
    center: [0,0],
    zoom: 1,
    zoomControl: true,
    minZoom: 3,
    markerZoomAnimation: false,
    bounceAtZoomLimits: false
  });
*/