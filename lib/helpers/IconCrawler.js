// Dependencies
var util = require('./util');
var request = require('request');
var async = require('async');
var MsApp = require('./helpers/MsApp');

function IconCrawler () {

}

/**
 * Fallback to see if exists in the
 * server root the file passed in
 * the arguments
 *
 * @param  {Object}   urlObj
 * @param  {String}   file   filename
 * @param  {Function} cb     Callback
 */
IconCrawler.prototype.__fallbackRequestIcon = function (urlObj, file, cb) {
  var type, contentType;

  if (file === 'favicon.ico') {
    type = 'favicon';
    contentType = 'icon';
  } else if (file === 'browserconfig.xml') {
    contentType = 'xml';
  } else {
    type = 'apple-touch';
    contentType = 'png';
  }

  // 1st fallback
  return request({
    // url example -> http://example.com/favicon.ico
    url: util.getIconUrl(urlObj, file),
    timeout: 5000
  }, function (err, res) {
    if (err || !(res.request && res.request.href)) {
      return cb(err || new Error('Unexpected answer'));
    }

    if (res.headers['content-type'] && res.headers['content-type'].toLowerCase().search(contentType) >= 0) {
      var href = util.getIconUrl(urlObj, file);

      // Cache image
      if (file !== 'browserconfig.xml') {
        cache(type, href, urlObj.host);
      }

      // call callback
      return cb(null, href);
    }

    urlObj = url.parse('http://www.' + urlObj.host);

    // 2nd fallback
    return request({
      // url -> http://www.example.com/favicon.ico
      url: url.resolve('http://' + urlObj.host, '/' + file),
      timeout: 5000
    }, function (err, res) {
      if (err || !(res.request && res.request.href)) {
        return cb(err || new Error('Unexpected answer'));
      }

      if (res.headers['content-type'] && res.headers['content-type'].toLowerCase().search(contentType) >= 0) {
        var href = util.getIconUrl(urlObj, file);

        // Cache image
        if (file !== 'browserconfig.xml') {
          cache(type, href, urlObj.host);
        }

        // call callback
        return cb(null, href);
      }

      // We didn't find anything!
      return cb(null, false);
    });
  });
};

IconCrawler.prototype.__getFavicon = function (urlObj, $, cb) {
  // See https://en.wikipedia.org/wiki/Favicon#How_to_use
  var acceptableIconMIMETypes = [
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/gif',
    'image/png'
  ];

  var iconUrls = util.cleanCheerioObj($('link[rel=icon]'), function (iconObj) {
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
    return this.__fallbackRequestIcon(urlObj, 'favicon.ico', cb);
  }

  var href = util.getIconUrl(urlObj, iconUrl);

  // Cache file
  cache('favicon', href, urlObj.host);

  return cb(null, href);
};

IconCrawler.prototype.__getAppleTouchIcon = function (urlObj, $, cb) {
  // icon preference flow:
  // apple-touch-icon-precomposed -> apple-touch-icon -> /apple-touch-icon.png
  var iconUrls = util.cleanCheerioObj($('link[rel=apple-touch-icon-precomposed]'));

  // Fallback to apple-touch-icon
  if (util.isArrayEmpty(iconUrls)) {
    iconUrls = util.cleanCheerioObj($('link[rel=apple-touch-icon]'));

    // If still empty need to fallback to
    // /apple-touch-icon.png
    if (util.isArrayEmpty(iconUrls)) {
      return this.__fallbackRequestIcon(urlObj, 'apple-touch-icon.png', cb);
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

  var href = util.getIconUrl(urlObj, iconUrls.href);

  // Cache file
  cache('apple-touch', href, urlObj.host);

  return cb(null, href);
};

IconCrawler.prototype.__getSvgIcon = function (urlObj, $, cb) {
  var iconUrl = util.cleanCheerioObj($('link[rel=icon]'), function (iconObj) {
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

  var href = util.getIconUrl(urlObj, iconUrl[0].href);

  // Cache file
  cache('svg', href, urlObj.host);

  // We should only find one
  // so just return the first
  // element of the array
  return cb(null, href);
};

IconCrawler.prototype.__getFluidIcon = function (urlObj, $, cb) {
  var iconUrl = util.cleanCheerioObj($('link[rel=fluid-icon]'));

  // If didn't find anything return early
  if (util.isArrayEmpty(iconUrl)) {
    return cb();
  }

  var href = util.getIconUrl(urlObj, iconUrl[0].href);

  // Cache file
  cache('fluidapp', href, urlObj.host);

  // We should only find one
  // so just return the first
  // element of the array
  return cb(null, href);
};

IconCrawler.prototype.__getMsAppIcon = function (cache, urlObj, $, cb) {
  var msapp = new MsApp({
    cache: cache,
    urlObj: urlObj,
    $: $,
    cb: cb
  });

  // try to get msapplication-square150x150logo
  var iconUrl = msapp.getMetaContent('meta[name=msapplication-square150x150logo]');

  if (iconUrl) {
    return end(iconUrl);
  }

  // 1st fallback - msapplication-square70x70logo
  iconUrl = msapp.getMetaContent('meta[name=msapplication-square70x70logo]');

  if (iconUrl) {
    return end(iconUrl);
  }

  // 2nd fallback - msapplication-TileImage
  iconUrl = getMetaContent('meta[name=msapplication-TileImage]');

  // If there is a tile image
  if (iconUrl) {

  }

  // 3rd fallback
  // Try to get metatag with info
  // of the brwoserconfig.xml
  var browserConfig = getMetaContent('meta[name=msapplication-config]');

  if (browserConfig) {

  }

  // 4th and last fallback
  // Try to get /browserconfig.xml
  return this.__fallbackRequestIcon(urlObj, 'browserconfig.xml', function (err, href) {
    if (err) {
      return cb(err);
    }

    return request(href, function (err, res) {


      return cb(null, href);
    });
  });
};

IconCrawler.prototype.__getAllIcons = function (urlObj, $, cb) {
  var methodsMap = this.exportIconMethods(urlObj, $);

  return this.executeCrawlers(methodsMap, function (err, results) {
    if (err) {
      return cb(err);
    }

    return cb(null, results);
  });
};

IconCrawler.prototype.exportIconMethods = function (urlObj, $) {
  return {
    'favicon': this.__getFavicon.bind(null, urlObj, $),
    'svg': this.__getSvgIcon.bind(null, urlObj, $),
    'fluidapp': this.__getFluidIcon.bind(null, urlObj, $),
    'msapp': this.__getMsAppIcon.bind(null, urlObj, $),
    'apple-touch': this.__getAppleTouchIcon.bind(null, urlObj, $)
  };
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

module.exports = IconCrawler;
