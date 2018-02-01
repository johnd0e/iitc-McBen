var fs = require('fs');
var glob = require("glob");
var showdown  = require('showdown');


var buildDate;
var dateTimeVersion;
var downloadUrl,updateUrl,buildName;


function macro_loader(source) {
  this.cacheable();

  let now = new Date();
  buildDate = strftime('%Y-%m-%d-%H%M%S',now);
  dateTimeVersion = strftime('%Y%m%d.',now) + strftime('%H%M%S',now).replace(/^0*/g, '');

  if (this.options.distUrlBase) {
    downloadUrl = path.join(this.options.distUrlBase, this._module.rawRequest);
    updateUrl = downloadUrl.replace(/\.user\.js$/, '.meta.js');
  }

  buildName = this.options.buildName || 'none';

  return doReplacemenets(source);
}


function strftime(sFormat, date) {
  if (!(date instanceof Date)) date = new Date();
  var nDay = date.getDay(),
    nDate = date.getDate(),
    nMonth = date.getMonth(),
    nYear = date.getFullYear(),
    nHour = date.getHours(),
    aDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    aMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    aDayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
    isLeapYear = function() {
      if ((nYear&3)!==0) return false;
      return nYear%100!==0 || nYear%400===0;
    },
    getThursday = function() {
      var target = new Date(date);
      target.setDate(nDate - ((nDay+6)%7) + 3);
      return target;
    },
    zeroPad = function(nNum, nPad) {
      return ('' + (Math.pow(10, nPad) + nNum)).slice(1);
    };
  return sFormat.replace(/%[a-z]/gi, function(sMatch) {
    return {
      '%a': aDays[nDay].slice(0,3),
      '%A': aDays[nDay],
      '%b': aMonths[nMonth].slice(0,3),
      '%B': aMonths[nMonth],
      '%c': date.toUTCString(),
      '%C': Math.floor(nYear/100),
      '%d': zeroPad(nDate, 2),
      '%e': nDate,
      '%F': date.toISOString().slice(0,10),
      '%G': getThursday().getFullYear(),
      '%g': ('' + getThursday().getFullYear()).slice(2),
      '%H': zeroPad(nHour, 2),
      '%I': zeroPad((nHour+11)%12 + 1, 2),
      '%j': zeroPad(aDayCount[nMonth] + nDate + ((nMonth>1 && isLeapYear()) ? 1 : 0), 3),
      '%k': '' + nHour,
      '%l': (nHour+11)%12 + 1,
      '%m': zeroPad(nMonth + 1, 2),
      '%M': zeroPad(date.getMinutes(), 2),
      '%p': (nHour<12) ? 'AM' : 'PM',
      '%P': (nHour<12) ? 'am' : 'pm',
      '%s': Math.round(date.getTime()/1000),
      '%S': zeroPad(date.getSeconds(), 2),
      '%u': nDay || 7,
      '%V': (function() {
              var target = getThursday(),
                n1stThu = target.valueOf();
              target.setMonth(0, 1);
              var nJan1 = target.getDay();
              if (nJan1!==4) target.setMonth(0, 1 + ((4-nJan1)+7)%7);
              return zeroPad(1 + Math.ceil((n1stThu-target)/604800000), 2);
            })(),
      '%w': '' + nDay,
      '%x': date.toLocaleDateString(),
      '%X': date.toLocaleTimeString(),
      '%y': ('' + nYear).slice(2),
      '%Y': nYear,
      '%z': date.toTimeString().replace(/.+GMT([+-]\d+).+/, '$1'),
      '%Z': date.toTimeString().replace(/.+\((.+?)\)$/, '$1')
    }[sMatch] || sMatch;
  });
}



// plugin wrapper code snippets. handled as macros, to ensure that
//# 1. indentation caused by the "function wrapper()" doesn't apply to the plugin code body
//# 2. the wrapper is formatted correctly for removal by the IITC Mobile android app
var pluginWrapperStart = `
function wrapper(plugin_info) {
 // ensure plugin framework is there, even if iitc is not yet loaded
 if(typeof window.plugin !== 'function') window.plugin = function() {};

 //PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
 //(leaving them in place might break the 'About IITC' page or break update checks)
 plugin_info.buildName = '@@BUILDNAME@@';
 plugin_info.dateTimeVersion = '@@DATETIMEVERSION@@';
 plugin_info.pluginId = '@@PLUGINNAME@@';
 //END PLUGIN AUTHORS NOTE
`

var pluginWrapperEnd = `
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
`
function readfile(fn) {
  return fs.readFileSync(fn, {encoding: 'utf8'}).toString();
}

function loaderRaw(match,param) {
  return readfile(param);
}

function loaderString(match,param) {
  let text = readfile(param);
  return text.replace(/\n/g, '\\n').replace(/'/g, '\\\'');
}

function loaderMD(match,param) {
  let text = readfile(param);
  let converter = new showdown.Converter();
  let html = converter.makeHtml(text).replace(/\n/g, '').replace(/'/g, '\\\'');
  return html;
}

function loaderImage(match,param) {
  let binary = fs.readFileSync(param);
  return 'data:image/png;base64,'+binary.toString('base64');
}

function loadCode() {
  let alltext=[];

  let files = glob.sync('code/*.js');
  files.sort();

  for (let fname of files) {
    alltext.push(fs.readFileSync(fname));
  }

  return alltext.join('\n\n;\n\n');
}



function doReplacemenets(source,run=0) {

  if (run>30) throw('macro-loader too much recursions');

  let old_source = source;

  source = source.replace(/@@INJECTCODE@@/, loadCode);

  source = source.replace(/@@PLUGINSTART@@/g, pluginWrapperStart);
  source = source.replace(/@@PLUGINEND@@/g, pluginWrapperEnd);

  source = source.replace(/@@INCLUDERAW:([0-9a-zA-Z_./-]+)@@/g, loaderRaw);
  source = source.replace(/@@INCLUDESTRING:([0-9a-zA-Z_./-]+)@@/g, loaderString);
  source = source.replace(/@@INCLUDEMD:([0-9a-zA-Z_./-]+)@@/g, loaderMD);
  source = source.replace(/@@INCLUDEIMAGE:([0-9a-zA-Z_./-]+)@@/g, loaderImage);

  source = source.replace(/@@BUILDDATE@@/g, buildDate);
  source = source.replace(/@@DATETIMEVERSION@@/g, dateTimeVersion);

  source = source.replace(/@@BUILDNAME@@/g, buildName);
  source = source.replace(/@@UPDATEURL@@/g, updateUrl || '');
  source = source.replace(/@@DOWNLOADURL@@/g, downloadUrl  || '');

  //source = source.replace(/@@PLUGINNAME@@/g, pluginName);

  if (old_source !== source) {
    source = doReplacemenets(source,run+1);
  }

  return source;
}


module.exports = macro_loader;
