// ==UserScript==
// @id             iitc-plugin-portaltag
// @name           IITC plugin: Portal Tagger
// @category       Controls
// @version        0.2.0.20140909.63414
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [mobile-2014-09-09-063414] Tag Portals
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

window.plugin.tagger = function() {};

window.plugin.tagger.SYNC_DELAY = 5000;
window.plugin.tagger.DEFAULT_TAGOPTION = {warn:0,color:2};

window.plugin.tagger.portals = {};    // stored local + Sync
window.plugin.tagger.syncQueue = {};  // update queue
window.plugin.tagger.syncQueuePushed = {};  // update queue

window.plugin.tagger.tagOptions = {}; // stored local
window.plugin.tagger.tagCount = {};
window.plugin.tagger.isHighlightActive = false;
window.plugin.tagger.enableSync = false;

window.plugin.tagger.layers = {};
window.plugin.tagger.layerGroup = null;

window.plugin.tagger.current_warnings = [];
window.plugin.tagger.checked_warnings = [];

/***************************************************************************************************************************************************************/
window.plugin.tagger.addTagView= function() {

    $('#portaldetails > .imgpreview').after(plugin.tagger.htmlTagContainer + plugin.tagger.htmlTagSearchBox);

    window.plugin.tagger.updateTagView();
 };
 
window.plugin.tagger.updateTagView= function() {

    var guid = window.selectedPortal;

    var tagview='';
    var tags = window.plugin.tagger.portals[guid] ? window.plugin.tagger.portals[guid].tags : undefined;
    if (tags) {
      tags.sort(function(a, b) {return window.plugin.tagger.tagCount[b]-window.plugin.tagger.tagCount[a];});
      for(var tag in tags) {
	tagview += plugin.tagger.htmlTag.replace(/%NAME%/g,tags[tag]);
      }
    }
    tagview += plugin.tagger.htmlTagAdd;

    $('#taggerContainer').html(tagview);
 };

window.plugin.tagger.updatePortal = function(guid) {
   if (guid === window.selectedPortal) {
      window.plugin.tagger.updateTagView();
   }

   if (window.plugin.tagger.isHighlightActive) {
     if (portals[guid]) {
        window.setMarkerStyle (portals[guid], guid === selectedPortal);
     }
   }

  window.plugin.tagger.updateMarker(guid);
 };

/***************************************************************************************************************************************************************/
window.plugin.tagger.hideTaggerOptionDialog = function() {
    $('#taggerOptionFrame').hide();
  };

window.plugin.tagger.showTaggerOptionDialog = function(value) {
    $('#taggerOptionFrame').show();
    $('#taggerOptionFrame .addForm input').val(value);
    window.plugin.tagger.onUpdateTagOptionList(value);
 };

window.plugin.tagger.onUpdateTagOptionList = function(value) {

    var MAX_LINES = 100;
    var tags = window.plugin.tagger.tagOptions;

    var fitlertags = [];
    if (value && value.length>0) {
	var value_lower = value.toLowerCase();

	for(var tag in tags) {
	  var index = tag.toLowerCase().indexOf(value_lower);

	  if (index!== -1) fitlertags.push(tag);
	}
    } else {
      fitlertags = Object.keys(tags);
    }

    fitlertags.sort( function(a,b) { return tags[a].count-tags[b].count;});

    var taglist = "";
    for (var i=0;i<MAX_LINES && i<fitlertags.length;++i) {
	var tag = tags[fitlertags[i]];
        taglist += '<div class="tagline" value="'+fitlertags[i]+'"><div class="tagname">'+fitlertags[i]+"</div>"
        	+ '<select class="tagline_select" onchange="window.plugin.tagger.onChangeTagWarn(this)">'
		  + '<option value="0"' +(tag.warn== 0?' selected':'') +'></option>'
		  + '<option value="-1"'+(tag.warn==-1?' selected':'') +'>no warn</option>'
		  + '<option value="1"' +(tag.warn== 1?' selected':'') +'>if level 7</option>'
		  + '<option value="2"' +(tag.warn== 2?' selected':'') +'>if level 8</option>'
		  + '<option value="3"' +(tag.warn== 3?' selected':'') +'>if not level 7</option>'
		  + '<option value="4"' +(tag.warn== 4?' selected':'') +'>if not level 8</option>'
		  + '<option value="5"' +(tag.warn== 5?' selected':'') +'>if ENL</option>'
		  + '<option value="6"' +(tag.warn== 6?' selected':'') +'>if RES</option>'
        	+ '</select>'
        	+ '<select class="tagline_select" onchange="window.plugin.tagger.onChangeTagColor(this)">'
		  + '<option value="0"'+(tag.color==0?' selected':'') +'></option>'
		  + '<option value="1"'+(tag.color==1?' selected':'') +'>no color</option>'
		  + '<option value="2"'+(tag.color==2?' selected':'') +'>red</option>'
		  + '<option value="3"'+(tag.color==3?' selected':'') +'>red strong</option>'
		+ '</select>'
		+ '</div>';
    }

    $('#taglist').html(taglist);
 };

window.plugin.tagger.onChangedTagFilter = function(event) {
    window.setTimeout( function(){ window.plugin.tagger.onUpdateTagOptionList($('#taggerOptionFrame .addForm input').val()); }, 1);
 };

