'use strict';

// base: BannerWebpackPlugin https://github.com/lcxfs1991/banner-webpack-plugin
var ConcatSource = require('webpack-sources').ConcatSource;


class GMBannerPlugin {

  constructor (options) {
    this.options = options || {};
  }

  apply(compiler) {

    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('optimize-chunk-assets', (chunks, callback) => {

        chunks.forEach((chunk) => {
          if(!chunk.isInitial()) return;

          let banner = this.generateMetaBlock(chunk);

          chunk.files
            .forEach((file) => {
              let basename;
              let query = '';
              let filename = file;
              const hash = compilation.hash;
              const querySplit = filename.indexOf('?');

              if(querySplit >= 0) {
                query = filename.substr(querySplit);
                filename = filename.substr(0, querySplit);
              }

              if(filename.indexOf('/') < 0) {
                basename = filename;
              } else {
                basename = filename.substr(filename.lastIndexOf('/') + 1);
              }

              const comment = compilation.getPath(banner, {
                hash,
                chunk,
                filename,
                basename,
                query,
              });

              return compilation.assets[file] = new ConcatSource(comment, '\n', compilation.assets[file]);
            });
        });
        callback();
      });
    });
  }


  generateMetaBlock(chunk) {
    const options = this.mergeAllOptions(chunk);
    const std_entries=['name', 'category', 'version', 'namespace', 'updateURL', 'downloadURL', 'description','match', 'grant'];

    let entries=[];
    std_entries.forEach( (cat)=>{
      if (options[cat]) {
        this.createMetaEntry(entries,cat,options[cat]);
      }
    });

    for (let cat in options) {
      if (std_entries.indexOf(cat)===-1) {
        this.createMetaEntry(entries, cat, options[cat]);
      }
    }

    return '// ==UserScript==\n'+entries.join('\n')+'\n// ==/UserScript==';
  }


  mergeAllOptions(chunk) {
    let options={};

    Object.keys(this.options).forEach(function(key) {
      options[ key ] = this.options[ key ];
    });

    chunk.modules.forEach( module => {
      if (module.GM_DATA) {
        Object.keys(module.GM_DATA).forEach(function(key) {
          options[ key ] = module.GM_DATA[ key ];
        });
      }
    });

    return options;
  }

  createMetaEntry(entries, name, value) {
    if (typeof(value)==='function') {
      value = value();
    }

    let key = ('// @' + name + ' '.repeat(16)).substr(0,20);

    if (Array.isArray(value)) {
      value.forEach((val)=> { entries.push(key+val); });
    } else {
      entries.push(key+value);
    }
  }
}


module.exports = GMBannerPlugin;
