

function gm_loader(source) {
  this.cacheable();

  let regex = /\/\/\s*==UserScript==[^]*?\/\/\s*==\/UserScript==\n/m;

  let matches = regex.exec(source);
  if (matches===null) {
    return source;
  }

  console.assert(this._module, 'internal data-access required');
  this._module.GM_DATA = parseMetaBlock(matches[0]);

  source = source.replace(regex,'');

  return source;
}


function parseMetaBlock(metaString) {

  let meta = {};

  let regex = /^\s*\/\/\s*@(\S+)[ \t]+(\S.+)$/mg;// example: "// @key values"
  let match = regex.exec(metaString);
  while (match !== null) {

    let key = match[1];

    if (meta[key]) {
      if (typeof(meta[key])!=='object') meta[key] = [meta[key]];
      meta[key].push(match[2]);
    } else {
      meta[key] = match[2];
    }

    match = regex.exec(metaString);
  }

  return meta;
}



module.exports = gm_loader;
