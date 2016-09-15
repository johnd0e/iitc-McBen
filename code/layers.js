

// adds listeners to the layer chooser such that a long press hides
// all custom layers except the long pressed one.
window.setupLayerChooserSelectOne = function() {
  $('.leaflet-control-layers-overlays').on('click taphold', 'label', function(e) {
    if(!e) return;
    if(!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.type === 'taphold')) return;
    var m = window.map;

    var add = function(layer) {
      if(!m.hasLayer(layer.layer)) m.addLayer(layer.layer);
    };
    var rem = function(layer) {
      if(m.hasLayer(layer.layer)) m.removeLayer(layer.layer);
    };

    var isChecked = $(e.target).find('input').is(':checked');
    var checkSize = $('.leaflet-control-layers-overlays input:checked').length;
    if((isChecked && checkSize === 1) || checkSize === 0) {
      // if nothing is selected or the users long-clicks the only
      // selected element, assume all boxes should be checked again
      $.each(window.layerChooser._mlayers, function(ind, layer) {
        if(!layer.overlay) return true;
        add(layer);
      });
    } else {
      // uncheck all
      var keep = $.trim($(e.target).text());
      $.each(window.layerChooser._mlayers, function(ind, layer) {
        if(layer.overlay !== true) return true;
        if(layer.name === keep) { add(layer);  return true; }
        rem(layer);
      });
    }
    e.preventDefault();
  });
};


// Setup the function to record the on/off status of overlay layerGroups
window.setupLayerChooserStatusRecorder = function() {
  // Record already added layerGroups
  $.each(window.layerChooser._mlayers, function(ind, chooserEntry) {
    if(!chooserEntry.overlay) return true;
    var display = window.map.hasLayer(chooserEntry.layer);
    window.updateDisplayedLayerGroup(chooserEntry.name, display);
  });

  // Record layerGroups change
  window.map.on('overlayadd overlayremove', function(e) {
    var display = (e.type === 'overlayadd');
    window.updateDisplayedLayerGroup(e.name, display);
  });
};


window.layerChooserSetDisabledStates = function() {
// layer selector - enable/disable layers that aren't visible due to zoom level
  var minlvl = getMinPortalLevel();
  var portalSelection = $('.leaflet-control-layers-overlays label');
  //it's an array - 0=unclaimed, 1=lvl 1, 2=lvl 2, ..., 8=lvl 8 - 9 relevant entries
  //mark all levels below (but not at) minlvl as disabled
  portalSelection.slice(0, minlvl).addClass('disabled').attr('title', 'Zoom in to show those.');
  //and all from minlvl to 8 as enabled
  portalSelection.slice(minlvl, 8+1).removeClass('disabled').attr('title', '');

//TODO? some generic mechanism where other layers can have their disabled state marked on/off? a few
//plugins have code to do it by hand already
};


function createDefaultBaseMapLayers() {
  var baseLayers = {};

  //OpenStreetMap attribution - required by several of the layers
  osmAttribution = 'Map data © OpenStreetMap contributors';

  // MapQuest - http://developer.mapquest.com/web/products/open/map
  // now requires an API key
  //var mqSubdomains = [ 'otile1','otile2', 'otile3', 'otile4' ];
  //var mqTileUrlPrefix = window.location.protocol !== 'https:' ? 'http://{s}.mqcdn.com' : 'https://{s}-s.mqcdn.com';
  //var mqMapOpt = {attribution: osmAttribution+', Tiles Courtesy of MapQuest', maxNativeZoom: 18, maxZoom: 21, subdomains: mqSubdomains};
  //baseLayers['MapQuest OSM'] = new L.TileLayer(mqTileUrlPrefix+'/tiles/1.0.0/map/{z}/{x}/{y}.jpg',mqMapOpt);

  // cartodb has some nice tiles too - both dark and light subtle maps - http://cartodb.com/basemaps/
  // (not available over https though - not on the right domain name anyway)
  var cartoAttr = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';
  var cartoUrl = 'http://{s}.basemaps.cartocdn.com/{theme}/{z}/{x}/{y}.png';
  baseLayers['CartoDB Dark Matter'] = L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'dark_all'});
  baseLayers['CartoDB Positron'] = L.tileLayer(cartoUrl,{attribution:cartoAttr,theme:'light_all'});


  // we'll include google maps too - in the ingress default style, and a few other standard ones
  // as the stock intel map already uses the googme maps API, we just hijack their inclusion of the javascript and API key :)
  var ingressGMapOptions = {
    backgroundColor: '#0e3d4e', //or #dddddd ? - that's the Google tile layer default
    styles: [
        { featureType:"all", elementType:"all",
          stylers: [{visibility:"on"}, {hue:"#131c1c"}, {saturation:"-50"}, {invert_lightness:true}] },
        { featureType:"water", elementType:"all",
          stylers: [{visibility:"on"}, {hue:"#005eff"}, {invert_lightness:true}] },
        { featureType:"poi", stylers:[{visibility:"off"}]},
        { featureType:"transit", elementType:"all", stylers:[{visibility:"off"}] }
      ]
  };
  baseLayers['Google Default Ingress Map'] = new L.Google('ROADMAP',{maxZoom:21, mapOptions:ingressGMapOptions});
  baseLayers['Google Roads'] = new L.Google('ROADMAP',{maxZoom:21});
  baseLayers['Google Satellite'] = new L.Google('SATELLITE',{maxZoom:21});
  baseLayers['Google Hybrid'] = new L.Google('HYBRID',{maxZoom:21});
  baseLayers['Google Terrain'] = new L.Google('TERRAIN',{maxZoom:15});


  return baseLayers;
}