window.plugin.tagger.onChangeTagWarn = function(ctrl) {
        var val = ctrl.options[ctrl.selectedIndex].value;
        var tag = $(ctrl).parent().attr('value');
        window.plugin.tagger.tagOptions[tag].warn = parseInt(val);

        window.plugin.tagger.saveStorageOptions();
        window.plugin.tagger.checkAllWarnings();
 };

window.plugin.tagger.onChangeTagColor = function(ctrl) {
        var val = ctrl.options[ctrl.selectedIndex].value;
        var tag = $(ctrl).parent().attr('value');
        window.plugin.tagger.tagOptions[tag].color = parseInt(val);

        window.plugin.tagger.saveStorageOptions();
        window.plugin.tagger.updateAllMarkers();
 };

/***************************************************************************************************************************************************************/
window.plugin.tagger.hideTaggerPortalDialog = function() {
    $('#taggerPortalFrame').hide();
  };

window.plugin.tagger.showTaggerPortalDialog = function(value) {
    $('#taggerPortalFrame').show();
    
    var input = $('#taggerPortalFrame .addForm input');
    input.val(value);
    window.plugin.tagger.tagInputField(input,null,null,window.plugin.tagger.onUpdatePortalList);
    
    window.plugin.tagger.onUpdatePortalList(value);
 };

window.plugin.tagger.onOpenOptions = function () {
    window.plugin.tagger.hideTaggerPortalDialog();
    window.plugin.tagger.showTaggerOptionDialog($('#taggerPortalFrame .addForm input').val());
};

window.plugin.tagger.onUpdatePortalList = function(value) {

    var portals = window.plugin.tagger.portals;

    if (value) {
        var tagset={};
        var taglist = value.split(" ");
        for (i = 0; i < taglist.length; i++) {
            if (taglist[i].length > 0) {
                var casefix = window.plugin.tagger.findTag(taglist[i]);
                if (casefix) tagset[casefix] = true;
                else tagset[taglist[i]] = true;
            }
        }
        var tagcount = Object.keys(tagset).length;

        var matchCount = function (guid, tagset) {
            var match = 0;
            var ptags = window.plugin.tagger.portals[guid].tags;
            for (var tag in ptags) {
                if (tagset[ptags[tag]]) ++match;
            }
            return match;
        };

        if (tagcount>0) {
            portals = {};
            for (var guid in window.plugin.tagger.portals) {
                if (matchCount(guid,tagset)===tagcount) {
                    portals[guid]=true;
                }
            }
        }
    }

    var taglist = "";
    for (var guid in portals) {

        var name = window.plugin.tagger.portals[guid].name;
        var btn_link = '<a class="tagportalbutton" onclick="'+window.plugin.tagger.getOnPortalClickLink(guid)+'">'+name+'</a>';

        taglist += '<div class="tagline">'+btn_link+'</div>';
    }

    $('#tagportallist').html(taglist);
 };

window.plugin.tagger.onChangedPortalFilter = function(event) {
//    window.setTimeout( function(){ window.plugin.tagger.onUpdatePortalList($('#taggerPortalFrame .addForm input').val()); }, 1);
 };

window.plugin.tagger.getOnPortalClickLink = function(guid) {
    var returnToMap = '';

    if (window.isSmartphone()) {
      returnToMap = 'window.show(\'map\');';
    }

    var latlng = window.plugin.tagger.portals[guid].latlng;
	return returnToMap+'window.zoomToAndShowPortal(\''+guid+'\', ['+latlng.lat+','+latlng.lng+']);';
 };

