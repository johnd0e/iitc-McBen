// ==UserScript==
// @id             iitc-plugin-link-show-direction
// @name           IITC plugin: Show the direction of links on the map
// @category       Tweaks
// @version        0.1.0.20140909.63414
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2014-09-09-063414] Show the direction of links on the map by adding short dashes to the line at the origin portal.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'mobile';
plugin_info.dateTimeVersion = '20140909.63414';
plugin_info.pluginId = 'link-show-direction';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.linkShowDirection = function() {};

window.plugin.linkShowDirection.ANIMATE_UPDATE_TIME=1;
window.plugin.linkShowDirection.frames = [
  '10,5,5,5,5,5,5,5,100%',
//  '11,5,5,5,5,5,5,4,100%',
  '12,5,5,5,5,5,5,3,100%',
//  '13,5,5,5,5,5,5,2,100%',
  '14,5,5,5,5,5,5,1,100%',
//  '15,5,5,5,5,5,100%',
  '10,1,5,5,5,5,5,5,100%',
//  '10,2,5,5,5,5,5,5,100%',
  '10,3,5,5,5,5,5,5,100%',
//  '10,4,5,5,5,5,5,5,100%',
];

window.plugin.linkShowDirection.frame = 0;
window.plugin.linkShowDirection.moving = false;


window.plugin.linkShowDirection.animateLinks = function() {
  if (!window.plugin.linkShowDirection.moving) {
    window.plugin.linkShowDirection.frame ++;
    window.plugin.linkShowDirection.frame %= window.plugin.linkShowDirection.frames.length;

    $.each(links,function(guid,link) { window.plugin.linkShowDirection.addLinkStyle(link); });
  }

  // browsers don't render the SVG style changes until after the timer function has finished.
  // this means if we start the next timeout in here a lot of the delay time will be taken by the browser itself
  // re-rendering the screen. in the worst case, the timer will run out before the render completes, and fire immediately
  // this would mean the user has no chance to interact with IITC
  // to prevent this, create a short timer that then sets the timer for the next frame. if the browser is slow to render,
  // the short timer should fire later, at which point the desired ANIMATE_UPDATE_TIME timer is started
  setTimeout ( function() { setTimeout (window.plugin.linkShowDirection.animateLinks, window.plugin.linkShowDirection.ANIMATE_UPDATE_TIME*1000); }, 10);

}


window.plugin.linkShowDirection.addLinkStyle = function(link) {
  link.setStyle ({dashArray: window.plugin.linkShowDirection.frames[window.plugin.linkShowDirection.frame]});
}

window.plugin.linkShowDirection.setup  = function() {

  addHook ('linkAdded', function(data) { window.plugin.linkShowDirection.addLinkStyle (data.link); });

  // only start the animation timer of the paths support SVG
  if (L.Path.SVG) {
    setTimeout (window.plugin.linkShowDirection.animateLinks, window.plugin.linkShowDirection.ANIMATE_UPDATE_TIME*1000);

    // set up move start/end handlers to pause animations while moving
    map.on('movestart', function() { window.plugin.linkShowDirection.moving = true; });
    map.on('moveend', function() { window.plugin.linkShowDirection.moving = false; });

  }
};

var setup =  window.plugin.linkShowDirection.setup;

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