function setupLayers() {
  var addLayers = {};
  var displayWarning = false;

  function addDefaultLayer(name,layer) {
    addLayers[name] = layer;
    if(isLayerGroupDisplayed(name, true)) {
      map.addLayer(layer);  
    } else {
      displayWarning = true;
    }
  }


  portalsFactionLayers = [];
  var portalsLayers = [];
  for(var i = 0; i <= 8; i++) {
    portalsFactionLayers[i] = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
    portalsLayers[i] = L.layerGroup(portalsFactionLayers[i]);
    var name = (i === 0 ? 'Unclaimed/Placeholder' : 'Level ' + i) + ' Portals';
    addDefaultLayer(name,portalsLayers[i]);
  }

  fieldsFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  var fieldsLayer = L.layerGroup(fieldsFactionLayers);
  addDefaultLayer('Fields',fieldsLayer);

  linksFactionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  var linksLayer = L.layerGroup(linksFactionLayers);
  addDefaultLayer('Links',linksLayer);


  // faction-specific layers
  // these layers don't actually contain any data. instead, every time they're added/removed from the map,
  // the matching sub-layers within the above portals/fields/links are added/removed from their parent with
  // the below 'onoverlayadd/onoverlayremove' events
  var factionLayers = [L.layerGroup(), L.layerGroup(), L.layerGroup()];
  map.addLayer (factionLayers[TEAM_NONE]);

  // to avoid any favouritism, we'll put the player's own faction layer first
  if (PLAYER.team == 'RESISTANCE') {
    addDefaultLayer('Resistance',factionLayers[TEAM_RES]);
    addDefaultLayer('Enlightened',factionLayers[TEAM_ENL]);
  } else {
    addDefaultLayer('Enlightened',factionLayers[TEAM_ENL]);
    addDefaultLayer('Resistance',factionLayers[TEAM_RES]);
  }

  var setFactionLayersState = function(fac,enabled) {
    var lvl;
    if (enabled) {
      if (!fieldsLayer.hasLayer(fieldsFactionLayers[fac])) fieldsLayer.addLayer (fieldsFactionLayers[fac]);
      if (!linksLayer.hasLayer(linksFactionLayers[fac])) linksLayer.addLayer (linksFactionLayers[fac]);
      for (lvl in portalsLayers) {
        if (!portalsLayers[lvl].hasLayer(portalsFactionLayers[lvl][fac])) portalsLayers[lvl].addLayer (portalsFactionLayers[lvl][fac]);
      }
    } else {
      if (fieldsLayer.hasLayer(fieldsFactionLayers[fac])) fieldsLayer.removeLayer (fieldsFactionLayers[fac]);
      if (linksLayer.hasLayer(linksFactionLayers[fac])) linksLayer.removeLayer (linksFactionLayers[fac]);
      for (lvl in portalsLayers) {
        if (portalsLayers[lvl].hasLayer(portalsFactionLayers[lvl][fac])) portalsLayers[lvl].removeLayer (portalsFactionLayers[lvl][fac]);
      }
    }
  };

  setFactionLayersState (TEAM_NONE, true);
  setFactionLayersState (TEAM_RES, isLayerGroupDisplayed('Resistance', true));
  setFactionLayersState (TEAM_ENL, isLayerGroupDisplayed('Enlightened', true));

  // NOTE: these events are fired by the layer chooser, so won't happen until that's created and added to the map
  window.map.on('overlayadd overlayremove', function(e) {
    var displayed = (e.type == 'overlayadd');
    switch (e.name) {
      case 'Resistance':
        setFactionLayersState (TEAM_RES, displayed);
        break;
      case 'Enlightened':
        setFactionLayersState (TEAM_ENL, displayed);
        break;
    }
  });


  var baseLayers = createDefaultBaseMapLayers();
  window.layerChooser = new L.Control.GroupedLayers(baseLayers, addLayers);

  if (displayWarning)  showHiddenLayerWarning(addLayers);

  map.addControl(window.layerChooser);
}


function showHiddenLayerWarning(addLayers) {
  $('#portaldetails').html('<div class="layer_off_warning">'
                          +'<p><b>Warning</b>: some of the standard layers are turned off. Some portals/links/fields will not be visible.</p>'
                          +'<a id="enable_standard_layers">Enable standard layers</a>'
                          +'</div>');

  $('#enable_standard_layers').on('click', function() {
    $.each(addLayers, function(ind, layer) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    });
    $('#portaldetails').html('');
  });
}

//adds a base layer to the map. done separately from the above, so that plugins that add base layers can be the default
window.setMapBaseLayer = function() {
  //create a map name -> layer mapping - depends on internals of L.Control.Layers
  var nameToLayer = {};
  var firstLayer = null;

  var baseLayer = window.layerChooser.findBaseLayerByName(localStorage['iitc-base-map'])
                  || window.layerChooser.getfirstBaseLayer();
  
  map.addLayer(baseLayer);

  // now we have a base layer we can set the map position
  // (setting an initial position, before a base layer is added, causes issues with leaflet)
  var pos = getPosition();
  map.setView (pos.center, pos.zoom, {reset:true});


  //event to track layer changes and store the name
  map.on('baselayerchange', function(info) {
    var obj = window.layerChooser._findLayer(info.layer);
    if (obj) {
      localStorage['iitc-base-map'] = obj.name;
    }

    //also, leaflet no longer ensures the base layer zoom is suitable for the map (a bug? feature change?), so do so here
    map.setZoom(map.getZoom());
  });
};


window.setupLayerChooserApi = function() {
  // hide layer chooser if booted with the iitcm android app
  if (typeof android !== 'undefined' && android && android.setLayers) {
    $('.leaflet-control-layers').hide();

  // as this setupLayerChooserApi function is called after the layer menu is populated, we need to also get they layers once
  // so they're passed through to the android app
    window.layerChooser.getLayers();
  }
};