/***************************************************************************************************************************************************************/
window.plugin.tagger.tagInputField = function(ctrl, oncommit, oncancel, onchange) {

        var self = this;

        this.onKeyDown = function(event) {
            var keyCode = ('which' in event) ? event.which : event.keyCode;

            if (keyCode === 9) {
                self.skipToNextWord();
                return;
            }
            
            if ((keyCode === 8 || keyCode === 46) && self.hasSuggestion) {
                self.removeSuggestion();
                return;
            }

            if (keyCode === 13) {
                if (self.onCommit) self.onCommit(self.ctrl.val());
                return;
            }

            if (keyCode === 27) {
                if (self.onCancel) self.onCancel();
                return;
            }

            self.hasSuggestion = false;
            window.setTimeout(function() { self.doTagSuggestion(); }, 1);
        };

        this.doTagSuggestion = function() {
            if (self.onChange) self.onChange(self.ctrl.val());
            
            var pos = self.getCursorPos();
            if (!pos)   return;

            var val = self.ctrl.val();
            var word = self.getLastWord(val, pos);

            if (!word || word.length === 0)
                return;

            var match = self.findMatch(word);
            if (match) {
                match = match.substring(word.length);
                if (match.length === 0)
                    return;
                var scrollPos = self.ctrl.scrollTop;
                self.ctrl.val(val.substring(0, pos) + match + val.substring(pos));
                self.setSelection(pos, match.length);
                self.ctrl.scrollTop = scrollPos;
                self.hasSuggestion = true;
            }
        };

        this.getCursorPos = function () {
            var input = self.ctrl.get(0);
            if (!input) return;
            if ('selectionStart' in input) {
                // Standard-compliant browsers
                var selLen = input.selectionEnd - input.selectionStart;
                if (selLen!==0) return;
                return input.selectionStart;
            } else if (document.selection) {
                // IE
                input.focus();
                var sel = document.selection.createRange();
                var selLen = document.selection.createRange().text.length;
                if (selLen!==0) return;
                sel.moveStart('character', -input.value.length);
                return sel.text.length - selLen;
            }
        };
        
        this.removeSuggestion = function () {
            var text = self.ctrl.val();
            var input = self.ctrl.get(0);
            if (!input) return;
            if ('selectionStart' in input) {
                // Standard-compliant browsers
                var selLen = input.selectionEnd - input.selectionStart;
                if (selLen===0) return;
                self.ctrl.val( text.substring(0,input.selectionStart)+text.substring(input.selectionEnd) );
                input.selectionEnd = input.selectionStart;
            } else if (document.selection) {
                // IE
                input.focus();
                var sel = document.selection.createRange();
                sel.clear();
            }
        };
        
        this.setSelection = function (start,len) {
            var input = self.ctrl.get(0);
            if (!input) return;
    
            if ('selectionStart' in input) {
                // Standard-compliant browsers
                input.selectionStart = start;
                input.selectionEnd = start + len;
                input.focus();
            } else if (document.selection) {
                // IE
                input.focus();
                var range = document.selection.createRange();
                range.moveStart('character', -input.value.length);
                range.moveStart('character', start);
                range.moveEnd('character', len);
                range.select();
            }
        };

        this.getLastWord = function(text, pos) {
            var end = text.length;
            if (pos < end) {
                if (text.charAt(pos) !== ' ') return;
                end = pos;
            };

            var start = text.substring(0, pos).lastIndexOf(' ');
            if (start === -1)
                start = 0;
            else
                start++;

            if (start === end) return;

            return text.substring(start, end);
        };

        this.findMatch = function (text) {
            var best_match;
            var best_count=-1;
            text = text.toLowerCase();
            for (var match in window.plugin.tagger.tagCount) {
               if (match.toLowerCase().indexOf(text)===0) {
                   if (window.plugin.tagger.tagCount[match]>best_count) {
                       best_count = window.plugin.tagger.tagCount[match];
                       best_match = match;
                   }
               }
            }
            return best_match;
        };

        this.skipToNextWord = function() {
            var pos = self.getCursorPos();
            var text = self.ctrl.val();
            var end = text.substring(pos).indexOf(' ');
            if (end===-1) end = text.length;
            else end +=pos;
            self.setSelection(end,0);
        };


        this.ctrl = ctrl;
        this.onCommit = oncommit;
        this.onCancel = oncancel;
        this.onChange = onchange;

        ctrl.on('keydown', self.onKeyDown);
    };

/***************************************************************************************************************************************************************/
window.plugin.tagger.addTagDialog = function() {
  $('#taggerSearchBox').css('height', '32px');
  $('.taggerAddButton').hide();
  
  var input = $('#taggerSearchBox .addForm input');
  input.focus();
  input.val('');
  window.plugin.tagger.tagInputField(input, window.plugin.tagger.addTag, window.plugin.tagger.closeSearchDialog);

  window.mapDataRequest.clearTimeout(); // map refresh would rebuild portal detail view
 };

window.plugin.tagger.closeSearchDialog = function() {
  $('#taggerSearchBox').css('height', '0px');
  $('.taggerAddButton').show();
 };

window.plugin.tagger.findTag = function(name) {
  var lowcase = name.toLowerCase();
  for(var tag in window.plugin.tagger.tagOptions) {
      if (tag.toLowerCase()===lowcase) return tag;
  }
 };

window.plugin.tagger.addTag = function(name) {

  window.plugin.tagger.closeSearchDialog();

  var guid = window.selectedPortal;
  window.plugin.tagger.storePortal(guid);
  var portaltags = window.plugin.tagger.portals[guid] ? window.plugin.tagger.portals[guid].tags : undefined;

  var taglist = name.split(" ");
  for (i=0;i<taglist.length;i++) {

    // fix case
    var tag = taglist[i];
    if (tag.length>0) {
      var casefix = window.plugin.tagger.findTag(tag);
      if (casefix) tag = casefix;

      if (portaltags.indexOf(tag)===-1) {
	portaltags.push(tag);
	if (!window.plugin.tagger.tagOptions[tag]) {
            window.plugin.tagger.tagOptions[tag] = $.extend({},window.plugin.tagger.DEFAULT_TAGOPTION);
            window.plugin.tagger.saveStorageOptions();
	}
	window.plugin.tagger.tagCount[tag] = window.plugin.tagger.tagCount[tag]?window.plugin.tagger.tagCount[tag]+1:1;
	window.plugin.tagger.updateTagView();
      }
    }
  }

  window.plugin.tagger.updatePortal();
  window.plugin.tagger.saveStorage(guid);
 };

window.plugin.tagger.storePortal = function(guid) {
	if (!window.plugin.tagger.portals[guid])
    {
        var latlng = window.portals[guid].getLatLng();
        var name = window.portals[guid].options.data.title;

        window.plugin.tagger.portals[guid]={ tags: [], latlng: latlng, name: name};
    }
 };

