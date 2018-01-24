/// SETUP /////////////////////////////////////////////////////////////
// these functions set up specific areas after the boot function
// created a basic framework. All of these functions should only ever
// be run once.

window.setupLargeImagePreview = function() {
  $('#portaldetails').on('click', '.imgpreview', function() {
    var img = $(this).find('img')[0];
    var details = $(this).find('div.portalDetails')[0];
    //dialogs have 12px padding around the content
    var dlgWidth = Math.max(img.naturalWidth+24,500);
    if (details) {
      dialog({
        html: '<div style="text-align: center">' + img.outerHTML + '</div>' + details.outerHTML,
        title: $(this).parent().find('h3.title').text(),
        width: dlgWidth,
      });
    } else {
      dialog({
        html: '<div style="text-align: center">' + img.outerHTML + '</div>',
        title: $(this).parent().find('h3.title').text(),
        width: dlgWidth,
      });
    }
  });
}


window.setupStyles = function() {
  $('head').append('<style>' +
    [ '#largepreview.enl img { border:2px solid '+COLORS[TEAM_ENL]+'; } ',
      '#largepreview.res img { border:2px solid '+COLORS[TEAM_RES]+'; } ',
      '#largepreview.none img { border:2px solid '+COLORS[TEAM_NONE]+'; } ',
      '#chatcontrols { bottom: '+(CHAT_SHRINKED+22)+'px; }',
      '#chat { height: '+CHAT_SHRINKED+'px; } ',
      '.leaflet-right { margin-right: '+(SIDEBAR_WIDTH+1)+'px } ',
      '#updatestatus { width:'+(SIDEBAR_WIDTH+2)+'px;  } ',
      '#sidebar { width:'+(SIDEBAR_WIDTH + HIDDEN_SCROLLBAR_ASSUMED_WIDTH + 1 /*border*/)+'px;  } ',
      '#sidebartoggle { right:'+(SIDEBAR_WIDTH+1)+'px;  } ',
      '#scrollwrapper  { width:'+(SIDEBAR_WIDTH + 2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH)+'px; right:-'+(2*HIDDEN_SCROLLBAR_ASSUMED_WIDTH-2)+'px } ',
      '#sidebar > * { width:'+(SIDEBAR_WIDTH+1)+'px;  }'].join("\n")
    + '</style>');
}




window.setupMap = function() {
  $('#map').text('');


  // proper initial position is now delayed until all plugins are loaded and the base layer is set
  window.map = new L.Map('map', {
    center: [0,0],
    zoom: 1,
    zoomControl: (typeof android !== 'undefined' && android && android.showZoom) ? android.showZoom() : true,
    minZoom: MIN_ZOOM,
//    zoomAnimation: false,
    markerZoomAnimation: false,
    bounceAtZoomLimits: false,
    preferCanvas: (window.L_PREFER_CANVAS ? true : false)
  });

  if (L.Path.CANVAS) {
    // for canvas, 2% overdraw only - to help performance
    L.Path.CLIP_PADDING = 0.02;
  } else if (L.Path.SVG) {
    if (L.Browser.mobile) {
      // mobile SVG - 10% ovredraw. might help performance?
      L.Path.CLIP_PADDING = 0.1;
    } else {
      // for svg, 100% overdraw - so we have a full screen worth in all directions
      L.Path.CLIP_PADDING = 1.0;
    }
  }

  // add empty div to leaflet control areas - to force other leaflet controls to move around IITC UI elements
  // TODO? move the actual IITC DOM into the leaflet control areas, so dummy <div>s aren't needed
  if(!isSmartphone()) {
    // chat window area
    $(window.map._controlCorners['bottomleft']).append(
      $('<div>').width(708).height(108).addClass('leaflet-control').css({'pointer-events': 'none', 'margin': '0'}));
  }

  setupLayers();


  map.attributionControl.setPrefix('');
  // listen for changes and store them in cookies
  map.on('moveend', window.storeMapPosition);

  map.on('moveend', function(e) {
    // two limits on map position
    // we wrap longitude (the L.LatLng 'wrap' method) - so we don't find ourselves looking beyond +-180 degrees
    // then latitude is clamped with the clampLatLng function (to the 85 deg north/south limits)
    var newPos = clampLatLng(map.getCenter().wrap());
    if (!map.getCenter().equals(newPos)) {
      map.panTo(newPos,{animate:false})
    }
  });

  // map update status handling & update map hooks
  // ensures order of calls
  map.on('movestart', function() { window.mapRunsUserAction = true; window.requests.abort(); window.startRefreshTimeout(-1); });
  map.on('moveend', function() { window.mapRunsUserAction = false; window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });

  map.on('zoomend', function() { window.layerChooserSetDisabledStates(); });
  window.layerChooserSetDisabledStates();

  // on zoomend, check to see the zoom level is an int, and reset the view if not
  // (there's a bug on mobile where zoom levels sometimes end up as fractional levels. this causes the base map to be invisible)
  map.on('zoomend', function() {
    var z = map.getZoom();
    if (z != parseInt(z))
    {
      console.warn('Non-integer zoom level at zoomend: '+z+' - trying to fix...');
      map.setZoom(parseInt(z), {animate:false});
    }
  });


  // set a 'moveend' handler for the map to clear idle state. e.g. after mobile 'my location' is used.
  // possibly some cases when resizing desktop browser too
  map.on('moveend', idleReset);

  window.addResumeFunction(function() { window.startRefreshTimeout(ON_MOVE_REFRESH*1000); });

  // create the map data requester
  window.mapDataRequest = new MapDataRequest();
  window.mapDataRequest.start();

  // start the refresh process with a small timeout, so the first data request happens quickly
  // (the code originally called the request function directly, and triggered a normal delay for the next refresh.
  //  however, the moveend/zoomend gets triggered on map load, causing a duplicate refresh. this helps prevent that
  window.startRefreshTimeout(ON_MOVE_REFRESH*1000);
}



