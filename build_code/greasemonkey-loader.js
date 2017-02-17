var fs = require('fs');
var path = require('path');
var loaderUtils = require('loader-utils');


function gm_loader(source) {
  this.cacheable();

  //console.log( loaderUtils.interpolateName(this, this.resourcePath,source) );

  return extractHeader(source, getMetaFilename(this, this.resourcePath));
}


function getMetaFilename(compilation, chunkFilename) {

  var idx = chunkFilename.lastIndexOf(".");
  var i = chunkFilename.lastIndexOf("\\");
  var j = chunkFilename.lastIndexOf("/");
  var p = i < 0 ? j : j < 0 ? i : i < j ? i : j;
  if (idx >= 0) {
    chunkFilename = chunkFilename.substr(0, idx);
  }
  if (p >= 0) {
    chunkFilename = chunkFilename.substr(p+1);
  }
  let pname = compilation.options.output.path;
  let fname = compilation.options.output.filename; // chunkFilename?
  fname = fname.replace(/\[name\]/,chunkFilename);

  let name = path.resolve(pname,fname)
  name = name.replace(/\.user\.js$/,'');
  return name+'.meta.js';
}


function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}


function extractHeader(source, meta_filename) {

  let regex = /\/\/\s*==UserScript==[^]*?\/\/\s*==\/UserScript==\n/m;

  let matches = regex.exec(source);
  if (matches===null) {
    return source;
  }

  ensureDirectoryExistence(meta_filename);
  fs.writeFileSync(meta_filename, matches[0]);

  source = source.replace(regex,'');

  return source;
}


module.exports = gm_loader;
