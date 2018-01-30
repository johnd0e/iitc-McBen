var path = require('path');
var webpack = require('webpack');
var GMPlugin = require('./greasemonkey-plugin');








module.exports = {

  entry: [
    './main.js',
  ],

  performance: { hints: false }, // not for RELEASE

  output: {
    path: path.resolve(__dirname, '../dist2'),
    filename: 'total-conversion-build.user.js',
    publicPath: '/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        loader: path.join(__dirname,'macro-loader.js'),
        options: {
          distUrlBase: 'None'
        }
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
};