window.plugin.tagger.onTagDelete = function(tag) {
    var guid = window.selectedPortal;
    var portaltags = window.plugin.tagger.portals[guid] ? window.plugin.tagger.portals[guid].tags : undefined;

    console.log("remove tag: "+tag);
    var index = portaltags.indexOf(tag);
    if (index!==-1) {
		portaltags.splice(index,1);
		if (portaltags.length===0) { delete window.plugin.tagger.portals[guid];         console.log("delete portal"); }


	window.plugin.tagger.tagCount[tag]--; console.log("new count = "+window.plugin.tagger.tagCount[tag]);
	if (window.plugin.tagger.tagCount[tag]<=0) {
            delete window.plugin.tagger.tagOptions[tag];
            delete window.plugin.tagger.tagCount[tag];
            console.log("remove tag option");
        }

	window.plugin.tagger.updateTagView();
    }

    window.plugin.tagger.updatePortal();
    window.plugin.tagger.saveStorage(guid);
  };

/***************************************************************************************************************************************************************/
window.plugin.tagger.getPortalWarning = function(guid,data) {
    if (!window.plugin.tagger.portals[guid]) return;
    if (!data) return;

    var tags = window.plugin.tagger.portals[guid].tags;

    var res = false;
    for (var tag in tags) {
        var tagopt = window.plugin.tagger.tagOptions[tags[tag]];
        
        switch (tagopt.warn) {
            case -1: // no warn
                return false;
            case 0:
                break;
            case 1: // if level 7
                if (data.team === TEAM_ENL && data.level >= 7)  res = ': is Level 7+ ('+tags[tag]+')';
                break;
            case 2: // if level 8
                if (data.team === TEAM_ENL && data.level >= 8)  res = ': is Level 8 ('+tags[tag]+')';
                break;
            case 3: // if not level 7
                if (data.team === TEAM_RES && data.level < 7)   res = ': is not Level 7 ('+tags[tag]+')';
                break;
            case 4: // if not level 8
                if (data.team === TEAM_RES && data.level < 8)   res = ': is not Level 8 ('+tags[tag]+')';
                break;
            case 5: // if ENL
                if (data.team === TEAM_ENL)                     res = ': is ENL ('+tags[tag]+')';
                break;
            case 6: // if RES
                if (data.team === TEAM_RES)                     res = ': is RES ('+tags[tag]+')';
                break;
        }
    }

    return res;
 };

window.plugin.tagger.getMarkerColor = function(guid) {
  if (!window.plugin.tagger.portals[guid]) return;

    var tags = window.plugin.tagger.portals[guid].tags;

    var rescol = false;
    for (var tag in tags) {
        var tagopt = window.plugin.tagger.tagOptions[tags[tag]];
        switch (tagopt.color) {
            case 0: // no warn
                break;
            case 1: // no color
                return false;
                break;
            case 2:
                rescol = 'red';
                break;
            case 3:
                rescol = 'red';
                break;
        }
    }

    return rescol;
 };

window.plugin.tagger.highlighter =  {
  highlight: function(data) {
    var guid = data.portal.options.ent[0];

    var col = window.plugin.tagger.getMarkerColor(guid);
    if (col) {
      ddata.portal.setStyle({fillColor: col, fillOpacity: 0.7});
    }
  },

  setSelected: function(active) {
    window.plugin.tagger.isHighlightActive = active;
  }
 };

window.plugin.tagger.removeMarker = function(guid) {
  var layer = window.plugin.tagger.layers[guid];
  if (layer) {
    window.plugin.tagger.layerGroup.removeLayer(layer);
    delete plugin.tagger.layers[guid];
  }
 };

window.plugin.tagger.addMarker = function(guid,latlng) {

    window.plugin.tagger.removeMarker(guid);

    var p = window.portals[guid];

    var scale = window.portalMarkerScale();
    var options = {
      radius: 14*scale, // + (L.Browser.mobile ? PORTAL_RADIUS_ENLARGE_MOBILE*scale : 0),
      stroke: true,
      color: 'red',
      weight: 8*(scale/2),
      opacity: 1,
      fill: false,
      //fillColor: COLORS[details.team],
      //fillOpacity: 0.5,
      dashArray: null
    };

    var marker = L.circleMarker(latlng, options);

    plugin.tagger.layers[guid] = marker;
    marker.addTo(plugin.tagger.layerGroup);
 };

window.plugin.tagger.updateMarker  = function(guid) {

    if (!map.hasLayer(window.plugin.tagger.layerGroup)) {
      return;
    }

    var tagcolor = window.plugin.tagger.getMarkerColor(guid);
    if (tagcolor && window.portals[guid]) {
	window.plugin.tagger.addMarker(guid, window.portals[guid].getLatLng());
    } else {
	window.plugin.tagger.removeMarker(guid);
    }
 };

window.plugin.tagger.updateAllMarkers  = function() {

  if (!map.hasLayer(window.plugin.tagger.layerGroup)) {
    return;
  }

  for (var guid in window.plugin.tagger.layers) {
    window.plugin.tagger.layerGroup.removeLayer(window.plugin.tagger.layers[guid]);
  }
  delete window.plugin.tagger.layers;
  window.plugin.tagger.layers = {};


  for (var guid in window.plugin.tagger.portals) {

    var tagcolor = window.plugin.tagger.getMarkerColor(guid);
    if (tagcolor && window.portals[guid] && window.portals[guid]) {
	window.plugin.tagger.addMarker(guid, window.portals[guid].getLatLng());
    }
  }

 };

