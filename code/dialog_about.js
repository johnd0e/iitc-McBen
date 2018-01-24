
window.aboutIITC = function() {
  var v = (script_info.script && script_info.script.version || script_info.dateTimeVersion) + ' ['+script_info.buildName+']';
  if (typeof android !== 'undefined' && android && android.getVersionName) {
    v += '[IITC Mobile '+android.getVersionName()+']';
  }

  var plugins = '<ul>';
  for (var i in bootPlugins) {
    var info = bootPlugins[i].info;
    if (info) {
      var pname = info.script && info.script.name || info.pluginId;
      if (pname.substr(0,13) == 'IITC plugin: ' || pname.substr(0,13) == 'IITC Plugin: ') {
        pname = pname.substr(13);
      }
      var pvers = info.script && info.script.version || info.dateTimeVersion;

      var ptext = pname + ' - ' + pvers;
      if (info.buildName != script_info.buildName) {
        ptext += ' ['+(info.buildName||'<i>non-standard plugin</i>')+']';
      }

      plugins += '<li>'+ptext+'</li>';
    } else {
      // no 'info' property of the plugin setup function - old plugin wrapper code
      // could attempt to find the "window.plugin.NAME = function() {};" line it's likely to have..?
      plugins += '<li>(unknown plugin: index '+i+')</li>';
    }
  }
  plugins += '</ul>';

  var attrib = '@@INCLUDEMD:ATTRIBUTION.md@@';
  var contrib = '@@INCLUDEMD:CONTRIBS.md@@'

  var a = ''
  + '  <div><b>About IITC</b></div> '
  + '  <div>Ingress Intel Total Conversion</div> '
  + '  <hr>'
  + '  <div>'
  + '    <a href="http://iitc.me/" target="_blank">IITC Homepage</a><br />'
  + '     On the script’s homepage you can:'
  + '     <ul>'
  + '       <li>Find Updates</li>'
  + '       <li>Get Plugins</li>'
  + '       <li>Report Bugs</li>'
  + '       <li>Contribute!</li>'
  + '     </ul>'
  + '  </div>'
  + '  <div>'
  + '    MapQuest OSM tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="https://developer.mapquest.com/content/osm/mq_logo.png">'
  + '  </div>'
  + '  <hr>'
  + '  <div>Version: ' + v + '</div>'
  + '  <div>Plugins: ' + plugins + '</div>'
  + '  <hr>'
  + '  <div>' + attrib + '</div>'
  + '  <hr>'
  + '  <div>' + contrib + '</div>';

  dialog({
    title: 'IITC ' + v,
    html: a,
    dialogClass: 'ui-dialog-aboutIITC',
    id: 'aboutIITC'
  });
}