// renders player details into the website. Since the player info is
// included as inline script in the original site, the data is static
// and cannot be updated.
window.setupPlayerStat = function() {
  // stock site updated to supply the actual player level, AP requirements and XM capacity values
  var level = PLAYER.verified_level;
  PLAYER.level = level; //for historical reasons IITC expects PLAYER.level to contain the current player level

  var n = window.PLAYER.nickname;
  PLAYER.nickMatcher = new RegExp('\\b('+n+')\\b', 'ig');

  var ap = parseInt(PLAYER.ap);
  var thisLvlAp = parseInt(PLAYER.min_ap_for_current_level);
  var nextLvlAp = parseInt(PLAYER.min_ap_for_next_level);

  if (nextLvlAp) {
    var lvlUpAp = digits(nextLvlAp-ap);
    var lvlApProg = Math.round((ap-thisLvlAp)/(nextLvlAp-thisLvlAp)*100);
  } // else zero nextLvlAp - so at maximum level(?)

  var xmMax = parseInt(PLAYER.xm_capacity);
  var xmRatio = Math.round(PLAYER.energy/xmMax*100);

  var cls = PLAYER.team === 'RESISTANCE' ? 'res' : 'enl';


  var t = 'Level:\t' + level + '\n'
        + 'XM:\t' + PLAYER.energy + ' / ' + xmMax + '\n'
        + 'AP:\t' + digits(ap) + '\n'
        + (nextLvlAp > 0 ? 'level up in:\t' + lvlUpAp + ' AP' : 'Maximul level reached(!)')
        + '\n\Invites:\t'+PLAYER.available_invites
        + '\n\nNote: your player stats can only be updated by a full reload (F5)';

  $('#playerstat').html(''
    + '<h2 title="'+t+'">'+level+'&nbsp;'
    + '<div id="name">'
    + '<span class="'+cls+'">'+PLAYER.nickname+'</span>'
    + '<a href="/_ah/logout?continue=https://www.google.com/accounts/Logout%3Fcontinue%3Dhttps://appengine.google.com/_ah/logout%253Fcontinue%253Dhttps://www.ingress.com/intel%26service%3Dah" id="signout">sign out</a>'
    + '</div>'
    + '<div id="stats">'
    + '<sup>XM: '+xmRatio+'%</sup>'
    + '<sub>' + (nextLvlAp > 0 ? 'level: '+lvlApProg+'%' : 'max level') + '</sub>'
    + '</div>'
    + '</h2>'
  );
}

window.setupSidebarToggle = function() {
  $('#sidebartoggle').on('click', function() {
    var toggle = $('#sidebartoggle');
    var sidebar = $('#scrollwrapper');
    if(sidebar.is(':visible')) {
      sidebar.hide().css('z-index', 1);
      $('.leaflet-right').css('margin-right','0');
      toggle.html('<span class="toggle open"></span>');
      toggle.css('right', '0');
    } else {
      sidebar.css('z-index', 1001).show();
      $('.leaflet-right').css('margin-right', SIDEBAR_WIDTH+1+'px');
      toggle.html('<span class="toggle close"></span>');
      toggle.css('right', SIDEBAR_WIDTH+1+'px');
    }
    $('.ui-tooltip').remove();
  });
}

window.setupTooltips = function(element) {
  element = element || $(document);
  element.tooltip({
    // disable show/hide animation
    show: { effect: 'none', duration: 0, delay: 350 },
    hide: false,
    open: function(event, ui) {
      // ensure all other tooltips are closed
      $(".ui-tooltip").not(ui.tooltip).remove();
    },
    content: function() {
      var title = $(this).attr('title');
      return window.convertTextToTableMagic(title);
    }
  });

  if(!window.tooltipClearerHasBeenSetup) {
    window.tooltipClearerHasBeenSetup = true;
    $(document).on('click', '.ui-tooltip', function() { $(this).remove(); });
  }
}

