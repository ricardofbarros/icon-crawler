// Dependencies
var fs = require('fs');
var redis = require('redis');
var crypto = require('crypto');
var path = require('path');
var mdkirp = require('mdkirp');
var download = require('download');
var util = require('./util');

// TODO review this
// Default names:
// favicon.*
// apple-touch.*
// msapp.*
// fluidapp.*
// icon.svg

// Helepr function
function generateFilePath (href) {
  var hash = crypto.createHash('md5').update(href).digest('hex');
  return path.resolve(hash.substr(0, 2), hash.substr(2, 2), hash);
}

function Cache (href) {
  this.filePath = generateFilePath(href);
}

Cache.prototype.__storeFile = function () {

};

Cache.prototype.storeFavicon = function (href) {
  var filePath = this.__generateFilePath(filename);

};

Cache.prototype.storeSvg = function () {

};

Cache.prototype.storeFluidapp = function () {

};

Cache.prototype.storeMsapp = function () {

};

Cache.prototype.storeAppleTouch = function () {

};

module.exports = function cache (type, href) {
  var cache = new Cache(href);

  // Smart hack to call the exact method we need
  if (type !== 'apple-touch') {
    cache['store' + util.capitalizeFirstLetter(type)]();
  }

  // Exception because its
  // 'apple-touch' and the algorithm up
  // there wouldn't work
  cache.storeAppleTouch();
};