/***************************************************************************************************************************************************************/
window.plugin.tagger.checkAllWarnings = function() {
        for (var guid in window.portals) {
            window.plugin.tagger.warningTest(guid,window.portals[guid].options);
        }
    };

window.plugin.tagger.warningTest = function(guid,data) {
        var warntext = window.plugin.tagger.getPortalWarning(guid,data);
    	if (warntext) {
            if (window.plugin.tagger.checked_warnings.indexOf(guid)===-1 && window.plugin.tagger.current_warnings[guid]===undefined) {
            	window.plugin.tagger.current_warnings[guid] = warntext;
            }

            window.plugin.tagger.showWarnDialog();
        };
    };

window.plugin.tagger.showWarnDialog = function() {

    if (Object.keys(window.plugin.tagger.current_warnings).length>0) {

        var html='<h1>ALERT:</h1>';
        for (var guid in window.plugin.tagger.current_warnings) {
            var text = window.plugin.tagger.current_warnings[guid];
            var name = window.plugin.tagger.portals[guid].name;
            var portal_btn = '<a class="tagportalbutton" onclick="'+window.plugin.tagger.getOnPortalClickLink(guid)+'">'+name+'</a>';
            var checked_btn = '<a onclick="window.plugin.tagger.setCheckedWarning(\''+guid+'\')"> - ok - </a>';
            html += portal_btn+checked_btn+text+'</br>';
        }

        dialog({
                html: '<div id="taggerwarning">' + html + '</div>',
                dialogClass: 'ui-dialog-taggerwarn',
                title: 'Tag Warnings',
                id: 'tag-warnings',
                position: { my: "top", at: "top", of: window }
            });
    } else {
        var temp = dialog({id: 'tag-warnings'});
        temp.dialog("close");
    };
};

window.plugin.tagger.setCheckedWarning = function(guid) {
        if (window.plugin.tagger.checked_warnings.indexOf(guid)===-1) window.plugin.tagger.checked_warnings.push(guid);
        delete window.plugin.tagger.current_warnings[guid];

        window.plugin.tagger.showWarnDialog();
    };

/***************************************************************************************************************************************************************/
window.plugin.tagger.loadStorages = function() {

    if(localStorage['PortalTagger'])        window.plugin.tagger.portals = JSON.parse(localStorage['PortalTagger']);
    if(localStorage['PortalTaggerOption'])  window.plugin.tagger.tagOptions = JSON.parse(localStorage['PortalTaggerOption']);
    if(localStorage['PortalTaggerSync'])    window.plugin.tagger.syncQueue = JSON.parse(localStorage['PortalTaggerSync']);
    if(localStorage['PortalTaggerInSync'])  window.plugin.tagger.syncQueuePushed = JSON.parse(localStorage['PortalTaggerInSync']);

    window.plugin.tagger.rebuildTagListAndCount();
 };

window.plugin.tagger.rebuildTagListAndCount = function () {

    var counts = {};
    var tags = {};

    for(var guid in window.plugin.tagger.portals) {
      var portal = window.plugin.tagger.portals[guid];
      for(var i in portal.tags) {
          var tag = portal.tags[i];
          if(counts[tag]===undefined) counts[tag] = 0;
          counts[tag]++;
          
          if(!tags[tag]) {
              if(window.plugin.tagger.tagOptions[tag])
              	  tags[tag] = window.plugin.tagger.tagOptions[tag];
              else
                 tags[tag] = $.extend({},window.plugin.tagger.DEFAULT_TAGOPTION);
          }
      }
    }

    window.plugin.tagger.tagCount = counts;
    window.plugin.tagger.tagOptions = tags;
    window.plugin.tagger.saveStorageOptions();
};

window.plugin.tagger.saveStorage = function(guid) {
    console.assert(guid,"missing guid");
    localStorage['PortalTagger'] = JSON.stringify(window.plugin.tagger.portals);

    window.plugin.tagger.syncPush(guid);
  };

window.plugin.tagger.saveStorageOptions = function() {
    localStorage['PortalTaggerOption'] = JSON.stringify(window.plugin.tagger.tagOptions);
  };

window.plugin.tagger.syncfullUpdate = function () {
    window.plugin.tagger.rebuildTagListAndCount();

    for(var guid in window.portals) {
        window.plugin.tagger.updatePortal(guid);
    }

    if (window.selectedPortal)
        window.plugin.tagger.updatePortal(window.selectedPortal);

    window.plugin.tagger.checkAllWarnings();
};

window.plugin.tagger.syncPortalUpdate = function (guid) {
    window.plugin.tagger.rebuildTagListAndCount();
    window.plugin.tagger.updatePortal(guid);
    window.plugin.tagger.checkAllWarnings();
};

window.plugin.tagger.syncPush = function(guid) {
    plugin.tagger.syncQueue[guid] = window.plugin.tagger.portals[guid];
    localStorage['PortalTaggerSync'] = JSON.stringify(window.plugin.tagger.syncQueue);
    window.plugin.tagger.syncStart();
};

