const express = require('express')
const fs = require('fs');

const port = 8100;
const basedir = 'dist2/';


var app = express()
app.get('/', sendIndex);
app.get('/index', sendIndex);
app.get('/:name', sendFile);

app.listen(port, function () {
  console.log(`Server: http://localhost:${port}`);
});


function sendFile(req, res, next) {

  var options = {
    root: __dirname + '//..//out/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = req.params.name;
  res.sendFile(fileName, options, err => {
    if (err) {
      next(err);
    }
  });
};



function sendIndex(req, res) {

  function scriptList() {

    let script_meta = [];
    fs.readdirSync(basedir).forEach(file => {
      let meta = readScriptMeta(file);
      script_meta.push(meta)
    });

    var html='';
    script_meta.forEach(meta => {
      html += createScriptBlock( meta );
    });

    return html;
  }


  function readScriptMeta(filename) {
    let contents = fs.readFileSync(basedir+filename).toString();

    let meta = { filename: filename };

    let regex = /^\s*\/\/\s*@(\w+)\s+(.+)$/mg // example: "// @key values"
    let match = regex.exec(contents)
    while (match != null) {
      meta[match[1]] = match[2]
      match = regex.exec(contents);
    }

    return meta;
  }

  function createScriptBlock(meta) {
    let name = meta['name'] || 'unknown';
    let desc = meta['description'] // .gsub(/^\[.*\]/,'')

    return `<div><a href=''>${name} (${meta['filename']})</a>  ver: ${meta['version']}<br></div>`;

    `<div class='script'>
      <a href='${meta['filename']}'>${name}</a> <span>${meta['version']}</span><br>
      <div class='desc'>${desc}</div>
    </div>`
  }

  function css() {
    return `
      body {
        font-family: arial;
      }
      h1 {
        border-bottom: 1px solid;
        font-size: 1.2em;
      }
      .desc {
        margin-left: 2em;
        background: #ececec;
      }
      .script {
        padding-bottom: 0.3em;
      }
      .script span {
        font-size: 0.8em;
      }
      .collapse{  cursor: pointer;  display: block;  background: #cdf;}
      .collapse + input{  display: none;}
      .collapse + input + div{  display:none;}
      .collapse + input:checked + div{  display:block;}
    `;
  }

  res.send('<!DOCTYPE html><html><head><style>'+
    css()+
    '</style></head><body>'+
    scriptList()+'</body>'
  );
}




