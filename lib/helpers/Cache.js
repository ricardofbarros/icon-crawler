// Dependencies
var fs = require('fs');
var redis = require('redis');
var crypto = require('crypto');
var path = require('path');
var mkdirp = require('mkdirp');
// var util = require('lib/util');
// var url = require('url'); // need to change name, cuz name collision
var request = require('request');

// create redis client
var client = redis.createClient();

client.on('error', function (err) {
  // Do something
});

// TODO review this
// Default names:
// favicon -> favicon.*
// appple-touch -> apple-touch.*
// msapp.*
// fluidapp.*
// icon.svg

// Helper function
function generateFilePath (domain) {
  var hash = crypto.createHash('md5').update(domain).digest('hex');
  return 'tmp/' + hash.substr(0, 2) + '/' + hash.substr(2, 2) + '/' + domain;
}

function Cache (domain) {
  // TODO check if this domain
  // is in WIP (Work in Progress)
  this.domain = domain;
  this.dirPath = generateFilePath(domain);
  this.absoluteDirPath = path.resolve(__dirname, '..', this.dirPath);
  this.multi = client.multi();
}

Cache.prototype.__downloadAndStoreFile = function (filePath) {
  var self = this;

  return mkdirp('../tmp/' + this.dirPath, function (err, success) {
    if (err) {
      throw err;
    }

    if (!success) {
      return console.error(new Error('Could\'t create the directory to cache the files'));
    }

    // Store it!
    return request(self.href).pipe(fs.createWriteStream(filePath));
  });
};

Cache.prototype.__storeFilePath = function (type, filePath) {
  return client.hset(this.domain, type, filePath);
  // 'favicon',
  // 'svg',
  // 'fluidapp',
  // 'msapp',
  // 'apple-touch'
};

Cache.prototype.__storeFavicon = function () {

};

Cache.prototype.__storeSvg = function (url) {

};

Cache.prototype.__storeFluidapp = function (url) {

};

Cache.prototype.__storeMsapp = function (url) {

};

Cache.prototype.__storeAppleTouch = function (url) {

};

Cache.prototype.store = function (urlsObj) {
  console.log('called store', urlsObj);
};

module.exports = Cache;
