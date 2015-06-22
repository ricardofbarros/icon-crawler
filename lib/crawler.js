// Dependencies
var Crawler = require('crawler');
var config = require('config.js');
var util = require('./util');
var request = require('request');
var url = require('url');
var async = require('async');
var workerFarm = require('worker-farm');
var cache = require('lib/cache');

// Create crawler
var crawler = new Crawler(config.crawler);

// Start extending crawler API

/**
 * Crawler queue callback used to crawl
 * fresh icons from domains
 * @param  {Error} err
 * @param  {Object} resp HTML Response Object
 * @param  {Object} $    Cheerio Object
 * @return {Function} Crawler callback
 */
crawler.findIcons = function (type, domainUrl, cb) {
  return function (err, res, $) {
    if (err || !$) {
      return cb(err || new Error('Not a valid website to fetch info, maybe it\'s a web API'));
    }

    var urlObj = url.parse(domainUrl);

    switch (type) {
      case 'favicon':
        crawler.__getFavicon(urlObj, $, cb);
        break;

      case 'svg':
        crawler.__getSvgIcon(urlObj, $, cb);
        break;

      case 'fluidapp':
        crawler.__getFluidIcon(urlObj, $, cb);
        break;

      case 'msapp':
        crawler.__getMsAppIcon(urlObj, $, cb);
        break;

      case 'apple-touch':
        crawler.__getAppleTouchIcon(urlObj, $, cb);
        break;

      case 'all':
        return crawler.__getAllIcons(urlObj, $, cb);

      // Fallback just in case
      default:
        return cb(new Error('Something went wrong: type -> ' + type));
    }

    // Run worker to fetch the rest of the icons types
    // the worker will be created for all types unless
    // it's type "all"
    var iconCrawlerWorker = workerFarm(require.resolve('lib/workers/iconCrawler'));
    iconCrawlerWorker(urlObj, res.body, type, function () {
      workerFarm.end(iconCrawlerWorker);
    });
  };
};

crawler.__fallbackRequestIcon = function (urlObj, file, cb) {
  var cacheFn, contentType;

  if (file === 'favicon.ico') {
    cacheFn = cache.storeFavicon;
    contentType = 'image/x-icon';
  } else {
    cacheFn = cache.storeAppleTouch;
    contentType = 'image/png';
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

    if (res.headers['content-type'] && res.headers['content-type'].toLowerCase() === contentType) {
      // Cache image
      cacheFn(util.getIconUrl(urlObj, file));

      // call callback
      return cb(null, res.request.href);
    }

    // 2nd fallback
    return request({
      // url -> http://www.example.com/favicon.ico
      url: url.resolve('http://www.' + urlObj.host, '/' + file),
      timeout: 5000
    }, function (err, res) {
      if (err || !(res.request && res.request.href)) {
        return cb(err || new Error('Unexpected answer'));
      }

      if (res.headers['content-type'] && res.headers['content-type'].toLowerCase() === contentType) {
        // Cache image
        cacheFn(util.getIconUrl(urlObj, file));

        return cb(null, res.request.href);
      }

      // We didn't find anything!
      return cb();
    });
  });
};

crawler.__getFavicon = function (urlObj, $, cb) {
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
    return crawler.__fallbackRequestIcon(urlObj, 'favicon.ico', cb);
  }

  // Cache file
  cache.storeFavicon(util.getIconUrl(urlObj, iconUrl));

  return cb(null, iconUrl);
};

crawler.__getAppleTouchIcon = function (urlObj, $, cb) {
  // icon preference flow:
  // apple-touch-icon-precomposed -> apple-touch-icon -> /apple-touch-icon.png
  var iconUrls = util.cleanCheerioObj($('link[rel=apple-touch-icon-precomposed]'));

  // Fallback to apple-touch-icon
  if (util.isArrayEmpty(iconUrls)) {
    iconUrls = util.cleanCheerioObj($('link[rel=apple-touch-icon]'));

    // If still empty need to fallback to
    // /apple-touch-icon.png
    if (util.isArrayEmpty(iconUrls)) {
      return crawler.__fallbackRequestIcon(urlObj, 'apple-touch-icon.png', cb);
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

  // Cache file
  cache.storeAppleTouch(util.getIconUrl(urlObj, iconUrls.href));

  return cb(null, iconUrls.href);
};

crawler.__getSvgIcon = function (urlObj, $, cb) {
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

  // Cache file
  cache.storeSvg(util.getIconUrl(urlObj, iconUrl[0].href));

  // We should only find one
  // so just return the first
  // element of the array
  return cb(null, iconUrl[0].href);
};

crawler.__getFluidIcon = function (urlObj, $, cb) {
  var iconUrl = util.cleanCheerioObj($('link[rel=fluid-icon]'));

  // If didn't find anything return early
  if (util.isArrayEmpty(iconUrl)) {
    return cb();
  }

  // Cache file
  cache.storeSvg(util.getIconUrl(urlObj, iconUrl[0].href));

  // We should only find one
  // so just return the first
  // element of the array
  return cb(null, iconUrl[0].href);
};

crawler.__getMsAppIcon = function (urlObj, $, cb) {
  // Need to read
  // http://stackoverflow.com/questions/20133627/windows-8-tile-not-displaying-correct-images-fav-icon-displayed-instead

  // Cache file
  //cache.storeMsapp(util.getIconUrl(urlObj, iconUrl[0].href));
  return cb(null, false);
};

crawler.exportIconMethods = function (urlObj, $) {
  return {
    'favicon': crawler.__getFavicon.bind(null, urlObj, $),
    'svg': crawler.__getSvgIcon.bind(null, urlObj, $),
    'fluidapp': crawler.__getFluidIcon.bind(null, urlObj, $),
    'msapp': crawler.__getMsAppIcon.bind(null, urlObj, $),
    'apple-touch': crawler.__getAppleTouchIcon.bind(null, urlObj, $)
  };
};

crawler.__getAllIcons = function (urlObj, $, cb) {
  var methodsMap = crawler.exportIconMethods(urlObj, $);

  return crawler.executeCrawlers(methodsMap, function (err, results) {
    if (err) {
      return cb(err);
    }

    return cb(null, results);
  });
};

crawler.executeCrawlers = function (methodsMap, cb) {
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

module.exports = crawler;