window.setupTaphold = function() {
  @@INCLUDERAW:external/taphold.js@@
}


window.setupQRLoadLib = function() {
  @@INCLUDERAW:external/jquery.qrcode.min.js@@
}


window.setupPlugins = function() {
  if (window.checkForBadPlugins()) return;
  if (!window.bootPlugins) return;

  $.each(window.bootPlugins, function(ind, ref) {
    try {
      ref();
    } catch(err) {
      console.error("error starting plugin: index "+ind+", error: "+err);
      debugger;
    }
  });
}

window.checkForBadPlugins = function() {
  if (!window.plugin) return false;

  let badPlugins = {
    'arc': 'Contains hidden code to report private data to a 3rd party server: <a href="https://plus.google.com/105383756361375410867/posts/4b2EjP3Du42">details here</a>',
  };

  $.each(badPlugins, function(name,desc) {
    if (!window.plugin[name]) {
      delete badPlugins[name];
    }
  });

  // if any entries remain in the list, report this to the user and don't boot ANY plugins
  // (why not any? it's tricky to know which of the plugin boot entries were safe/unsafe)
  if (Object.keys(badPlugins).length > 0) {
    let warning = 'One or more known unsafe plugins were detected. For your safety, IITC has disabled all plugins.<ul>';
    $.each(badPlugins,function(name,desc) {
      warning += '<li><b>'+name+'</b>: '+desc+'</li>';
    });
    warning += '</ul><p>Please uninstall the problem plugins and reload the page. See this <a href="http://iitc.me/faq/#uninstall">FAQ entry</a> for help.</p><p><i>Note: It is tricky for IITC to safely disable just problem plugins</i></p>';

    dialog({
      title: 'Plugin Warning',
      html: warning,
      width: 400
    });

    return true;
  }

  return false;
}

// BOOTING ///////////////////////////////////////////////////////////

function boot() {

  if(!isSmartphone()) // TODO remove completely?
    window.debug.console.overwriteNativeIfRequired();

  console.log('loading done, booting. Built: @@BUILDDATE@@');
  if(window.deviceID) console.log('Your device ID: ' + window.deviceID);
  window.runOnSmartphonesBeforeBoot();

  var iconDefImage = '@@INCLUDEIMAGE:images/marker-icon.png@@';
  var iconDefRetImage = '@@INCLUDEIMAGE:images/marker-icon-2x.png@@';

  L.Icon.Default = L.Icon.extend({options: {
    iconUrl: iconDefImage,
    iconRetinaUrl: iconDefRetImage,
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(12, 41),
    popupAnchor: new L.Point(1, -34),
  }});

  window.extractFromStock();
  window.setupIdle();
  window.setupTaphold();
  window.setupStyles();
  window.setupDialogs();
  window.setupDataTileParams();
  window.setupMap();
  window.setupOMS();
  window.search.setup();
  window.setupLargeImagePreview();
  window.setupSidebarToggle();
  window.updateGameScore();
  window.artifact.setup();
  window.ornaments.setup();
  window.setupPlayerStat();
  window.setupTooltips();
  window.chat.setup();
  window.portalDetail.setup();
  window.setupQRLoadLib();
  window.setupLayerChooserSelectOne();
  window.setupLayerChooserStatusRecorder();

  // read here ONCE, so the URL is only evaluated one time after the
  // necessary data has been loaded.
  urlPortalLL = getURLParam('pll');
  if(urlPortalLL) {
    urlPortalLL = urlPortalLL.split(",");
    urlPortalLL = [parseFloat(urlPortalLL[0]) || 0.0, parseFloat(urlPortalLL[1]) || 0.0];
  }
  urlPortal = getURLParam('pguid');

  $('#sidebar').show();

  window.setupPlugins();

  // static Plugins
  RegionScoreboard.setup();
  Redeem.setup();
  Menu.setup();

  window.setMapBaseLayer();
  window.setupLayerChooserApi();

  window.runOnSmartphonesAfterBoot();

  window.iitcLoaded = true;
  setTimeout(function(){window.runHooks('iitcLoaded');}, 1); // delay message to give GM/TM time to load all scripts


  if (typeof android !== 'undefined' && android && android.bootFinished) {
    android.bootFinished();
  }

}


@@INCLUDERAW:external/load.js@@

@@INCLUDERAW:external/leaflet-src.js@@
@@INCLUDERAW:external/L.Geodesic.js@@
@@INCLUDERAW:external/Leaflet.GoogleMutant.js@@
@@INCLUDERAW:external/autolink-min.js@@
@@INCLUDERAW:external/oms.min.js@@

@@INCLUDERAW:external/jquery-3.1.1.min.js@@
@@INCLUDERAW:external/jquery-ui-1.12.1.min.js@@

try { console.log('done loading included JS'); } catch(e) {}

$(boot);