window.plugin.tagger.syncStart = function() {

    if (!window.plugin.tagger.enableSync) return;

    clearTimeout(plugin.tagger.syncDelaySyncTimer);

    window.plugin.tagger.syncDelaySyncTimer = setTimeout(function() {
            window.plugin.tagger.syncDelaySyncTimer = null;
            window.plugin.tagger.syncCommit();
        }, window.plugin.tagger.SYNC_DELAY);
    };

window.plugin.tagger.syncCommit = function() {
    if(!window.plugin.tagger.enableSync) return;

    $.extend(window.plugin.tagger.syncQueuePushed, window.plugin.tagger.syncQueue);
    window.plugin.tagger.syncQueue = {};
    localStorage['PortalTaggerSync'] = JSON.stringify(window.plugin.tagger.syncQueue);
    localStorage['PortalTaggerInSync'] = JSON.stringify(window.plugin.tagger.syncQueuePushed);

    window.plugin.sync.updateMap('tagger', 'portals', Object.keys(window.plugin.tagger.syncQueuePushed));
};

window.plugin.tagger.syncRegister = function() {
    if(!window.plugin.sync) return;
    window.plugin.sync.registerMapForSync('tagger', 'portals', window.plugin.tagger.syncCallback, window.plugin.tagger.syncInitialed);
};

window.plugin.tagger.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
    console.log("window.plugin.tagger.syncCallback("+pluginName+','+fieldName+")");
    if (!pluginName==='tagger' || !fieldName==='portals') return;

    if(fullUpdated) {
        console.log("window.plugin.tagger.syncCallback -> fullUpdated");
        localStorage['PortalTagger'] = JSON.stringify(window.plugin.tagger.portals);
        window.plugin.tagger.syncfullUpdate();
        return;
    }

    if(!e) return;
    if(e.isLocal) {
        console.log("window.plugin.tagger.syncCallback -> push done: "+e.property);
        delete window.plugin.tagger.syncQueuePushed[e.property];
        localStorage['PortalTaggerInSync'] = JSON.stringify(window.plugin.tagger.syncQueuePushed);
    } else {
        console.log("window.plugin.tagger.syncCallback -> incoming: "+e.property);
        // Remote update
        delete window.plugin.tagger.syncQueue[e.property];
        delete window.plugin.tagger.syncQueuePushed[e.property];
        localStorage['PortalTaggerSync'] = JSON.stringify(window.plugin.tagger.syncQueue);
        localStorage['PortalTaggerInSync'] = JSON.stringify(window.plugin.tagger.syncQueuePushed);
        localStorage['PortalTagger'] = JSON.stringify(window.plugin.tagger.portals);
                
        window.plugin.tagger.syncPortalUpdate(e.property);
      }
  };

window.plugin.tagger.syncInitialed = function(pluginName, fieldName) {
    console.log("window.plugin.tagger.syncInitialed("+pluginName+','+fieldName+")");
    if (!pluginName==='tagger' || !fieldName==='portals') return;

    window.plugin.tagger.enableSync = true;
    if(Object.keys(window.plugin.tagger.syncQueue).length > 0 || Object.keys(window.plugin.tagger.syncQueuePushed).length > 0) {
        window.plugin.tagger.syncStart();
    }
  };


/***************************************************************************************************************************************************************/
window.plugin.tagger.onPaneChanged = function () {
        if (pane === "plugin-tags_find")
            $('#bookmarksBox').css("display", "");
        else
            $('#bookmarksBox').css("display", "none");

        if (pane === "plugin-tags_option")
            $('#bookmarksBox').css("display", "");
        else
            $('#bookmarksBox').css("display", "none");
};

