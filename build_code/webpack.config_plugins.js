var path = require('path');
var glob = require("glob");
var GMPlugin = require('./greasemonkey-plugin');

var files = glob.sync("./plugins/*.user.js")
files = files.reduce(function(map, obj) {
    map[obj] = obj;
    return map;
}, {});


module.exports = {

  entry: files,

  performance: { hints: false }, // not for RELEASE

  output: {
    path: path.resolve(__dirname, '../dist2'),
    filename: "[name]",
    publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        loader: path.join(__dirname,'macro-loader.js')
      },
      {
        test: /\.js$/,
        loader: path.join(__dirname,'greasemonkey-loader.js'),
      },
      /*{
        test: /\.js$/,
        loader: 'babel-loader',
        options: { compact: false}, //, presets: ['es2015'] },
      },*/
      {
        test: /\.css$/,
        loaders: ['style-loader','css-loader']
      },
      {
        test: /\.(jpg|png|svg)$/,
        loader: 'url-loader',
        include: path.join(__dirname, 'images'),
      },
    ]
  },

  plugins: [
    new GMPlugin({})
  ]
}
