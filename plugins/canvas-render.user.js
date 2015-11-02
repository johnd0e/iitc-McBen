// ==UserScript==
// @id             iitc-plugin-canvas-render@jonatkins
// @name           IITC plugin: Use Canvas rendering
// @category       Tweaks
// @version        0.1.0.@@DATETIMEVERSION@@
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      @@UPDATEURL@@
// @downloadURL    @@DOWNLOADURL@@
// @description    [@@BUILDNAME@@-@@BUILDDATE@@] EXPERIMENTAL: use canvas-based rendering. Can be faster when viewing dense areas. Limited testing of the feature so far
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          unsafeWindow
// ==/UserScript==

@@PLUGINSTART@@

// PLUGIN START ////////////////////////////////////////////////////////

window.L_PREFER_CANVAS = true;

function testCanvasRendering() {

  if (!window.map.options.preferCanvas) {
    console.error("window.L_PREFER_CANVAS was not passed through in main." );
  }
  
  if (!isCanvasRenderingEnabled()) {
    dialog({
      title:'Canvas Render Warning',
      text:'The Canvas Rendering is not available.'
    });
  }
}

function isCanvasRenderingEnabled() {

  var testLayer = L.layerGroup();
  window.map.addLayer(testLayer);
  var renderer = window.map.getRenderer(testLayer);
  
  var result = (renderer instanceof L.Canvas);
  
  window.map.removeLayer(testLayer);
  delete testLayer;
  
  return result;
}

var setup =  testCanvasRendering;

// PLUGIN END //////////////////////////////////////////////////////////

@@PLUGINEND@@