/***************************************************************************************************************************************************************/
window.plugin.tagger.setupCSS = function() {
    $('head').append('<style>' +
        '@media print { #taggerButton { display: none !important; }}'  /* hide when printing */

        // Button
        + '#taggerButton{ display:block; position:absolute; overflow:hidden; top:0; left:330px; width:47px; margin-top:-36px; height:64px; height:0; cursor:pointer; z-index:2999; background-position:center bottom; background-repeat:no-repeat; transition:margin-top 100ms ease-in-out; text-indent:-100%; text-decoration:none; text-align:center;}'
        + '#taggerButton:hover{ margin-top:0;}'
        + '#taggerButton, .bkmrksStar span{ background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC8AAABPCAMAAABMDWzEAAAANlBMVEX/////zgD/zgD///////8Aru7/zgAAru4TtPAAAADA7PtAwvLk9/6b3/n///8Aru510/b/zgDZKp6YAAAACnRSTlOAxo5FtDw9mPoA9GJiegAAAklJREFUeF6dle26ozAIhFO1NkK+vP+b3WbBJRwM7dn5lad9BweoaThI63Z42hfmLn4rLv84d8WvpWxe+fNcFL+VUtzy57kLv67lrbDOqu/nW8tfQ1i3MmjbfrKPc9BjCYfiy2qjjNoDZRfcaBnxnl8Mm8KN4bFzv6q6lVT/P369+DBZFmsZ+LAmWbHllz7XB/OBwDDhF1rVIvwFhHt+vw4dqbViKdC0wHySSsE3e/FxpHPpAo+vUehUSCk7PBuYTpCUw/JsAIoipzlfUTHimPGNMujQ7LA86sSqm2x4BFXbOjTPSWJFxtgpbRTFd+VITdPGQG3b8hArCbm7n9vVefqZxT8I0G2Y+Yi4XFNy+Jqpn695WlP6ksdWSJB9PmJrkMqolADyjIdyrzSrD1Pc8lND8vrNFvfnkw3u8NYAn+ev+M/7iorPH3n8Jd9+mT+b8fg8EBZb+o4n+n0gx4yPMp5MZ3LkW77XJAaZZkdmPtv7JGG9EfLLrnkS3DjiRWseej6OrnXd0ub/hQbftIPHCnfzjDz6sXjy3seKoBqXG97yqiCgmFv198uNYy7XptHlr8aHcbk8NW5veMtrg+A1Ojy3oCeLDs9zgfEHEi2vu03INu4Y/fk3OVOo6N2f8u5IqDs+NvMaYOJQaHj5rut1vGIda/zk5dmdfh7H8XypUJpP0luNne56xnEdildRRPyIfMMDSnGWhEJQvEQZittQwoONYkP946OOMnsERuZNFKMXOYiXkXsO4U0UL1QwffqPCH4Us4xgovih/gBs1LqNE0afwAAAAABJRU5ErkJggg==);}'

        // Dialog
        + '.taggerFrame {background-color: rgba(8, 48, 78, 0.9); border: 1px; border-color: rgba(16, 112, 138, 1);border-style: solid; display:block; position:absolute !important; z-index:4001; top:100px; left:100px; width:231px; height:auto; overflow:hidden;}'
        + '.taggerHeadBar {height:14px !important; background-color: rgba(20, 60, 80, 0.9);}'
        + '.taggerHeadButton { width:10%; cursor:pointer; color:#20a8b1; font-weight:bold; text-align:center; line-height:13px; font-size:12px; float:left}'
        + '.taggerHeadButtonRight { float:right !important;}'
        + '.taggerHeadhandle {width:80%; text-align:center; color:#fff; line-height:10px; cursor:move; float:left}'
        //+ '#taggerListBox {background-color: rgba(8, 48, 78, 0.9); border: 1px; border-color: rgba(16, 112, 138, 1);border-style: solid; display:block; position:absolute !important; z-index:4001; top:100px; left:100px; width:231px; height:auto; overflow:hidden;}'
        //+ '#taggerListBox *{display:block; padding:0; margin:0; width:auto; height:auto; font-family:Verdana,Geneva,sans-serif; font-size:13px; line-height:22px; text-indent:0; text-decoration:none; -webkit-box-sizing:border-box; -moz-box-sizing:border-box; box-sizing:border-box; }'

        + '#taggerPortalFrame .tagportallist {margin: 1px 5px 1px 5px; color:#eee; border: 1px; border-color: rgba(16, 112, 138, 1); border-style: solid;}'
        + '#taggerPortalFrame .tagportalbutton {color: #FFCE00; text-overflow: ellipsis;}'

        + '#taggerOptionFrame {width:300px !important;}'
        + '#taggerOptionFrame .tagline {margin: 0px 5px 0px 5px;}'
        + '#taggerOptionFrame .tagname {width: 100px; float:left; margin: 0px 5px 0px 5px; color:#eee; overflow:hidden;text-overflow: ellipsis;}'
        + '#taggerOptionFrame .tagline_select {width:50px;}'

        + '#taggerSearchBox {display:block; height:auto; overflow:hidden; transition:margin-top 100ms ease-in-out; margin:0px 10px 0px 5px;}'
        + '#taggerSearchBox .tagcount {font-size:9px; color:#eee; float: right;}'

        // Tags
        + '#taggerContainer { height: 26px; }'
        + '#taggerContainer .taggerTagButton { -webkit-border-radius: 18px; -moz-border-radius: 18px; border-radius: 18px; font-family: Arial; color: #ffffff !important; font-size: 16px; background: #3498db; padding: 3px 5px 3px 5px; text-decoration: none; float: left;}'
        + '#taggerContainer .taggerTagButton:hover{ background: #3cb0fd; background-image: -webkit-linear-gradient(top, #3cb0fd, #3498db); background-image: -moz-linear-gradient(top, #3cb0fd, #3498db); background-image: -ms-linear-gradient(top, #3cb0fd, #3498db); background-image: -o-linear-gradient(top, #3cb0fd, #3498db); background-image: linear-gradient(to bottom, #3cb0fd, #3498db); text-decoration: none;}'
        + '#taggerContainer .taggerTagDelete { -webkit-border-radius: 10px; -moz-border-radius: 10px; border-radius: 16px; font-family: Arial; color: #ffffff; font-size: 10px; background: #444; text-decoration: none;}'
        + '.taggerAddButton {float: right !important}'

        ///////////// MOBILE
        + '.taggerFrame.mobile{ background-color: rgba(8, 48, 78, 0.9); display:block; z-index:4001;position:absolute !important; width: 100% !important; height: 100% !important; left: 0 !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: transparent !important; overflow:auto !important;'
        + '.taggerFrame.mobile .taggerHeadhandle { display:none !important; }'

        + '</style>');
 };

