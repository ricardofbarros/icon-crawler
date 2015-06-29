// Dependencies
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var mkdirp = require('mkdirp');
var util = require('lib/util');
var config = require('config.js');
var fs = require('fs');
var async = require('async');
var http = require('http');
var mime = require('mime');
var Metadata = require('./FileCache/Metadata');
var nodeUrl = require('url');

// Helper function
function generateFilePath (domain) {
  var hash = crypto.createHash('md5').update(domain).digest('hex');
  return 'tmp/' + hash.substr(0, 2) + '/' + hash.substr(2, 2) + '/' + domain;
}

function FileCache (domain) {
  this.domain = domain.replace(/^http(s*):\/\//, '');
  this.dirPath = generateFilePath(this.domain);
  this.absoluteDirPath = path.resolve(__dirname, '../..', this.dirPath);
  this.metadata = new Metadata(domain);
}

FileCache.prototype.__createTmpDirectory = function (cb) {
  return mkdirp(this.absoluteDirPath, cb);
};

FileCache.prototype.__downloadAndStoreFile = function (type, href, cb) {
  var self = this;

  var req = http.request(href, function (res) {
    // Content-type must be honored
    if (!res.headers['content-type']) {
      return;
    }

    // Generate a filename as specifed
    // and resolve the path to it
    var filename = type + '.' + mime.extension(res.headers['content-type']);
    var filePath = path.resolve(self.absoluteDirPath, filename);

    // Create a write stream
    var w = fs.createWriteStream(filePath);

    w.on('error', function (err) {
      return cb(err);
    });

    w.on('finish', function () {
      return cb(null, {
        type: type,
        filePath: filePath.replace(config.app.directoryPath, '')
      });
    });

    res.pipe(w);
  });

  req.on('error', function (err) {
    console.error('Error downloading ' + href);
    return cb(err);
  });

  req.end();
};

FileCache.prototype.__storeFavicon = function (url, cb) {
  return this.__downloadAndStoreFile(config.app.types.favicon, url, cb);
};

FileCache.prototype.__storeSvg = function (url, cb) {
  return this.__downloadAndStoreFile(config.app.types.svg, url, cb);
};

FileCache.prototype.__storeFluid = function (url, cb) {
  return this.__downloadAndStoreFile(config.app.types.fluid, url, cb);
};

FileCache.prototype.__storeMsapp = function (url, cb) {
  return this.__downloadAndStoreFile(config.app.types.msapp, url, cb);
};

FileCache.prototype.__storeAppleTouch = function (url, cb) {
  return this.__downloadAndStoreFile(config.app.types.appleTouch, url, cb);
};

FileCache.prototype.__exportMethods = function (urlsObj) {
  var types = config.app.types;

  var methodsMap = {};

  // Only include the methods where is a valid url
  if (urlsObj[types.favicon]) {
    methodsMap[types.favicon] = this.__storeFavicon.bind(this, urlsObj[types.favicon]);
  }
  if (urlsObj[types.svg]) {
    methodsMap[types.svg] = this.__storeSvg.bind(this, urlsObj[types.svg]);
  }
  if (urlsObj[types.fluid]) {
    methodsMap[types.fluid] = this.__storeFluid.bind(this, urlsObj[types.fluid]);
  }
  if (urlsObj[types.msapp]) {
    methodsMap[types.msapp] = this.__storeMsapp.bind(this, urlsObj[types.msapp]);
  }
  if (urlsObj[types.appleTouch]) {
    methodsMap[types.appleTouch] = this.__storeAppleTouch.bind(this, urlsObj[types.appleTouch]);
  }

  return methodsMap;
};

FileCache.prototype.store = function (urlsObj) {
  if (typeof urlsObj !== 'object') {
    return console.error(new Error('Something went wrong, cache.store called without any argument'));
  }

  var self = this;
  var types = config.app.types;

  return this.__createTmpDirectory(function (err) {
    if (err) {
      return console.error('FileCache.store (createTmpDirectory)', err);
    }

    var methodsMap = self.__exportMethods(urlsObj);

    // Exception to the rule
    if (urlsObj[types.msapp]) {
      var pos = util.searchTmpMsAppIcon(urlsObj[types.msapp]);

      // If true file was already saved
      // in tmp/__queueMsAppIcons dir
      // so we need to move it to the
      // corresponding place
      if (pos > 0) {
        var filePath = urlsObj[types.msapp].split('.');
        fs.rename(urlsObj[types.msapp].substring(pos), path.resolve(self.absoluteDirPath, types.msapp + '.' + filePath[1]));
        delete methodsMap[types.msapp];
      }
    }

    var parallelFnsArr = [];

    for (var type in methodsMap) {
      if (methodsMap.hasOwnProperty(type)) {
        parallelFnsArr.push(function (callback) {
          var type = this.type;

          return methodsMap[type](callback);
        }.bind({ type: type}));
      }
    }

    return async.parallel(parallelFnsArr, function (err, results) {
      if (err) {
        return console.error('FileCache.store (async)', err);
      }

      var obj = {};
      var domain = nodeUrl.format(config.reverseProxy.http);

      results.forEach(function (result) {
        obj[result.type] = nodeUrl.resolve(domain, result.filePath);
      });

      // Save data in redis!
      self.metadata.create(obj);
    });
  });
};

module.exports = FileCache;
