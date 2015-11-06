
var jsdom = require('jsdom');
var fs = require('fs');
var html  = fs.readFileSync(__dirname+'/../data/Ingress\ Intel\ Map.html').toString()
var doc = jsdom.jsdom('<html></html>');


window = doc.parentWindow;
$ = global.jQuery = require('jquery')(window);

  