window.plugin.tagger.setupContent = function() {
    plugin.tagger.htmlBoxTrigger = '<a id="taggerButton" onclick="window.plugin.tagger.showTaggerOptionDialog(\'\')">Tags</a>';

    plugin.tagger.htmlTagPortalFrame = '<div id="taggerPortalFrame" class="taggerFrame">'
                          +'<div class="taggerHeadBar">'
                            +'<a class="taggerHeadButton" onclick="window.plugin.tagger.onOpenOptions()" title="Options">OPT</a>'
                            +'<div class="taggerHeadhandle">Tags</div>'
                            +'<a class="taggerHeadButton taggerHeadButtonRight" onclick="window.plugin.tagger.hideTaggerPortalDialog()" title="Close">X</a>'
                           +'</div>'
                          +'<div id="tagfilter">'
                            +'<div class="addForm">'
			      +'<input placeholder="<search>" type="text" onkeydown="window.plugin.tagger.onChangedPortalFilter(event)"/>'
                            +'</div>'
                            +'<div id="tagportallist">'
                            +'</div>'
                          +'</div>'
                          +'<div style="border-bottom-width:1px;"></div>'
                        +'</div>';

    plugin.tagger.htmlTagOptionsFrame = '<div id="taggerOptionFrame" class="taggerFrame">'
                          +'<div class="taggerHeadBar">'
                            +'<div class="taggerHeadhandle">Tag-Options</div>'
                            +'<a class="taggerHeadButton taggerHeadButtonRight" onclick="window.plugin.tagger.hideTaggerOptionDialog()" title="Close">X</a>'
                           +'</div>'
                          +'<div id="tagfilter">'
                            +'<div class="addForm">'
			      +'<input placeholder="<search>" type="text" onkeydown="window.plugin.tagger.onChangedTagFilter(event)"/>'
                            +'</div>'
                            +'<div id="taglist">'
                            +'</div>'
                          +'</div>'
                          +'<div style="border-bottom-width:1px;"></div>'
                        +'</div>';

    plugin.tagger.htmlTagContainer = '<div id="taggerContainer"/>';
    plugin.tagger.htmlTagSearchBox = '<div id="taggerSearchBox" style="height: 0">'
                          +'<div id="tag_filter">'
                            +'<div class="addForm">'
                              +'<input placeholder="<tags>" type="text"/>'
                            +'</div>'
                          +'</div>'
                          +'<div style="border-bottom-width:1px;"></div>'
                        +'</div>';

    plugin.tagger.htmlTagAdd = '<a class="taggerTagButton taggerAddButton" onclick="window.plugin.tagger.addTagDialog();">+</a>';
    plugin.tagger.htmlTag = '<div class="taggerTagButton"><a onclick="window.plugin.tagger.showTaggerPortalDialog(\'%NAME%\')">%NAME%</a>'
			  + '<a class="taggerTagDelete" onclick="window.plugin.tagger.onTagDelete(\'%NAME%\')">X</a></div>';
    
 };

window.plugin.tagger.injectContent = function() {

        if (window.isSmartphone()) {
            $('body').append(window.plugin.tagger.htmlTagOptionsFrame + window.plugin.tagger.htmlTagPortalFrame);
            $('#taggerPortalFrame').css("display", "none").addClass("mobile");
            $('#taggerOptionFrame').css("display", "none").addClass("mobile");

            if (window.useAndroidPanes()) {
                android.addPane("plugin-tags_find", "Find Tags", "ic_action_search");
                android.addPane("plugin-tags_option", "Tag Options", "ic_action_place");
            }
            window.addHook('paneChanged', window.plugin.tagger.onPaneChanged);

        } else {

            $('body').append(window.plugin.tagger.htmlTagOptionsFrame + window.plugin.tagger.htmlTagPortalFrame);
            $('#taggerPortalFrame').draggable({handle: '.taggerHeadhandle', containment: 'window'});
            $('#taggerOptionFrame').draggable({handle: '.taggerHeadhandle', containment: 'window'});
	    $('#toolbox').append(' <a onclick="window.plugin.tagger.showTaggerPortalDialog()" title="Find Portal by tags">Find Tag</a>');

        }


//    // FAKE MOBILE
//    $('#taggerPortalFrame').css("display", "none").addClass("mobile");
//    $('#taggerOptionFrame').css("display", "none").addClass("mobile");

 };

/***************************************************************************************************************************************************************/
var setup = function() {
    window.plugin.tagger.loadStorages();

    // Layer/Highlight
    window.addPortalHighlighter('Portal Tags', window.plugin.tagger.highlighter);
    window.plugin.tagger.layerGroup = new L.LayerGroup();
    window.addLayerGroup('Portal Tags', window.plugin.tagger.layerGroup, false);

    // Hooks
    window.addHook('portalDetailsUpdated', window.plugin.tagger.addTagView);
    window.addHook('mapDataRefreshEnd', function() { window.plugin.tagger.updateAllMarkers(); window.plugin.tagger.checkAllWarnings(); });
    window.map.on('overlayadd overlayremove', function() { window.plugin.tagger.updateAllMarkers(); });
    window.addHook('iitcLoaded', window.plugin.tagger.syncRegister);

    // Inject contents
    window.plugin.tagger.setupCSS();
    window.plugin.tagger.setupContent();
    window.plugin.tagger.injectContent();

    window.plugin.tagger.hideTaggerOptionDialog();
    window.plugin.tagger.hideTaggerPortalDialog();
};

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
