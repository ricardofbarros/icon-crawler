// Dependencies
var util = require('lib/util');
var request = require('request');
var async = require('async');
var url = require('url');
var MsApp = require('./IconCrawler/MsApp');
var EventEmitter = require('events').EventEmitter;
var workerFarm = require('worker-farm');
var config = require('config.js');
var cheerio = require('cheerio');

function IconCrawler (options) {
  if (!options.htmlBody || !options.domain) {
    throw new Error('missing required options from IconCrawler');
  }

  // Useful for __runWorker
  this.__htmlBody = options.htmlBody;

  if (!options.$) {
    options.$ = cheerio.load(options.htmlBody);
  }

  this.domainUrl = options.domain;
  this.$ = options.$;
}

util.inherits(IconCrawler, EventEmitter);

/**
 * Get icon/icons
 * @param  {String|Array} type Icons to be fetched
 * @param  {Function} cb
 */
IconCrawler.prototype.get = function (type, cb) {
  var self = this;
  var methodsMap;

  // Exception to the rule
  if (type === 'all') {
    methodsMap = this.exportIconMethods();

    return this.executeCrawlers(methodsMap, function (err, results) {
      if (err) {
        return cb(err);
      }

      self.emit('finish', results);

      return cb(null, results);
    });
  }

  methodsMap = this.exportIconMethods('only', type);

  return this.executeCrawlers(methodsMap, function (err, results) {
    if (err) {
      console.error(err);
    }

    self.__runWorker(type);

    return cb(null, results);
  });

};

/**
 * Fallback to see if exists in the
 * server root the file passed in
 * the arguments
 *
 * @param  {String}   file   filename
 * @param  {Function} cb     Callback
 */
IconCrawler.prototype.__fallbackRequestIcon = function (file, cb) {
  var self = this;

  var contentType;

  if (file === 'favicon.ico') {
    contentType = 'icon';
  } else if (file === 'browserconfig.xml') {
    contentType = 'xml';
  } else {
    contentType = 'png';
  }

  var href = util.getIconUrl(this.domainUrl, file);

  // 1st fallback
  return request({
    // url example -> http://example.com/favicon.ico
    url: href,
    timeout: 5000
  }, function (err, res) {
    if (err || !(res.request && res.request.href)) {
      return cb(err || new Error('Unexpected answer'));
    }

    if (res.headers['content-type'] && res.headers['content-type'].toLowerCase().search(contentType) >= 0) {
      // call callback
      return cb(null, href);
    }

    var domainFallback = url.parse(self.domainUrl);
    var href = url.resolve('http://www' + domainFallback.host, '/' + file);

    // 2nd fallback
    return request({
      // url -> http://www.example.com/favicon.ico
      url: href,
      timeout: 5000
    }, function (err, res) {
      if (err || !(res.request && res.request.href)) {
        return cb(err || new Error('Unexpected answer'));
      }

      if (res.headers['content-type'] && res.headers['content-type'].toLowerCase().search(contentType) >= 0) {
        // call callback
        return cb(null, href);
      }

      // We didn't find anything!
      return cb(null, false);
    });
  });
};

IconCrawler.prototype.__getFavicon = function (cb) {
  // See https://en.wikipedia.org/wiki/Favicon#How_to_use
  var acceptableIconMIMETypes = [
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/gif',
    'image/png'
  ];

  var iconUrls = util.cleanCheerioObj(this.$('link[rel=icon]'), function (iconObj) {
    // If has attr 'type' check
    // acceptable mime types if found
    // push to array
    if (iconObj.type && acceptableIconMIMETypes.indexOf(iconObj.type)) {
      return true;
    }

    if (iconObj.href && iconObj.href.search('.ico') >= 0) {
      return true;
    }

    // Fallback
    return false;
  });

  var iconUrl;

  // Get preferable image
  // with higher quality
  for (var i = 0; i < iconUrls.length; i++) {
    // icon image preference flow:
    // .png -> .gif -> .ico
    if (iconUrls[i].href.search('.png') >= 0) {
      iconUrl = iconUrls[i].href;
      break;
    }

    if (iconUrls[i].href.search('.gif') >= 0) {
      iconUrl = iconUrls[i].href;
      break;
    }

    if (iconUrls[i].href.search('.ico') >= 0) {
      iconUrl = iconUrls[i].href;
      break;
    }
  }

  // Didn't find anything lets
  // fallback to /favicon.ico
  if (!iconUrl) {
    return this.__fallbackRequestIcon('favicon.ico', cb);
  }

  // Sanitize href
  var href = util.getIconUrl(this.domainUrl, iconUrl);

  return cb(null, href);
};

IconCrawler.prototype.__getAppleTouchIcon = function (cb) {
  // icon preference flow:
  // apple-touch-icon-precomposed -> apple-touch-icon -> /apple-touch-icon.png
  var iconUrls = util.cleanCheerioObj(this.$('link[rel=apple-touch-icon-precomposed]'));

  // Fallback to apple-touch-icon
  if (util.isArrayEmpty(iconUrls)) {
    iconUrls = util.cleanCheerioObj(this.$('link[rel=apple-touch-icon]'));

    // If still empty need to fallback to
    // /apple-touch-icon.png
    if (util.isArrayEmpty(iconUrls)) {
      return this.__fallbackRequestIcon('apple-touch-icon.png', cb);
    }
  }

  // If the array as only 1 element
  // we should return it!
  if (iconUrls.length === 1) {
    return cb(null, iconUrls[0].href);
  }

  // If the execution got here it means that
  // the array has more than one icon
  // and essentially it means there are icons with several dimensions
  // we need to get the one with the highest resolution
  iconUrls = iconUrls.reduce(function (prev, current) {
    if (util.compareIconDimensions(prev.sizes, current.sizes)) {
      return prev;
    }

    return current;
  });

  // Sanitize href
  var href = util.getIconUrl(this.domainUrl, iconUrls.href);

  return cb(null, href);
};

