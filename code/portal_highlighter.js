// Portal Highlighter //////////////////////////////////////////////////////////
// these functions handle portal highlighters

// an object mapping highlighter names to the object containing callback functions
window._highlighters = null;

// the name of the current highlighter
window._current_highlighter = localStorage.portal_highlighter;

window._no_highlighter = 'No Highlights';
window._menu_path = 'View/Highlight'


window.addPortalHighlighter = function(name, data) {
  if(_highlighters === null) {
    _highlighters = {};
  }

  // old-format highlighters just passed a callback function. this is the same as just a highlight method
  if (!data.highlight) {
    data = {highlight: data}
  }

  _highlighters[name] = data;

  if (typeof android !== 'undefined' && android && android.addPortalHighlighter)
    android.addPortalHighlighter(name);

  if(window._current_highlighter === undefined) {
    _current_highlighter = name;
  }

  if (_current_highlighter == name) {
    if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
      android.setActiveHighlighter(name);

    // call the setSelected callback
    if (_highlighters[_current_highlighter].setSelected) {
      _highlighters[_current_highlighter].setSelected(true);
    }

  }
  updatePortalHighlighterControl();
}


window.updatePortalHighlighterControl = function() {
  if (typeof android !== 'undefined' && android && android.addPortalHighlighter) {
    $('#portal_highlight_select').remove();
    return;
  }

  if(_highlighters !== null) {
    Menu.removeMenu(window._menu_path);

    let some_active = (_current_highlighter && _highlighters[_current_highlighter]);

    Menu.addMenu( {
      name: window._menu_path+'/'+window._no_highlighter,
      onclick: function() { changePortalHighlights();},
      isToggle: true,
      default_checked: (!some_active)
    });

    let h_names = Object.keys(_highlighters).sort();
    $.each(h_names, function(i, name) {
      Menu.addMenu( {
        name: window._menu_path+'/'+name,
        onclick: function() { changePortalHighlights(name);},
        isToggle: true,
        default_checked: (_current_highlighter===name)
      });
    });
  }
}


window.changePortalHighlights = function(name) {

  // first call any previous highlighter select callback
  if (_current_highlighter && _highlighters[_current_highlighter] && _highlighters[_current_highlighter].setSelected) {
    _highlighters[_current_highlighter].setSelected(false);
  }

  if (_current_highlighter && _highlighters[_current_highlighter]) {
    Menu.setChecked(window._menu_path+'/'+_current_highlighter, false);
  }

  _current_highlighter = name;
  if (typeof android !== 'undefined' && android && android.setActiveHighlighter)
    android.setActiveHighlighter(name);

  // now call the setSelected callback for the new highlighter
  if (name && _highlighters[name] && _highlighters[name].setSelected) {
    _highlighters[name].setSelected(true);
  }



  if (name && _highlighters[name]) {
    Menu.setChecked(window._menu_path+'/'+name, true);
    Menu.setChecked(window._menu_path+'/'+window._no_highlighter, false);
  }
  else {
    Menu.setChecked(window._menu_path+'/'+window._no_highlighter, true);
  }

  resetHighlightedPortals();
  localStorage.portal_highlighter = name;
}


window.highlightPortal = function(p) {

  if(_highlighters !== null && _highlighters[_current_highlighter] !== undefined) {
    _highlighters[_current_highlighter].highlight({portal: p});
  }
}


window.resetHighlightedPortals = function() {
  $.each(portals, function(guid, portal) {
    setMarkerStyle(portal, guid === selectedPortal);
  });
}
