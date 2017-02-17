"use strict";

var fs = require('fs');
var path = require('path');

// base: BannerWebpackPlugin https://github.com/lcxfs1991/banner-webpack-plugin
var ConcatSource = require("webpack-sources").ConcatSource;


function GMBannerPlugin(options) {
    this.options = options || {};
    this.headers = {};
}


function getMetaFilename(compilation, chunkFilename) {

  let pname = compilation.options.output.path;
  let fname = compilation.options.output.filename; // chunkFilename?
  fname = fname.replace(/\[name\]/,chunkFilename);

  let name = path.resolve(pname,fname)
  name = name.replace(/\.user\.js$/,'');
  return name+'.meta.js';
}


GMBannerPlugin.prototype.apply = function(compiler) {
  compiler.plugin("emit", (compilation, callback) => {


    let chunks = compilation.chunks;
    for (let i = 0, len = chunks.length; i < len; i++) {
      let file = chunks[i].files[0];

      let meta_fname = getMetaFilename(compilation, chunks[i].name);
      try {
        var meta_data = fs.readFileSync(meta_fname, {encoding: 'utf8'}).toString();
      } catch (err) {};

      if (meta_data) {
        compilation.assets[file] = new ConcatSource(meta_data, compilation.assets[file]);
      }
    };

    callback();
  });
};




module.exports = GMBannerPlugin;
