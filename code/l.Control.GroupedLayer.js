// GroupedLayerControl
//  IITC only layer-control
//
//   NOTE: someday it might get independed - but not now
//   NOTE: don't change filename 'cause it has to be loaded after 'boot.js'


L.Control.GroupedLayers = L.Control.extend({
  options: {
    collapsed: true,
    position: 'topright',
    autoZIndex: true
  },

  initialize: function (baseLayers, overlays, options) {
    L.setOptions(this, options);

    this._mlayers = [];
    this._lastZIndex = 0;
    this._handlingClick = false;

    for (var i in baseLayers) {
      this._addLayer(baseLayers[i], i);
    }

    for (i in overlays) {
      this._addLayer(overlays[i], i, true);
    }
  },

  onAdd: function (map) {
    this._initLayout();
    this._update();

    map
        .on('layeradd', this._onLayerChange, this)
        .on('layerremove', this._onLayerChange, this);

    return this._container;
  },

  onRemove: function (map) {
    map
        .off('layeradd', this._onLayerChange, this)
        .off('layerremove', this._onLayerChange, this);
  },

  addBaseLayer: function (layer, name) {
    this._addLayer(layer, name);
    this._update();
    return this;
  },

  addOverlay: function (layer, name) {
    this._addLayer(layer, name, true);
    this._update();
    return this;
  },

  removeLayer: function (layer) {
    var id = L.stamp(layer);
    this._removeLayer(this._mlayers,id);
    this._update();
    return this;
  },

  _removeLayer: function (arr,id) {
    for (var i=arr.length-1;i>=0;--i) {
      var obj = arr[i];
      if (obj.layer && L.stamp(obj.layer)===id) delete obj[l];
      if (obj.childs!=null) {
        this._removeLayer(obj.childs,id);
      }
    }
  },

  _initLayout: function () {
    var className = 'leaflet-control-layers',
        container = this._container = L.DomUtil.create('div', className);

    //Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
    container.setAttribute('aria-haspopup', true);

    if (!L.Browser.touch) {
      L.DomEvent
        .disableClickPropagation(container)
        .disableScrollPropagation(container);
    } else {
      L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
    }

    var form = this._form = L.DomUtil.create('form', className + '-list');

    if (this.options.collapsed) {
      if (!L.Browser.android) {
        L.DomEvent
            .on(container, 'mouseover', this._expand, this)
            .on(container, 'mouseout', this._collapse, this);
      }
      var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
      link.href = '#';
      link.title = 'Layers';

      if (L.Browser.touch) {
        L.DomEvent
            .on(link, 'click', L.DomEvent.stop)
            .on(link, 'click', this._expand, this);
      }
      else {
        L.DomEvent.on(link, 'focus', this._expand, this);
      }
      //Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
      L.DomEvent.on(form, 'click', function () {
        setTimeout(L.bind(this._onInputClick, this), 0);
      }, this);

      this._map.on('click', this._collapse, this);
      // TODO keyboard accessibility
    } else {
      this._expand();
    }

    this._baseLayersList = L.DomUtil.create('div', className + '-base', form);
    this._separator = L.DomUtil.create('div', className + '-separator', form);
    this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);

    container.appendChild(form);
  },

  _addLayer: function (layer, name, overlay) {
    var id = L.stamp(layer);

    this._mlayers.push({
      layer: layer,
      name: name,
      overlay: overlay,
      childs: null,
    });

    if (this.options.autoZIndex && layer.setZIndex) {
      this._lastZIndex++;
      layer.setZIndex(this._lastZIndex);
    }
  },

  _findLayer: function (layer) {
    var id = L.stamp(layer);
    return this._findLayerByID(id);
  },

  findBaseLayerByName: function (name) {
    for (var i=this._mlayers.length-1;i>=0;--i) {
      var obj = this._mlayers[i];
      if (obj.layer && !obj.overlay && obj.name===name) return obj.layer;
    }
  },

  getfirstBaseLayer: function () {
    for (var i=0,l=this._mlayers.length;i<l;++i) {
      var obj = this._mlayers[i];
      if (obj.layer && !obj.overlay) return obj.layer;
    }
  },

  _findLayerByID: function (id) {
    return this._findLayerInArray(this._mlayers,id);
  },

  _findLayerInArray: function (arr,id) {
    for (var i=arr.length-1;i>=0;--i) {
      var obj = arr[i];
      if (obj.layer && L.stamp(obj.layer)===id) return obj;
      if (obj.childs) {
        var res = this._findLayerInArray(obj.childs,id);
        if (res) return res;
      }
    }
  },

  _update: function () {
    // update layer menu in IITCm  - TODO: convert to hooks
    try {
      if(typeof android != 'undefined')
        window.layerChooser.getLayers();
    } catch(e) {
      console.error(e);
    }


    if (!this._container) {
      return;
    }

    this._baseLayersList.innerHTML = '';
    this._overlaysList.innerHTML = '';

    var baseLayersPresent = false,
        overlaysPresent = false;

    for (var i=0,l=this._mlayers.length;i<l;++i) {    
      var obj = this._mlayers[i];
      this._addItem(obj);
      overlaysPresent = overlaysPresent || obj.overlay;
      baseLayersPresent = baseLayersPresent || !obj.overlay;
    }

    this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
  },

  _onLayerChange: function (e) {
    var obj = this._findLayer(e.layer);

    if (!obj) { return; }

    if (!this._handlingClick) {
      this._update();
    }

    var type = obj.overlay ?
      (e.type === 'layeradd' ? 'overlayadd' : 'overlayremove') :
      (e.type === 'layeradd' ? 'baselayerchange' : null);

    if (type) {
      this._map.fire(type, obj);
    }
  },

  _createBasemapSelector: function (checked) {
    // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
    var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="leaflet-base-layers"';
    if (checked) {
      radioHtml += ' checked="checked"';
    }
    radioHtml += '/>';

    var radioFragment = document.createElement('div');
    radioFragment.innerHTML = radioHtml;

    return radioFragment.firstChild;
  },

  _createOverlayCheckbox: function (checked) {
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'leaflet-control-layers-selector';
    input.defaultChecked = checked;

    return input;
  },

  _addItem: function (obj) {
    var label = document.createElement('label'),
        input,
        checked = this._map.hasLayer(obj.layer);

    if (obj.overlay) {
      input = this._createOverlayCheckbox(checked);
    } else {
      input = this._createBasemapSelector(checked);
    }

    input.layerId = L.stamp(obj.layer);

    L.DomEvent.on(input, 'click', this._onInputClick, this);

    var name = document.createElement('span');
    name.innerHTML = ' ' + obj.name;

    label.appendChild(input);
    label.appendChild(name);

    var container = obj.overlay ? this._overlaysList : this._baseLayersList;
    container.appendChild(label);

    return label;
  },

  
  _onInputClick: function () {
    var inputs = this._form.getElementsByTagName('input'),
        inputsLen = inputs.length;

    this._handlingClick = true;

    for (var i = 0; i < inputsLen; i++) {
      var input = inputs[i];

      var obj = this._findLayerByID(input.layerId);

      if (input.checked && !this._map.hasLayer(obj.layer)) {
        this._map.addLayer(obj.layer);

      } else if (!input.checked && this._map.hasLayer(obj.layer)) {
        this._map.removeLayer(obj.layer);
      }
    }

    this._handlingClick = false;

    this._refocusOnMap();
  },

  _expand: function () {
    L.DomUtil.addClass(this._container, 'leaflet-control-layers-expanded');
  },

  _collapse: function () {
    this._container.className = this._container.className.replace(' leaflet-control-layers-expanded', '');
  },


  showLayer: function(id,show) {
    if (show === undefined) show = true;
    obj = this._findLayerByID(id);
    if (!obj) return false;

    if(show) {
      if (!this._map.hasLayer(obj.layer)) {
        //the layer to show is not currently active
        this._map.addLayer(obj.layer);

        //if it's a base layer, remove any others
        if (!obj.overlay) {
          for (var i=this._mlayers.length-1;i>=0;--i) {
            var other = this._mlayers[i];
            if (other.overlay && other.layer && L.stamp(other.layer)!=id && this._map.hasLayer(other.layer)) {
              this._map.removeLayer(other.layer);
            }
          }
        }
      }
    } else {
      if (this._map.hasLayer(obj.layer)) {
        this._map.removeLayer(obj.layer);
      }
    }

    //below logic based on code in L.Control.Layers _onInputClick
    if(!obj.overlay) {
      this._map.setZoom(this._map.getZoom());
      this._map.fire('baselayerchange', {layer: obj.layer});
    }

    return true;
  },


  // Android Helper - TODO: convert to hooks
  getLayers: function() {
    var baseLayers = [];
    var overlayLayers = [];

    function push(obj) {
      if (!layer_obj.layer) return;
      var layerActive = window.map.hasLayer(obj.layer);
      var info = {
        layerId: L.stamp(obj.layer),
        name: obj.name,
        active: layerActive
      };
      if (obj.overlay) {
        overlayLayers.push(info);
      } else {
        baseLayers.push(info);
      }
    }

    for (var i=this._mlayers.length-1;i>=0;--i) {
      var obj = this._mlayers[i];
      push(obj);
      if (obj.childs) {
        for (var j=obj.childs-1;j>=0;--j) {
          var obj2= obj.childs[j];
          push(obj);
        }
      }
    }

    var overlayLayersJSON = JSON.stringify(overlayLayers);
    var baseLayersJSON = JSON.stringify(baseLayers);

    if (typeof android !== 'undefined' && android && android.setLayers) {
        if(this.androidTimer) clearTimeout(this.androidTimer);
        this.androidTimer = setTimeout(function() {
            this.androidTimer = null;
            android.setLayers(baseLayersJSON, overlayLayersJSON);
        }, 1000);
    }

    return {
      baseLayers: baseLayers,
      overlayLayers: overlayLayers
    };
  },


});