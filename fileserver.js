const express = require('express');
const fs = require('fs');
const glob = require('glob');

const port = 8101;
var publicDir = 'build/local/';

if (process.argv.length > 2) {
    publicDir = process.argv[2];
}




IndexPage = function(req, res) {

    function scriptList() {

        let script_meta = getAllScripts();


        let main_idx = script_meta.findIndex( x => x['name']=== 'IITC: Ingress intel map total conversion' );
        var html = createScriptBlock( script_meta[main_idx] );
        script_meta.splice(main_idx,1);


        let grouped = groupBy(script_meta,'category');

        for (var category in grouped) {
            html += `<label class='collapse' for='${category}'><h1>${category}</h1></label>`;
            html += `<input id='${category}' type='checkbox' checked>`;
            html += '<div>';

            grouped[category].forEach( meta => {
                html += createScriptBlock( meta );
            });

            html += '</div>';
        }

        return html;
    }


    function groupBy(xs, key) {
    return xs.reduce(function(rv, x) {
      v = x[key] || 'none';
      rv[v] = rv[v] || [];
      rv[v].push(x);
      return rv;
    }, {});
    }


    function getAllScripts() {
    let script_meta = [];
    let files = glob.sync(publicDir+'**/*.user.js');
    files.forEach(file => {
      let meta = readScriptMeta(file);
      script_meta.push(meta);
    });

    return script_meta; 
    }

    function readScriptMeta(filename) {
        let contents = fs.readFileSync(filename).toString();

        let meta = { filename: filename.substr(publicDir.length) };

        /*let metaregex = /\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==\n/m;
        let matches = metaregex.exec(contents);
        if (!matches || matches.length===0) return meta;
        */

        let regex = /^\s*\/\/\s*@(\w+)\s+(.+)$/mg;// example: "// @key values"
        let match = regex.exec(contents);//matches[1]);
        while (match !== null) {
            meta[match[1]] = match[2];
            match = regex.exec(contents);
        }

        return meta;
    }

    function createScriptBlock(meta) {
        let name = meta['name'] || 'unknown';
        let desc = meta['description']; // .gsub(/^\[.*\]/,'')

        return `
        <div class='script'>
          <a href='${meta['filename']}'>${name}</a> <span>${meta['version']}</span><br>
          <div class='desc'>${desc}</div>
        </div>`;
    }

    function css() {
        return `
            body { font-family: arial; }
            h1 { border-bottom: 1px solid; font-size: 1.2em; }
            .desc { margin-left: 2em; background: #ececec; }
            .script { padding-bottom: 0.3em; }
            .script span { font-size: 0.8em; }
            .collapse{  cursor: pointer;  display: block;  background: #cdf;}
            .collapse + input{  display: none;}
            .collapse + input + div{  display:none;}
            .collapse + input:checked + div{  display:block;}
        `;
    }


    res.send('<!DOCTYPE html><html><head><style>'+css()+'</style></head><body>'+scriptList()+'</body>');
};






var app = express();
app.get('/', IndexPage);
app.get('/index', IndexPage);
app.use(express.static(publicDir));

app.listen(port, function () {
    console.log('ScriptServer listening at http://localhost:%s', port);
    console.log('  serving files from %s', publicDir);
});
