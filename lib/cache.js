// Dependencies
var fs = require('fs');
var redis = require('redis');
var crypto = require('crypto');
var path = require('path');
var mdkirp = require('mdkirp');
var download = require('download');

// TODO review this
// Default names:
// favicon.*
// apple-touch.*
// msapp.*
// fluidapp.*
// icon.svg

var cache = {};

cache.__generateFilePath = function (href) {
  // TODO Do something to extract filename from href
  var filename = href;

  var hash = crypto.createHash('md5').update(filename).digest('hex');
  return path.resolve(hash.substr(0, 2), hash.substr(2, 2), hash);
};

cache.storeFavicon = function (href) {
  var filePath = this.__generateFilePath(filename);

};

cache.storeSvg = function () {

};

cache.storeFluidapp = function () {

};

cache.storeMsapp = function () {

};

cache.storeAppleTouch = function () {

};

module.exports = cache;
