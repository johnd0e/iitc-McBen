const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const GMAddonBannerPlugin = require('./greasemonkey-plugin');



function getSourceFiles() {

  var files = glob.sync('./plugins/*.user.js');
  files = files.reduce(function(map, obj) {
    map[obj] = obj;
    return map;
  }, {});

  files['total-conversion-build.user.js']='./main.js';

  return files;
}


module.exports = {

  entry: getSourceFiles(),

  performance: { hints: false }, // not for RELEASE

  output: {
    path: path.resolve(__dirname, '../dist2'),
    filename: '[name]',
    publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          path.join(__dirname,'greasemonkey-loader.js'),
          { loader: path.join(__dirname,'macro-loader.js'), options: { distUrlBase: 'None' } }
        ]
      },
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
    new GMAddonBannerPlugin(
      {
        namespace:      'https://github.com/jonatkins/ingress-intel-total-conversion',
        updateURL:      'http://localhost:8100/[file]',
        downloadURL:    'http://localhost:8100/[file]',
        match:          ['*://*.ingress.com/intel*', '*://*.ingress.com/mission/*'],
      }),

    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
};