IconCrawler.prototype.__getSvgIcon = function (cb) {
  var iconUrl = util.cleanCheerioObj(this.$('link[rel=icon]'), function (iconObj) {
    // Filter only svg files
    if (iconObj.href && iconObj.href.search('.svg') >= 0) {
      return true;
    }

    // Fallback
    return false;
  });

  // If didn't find anything return early
  if (util.isArrayEmpty(iconUrl)) {
    return cb();
  }

  // Sanitize href
  var href = util.getIconUrl(this.domainUrl, iconUrl[0].href);

  // We should only find one
  // so just return the first
  // element of the array
  return cb(null, href);
};

IconCrawler.prototype.__getFluidIcon = function (cb) {
  var iconUrl = util.cleanCheerioObj(this.$('link[rel=fluid-icon]'));

  // If didn't find anything return early
  if (util.isArrayEmpty(iconUrl)) {
    return cb();
  }

  // Sanitize href
  var href = util.getIconUrl(this.domainUrl, iconUrl[0].href);

  // We should only find one
  // so just return the first
  // element of the array
  return cb(null, href);
};

IconCrawler.prototype.__getMsAppIcon = function (cb) {
  var self = this;

  var msapp = new MsApp({
    domain: self.domainUrl,
    $: self.$,
    cb: cb
  });

  // try to get msapplication-square150x150logo
  var iconUrl = msapp.getMetaContent('meta[name=msapplication-square150x150logo]');

  if (iconUrl) {
    return msapp.end(iconUrl);
  }

  // 1st fallback - msapplication-square70x70logo
  iconUrl = msapp.getMetaContent('meta[name=msapplication-square70x70logo]');

  if (iconUrl) {
    return msapp.end(iconUrl);
  }

  // 2nd fallback - msapplication-TileImage
  iconUrl = msapp.getMetaContent('meta[name=msapplication-TileImage]');

  // If there is a tile image
  if (iconUrl) {
    // this will end the request as well
    return msapp.processTileImage(iconUrl);
  }

  // 3rd fallback
  // Try to get metatag with info
  // of the brwoserconfig.xml
  var browserConfig = msapp.getMetaContent('meta[name=msapplication-config]');

  if (browserConfig) {

  }

  // 4th and last fallback
  // Try to get /browserconfig.xml
  return this.__fallbackRequestIcon('browserconfig.xml', function (err, href) {
    if (err) {
      return cb(err);
    }

    return request(href, function (err, res) {
      if (err) {
        return cb(err);
      }

      return cb(null, href);
    });
  });
};

IconCrawler.prototype.exportIconMethods = function (mode, type) {
  var types = config.app.types;

  var methodsMap = {};
  methodsMap[types.favicon] = this.__getFavicon.bind(this);
  methodsMap[types.svg] = this.__getSvgIcon.bind(this);
  methodsMap[types.fluid] = this.__getFluidIcon.bind(this);
  methodsMap[types.msapp] = this.__getMsAppIcon.bind(this);
  methodsMap[types.appleTouch] = this.__getAppleTouchIcon.bind(this);

  if (mode) {
    // Mode: ignore
    if (mode === 'ignore' && type) {
      // If is an array
      if (util.isArray(type)) {
        type.forEach(function (type) {
          delete methodsMap[type];
        });
      } else {
        // If is a string
        delete methodsMap[type];
      }
    }

    // Mode: only
    if (mode === 'only' && type) {
      var specificMap = {};

      // If is an array
      if (util.isArray(type)) {
        type.forEach(function (type) {
          specificMap[type] = methodsMap[type];
        });
      } else {
        specificMap[type] = methodsMap[type];
      }

      return specificMap;
    }
  }

  return methodsMap;
};

IconCrawler.prototype.executeCrawlers = function (methodsMap, cb) {
  var parallelFnsArr = [];

  for (var type in methodsMap) {
    if (methodsMap.hasOwnProperty(type)) {
      parallelFnsArr.push(function (callback) {
        var type = this.type;

        return methodsMap[type](function (err, href) {
          if (err) {
            return callback(err);
          }

          return callback(null, {
            type: type,
            href: href
          });
        });
      }.bind({ type: type}));
    }
  }

  return async.parallel(parallelFnsArr, cb);
};

/**
 * This method is used to fetch the rest of the icons types
 *
 * NOTE: this method will be used for all types unless
 * its "all"
 * @param  {String|Array} typeIgnore Icons to be ignored
 */
IconCrawler.prototype.__runWorker = function (type) {
  // Run worker
  var iconCrawlerWorker = workerFarm(require.resolve('lib/workers/iconCrawler'));
  var crawlerOptions = {
    htmlBody: this.__htmlBody,
    domain: this.domainUrl
  };

  return iconCrawlerWorker(crawlerOptions, type, function (results) {
    workerFarm.end(iconCrawlerWorker);
  });
};

module.exports = IconCrawler;
