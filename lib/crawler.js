// Dependencies
var Crawler = require('crawler');
var config = require('config.js');
var util = require('./util');
var request = require('request');
var url = require('url');
var async = require('async');
var workerFarm = require('worker-farm');

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
crawler.findIcons = function (type, urlObj, cb) {
  return function (err, res, $) {
    if (err) {
      return cb(err);
    }

    switch (type) {
      case 'favicon':
        crawler.__getFavicon(urlObj, $, cb);
        break;

      case 'svg':
        crawler.__getSvgIcon($, cb);
        break;

      case 'fluidapp':
        crawler.__getFluidIcon($, cb);
        break;

      case 'msapp':
        crawler.__getMsAppIcon($, cb);
        break;

      case 'apple-touch':
        crawler.__getAppleTouchIcon($, cb);
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
    // 1st favicon fallback
    return request({
      // url -> http://example.com/favicon.ico
      url: url.resolve(url.format(urlObj), 'favicon.ico'),
      timeout: 5000
    }, function (err, res) {
      if (err || !(res.request && res.request.href)) {
        return cb(err || new Error('Unexpected answer'));
      }

      if (res.headers['content-type'] && res.headers['content-type'].toLowerCase() === 'image/x-icon') {
        return cb(null, util.url.shortener(res.request.href));
      }

      // 2nd favicon fallback
      return request({
        // url -> http://www.example.com/favicon.ico
        url: url.resolve(urlObj.protocol + '//www', urlObj.host + '/favicon.ico'),
        timeout: 5000
      }, function (err, res) {
        if (err || !(res.request && res.request.href)) {
          return cb(err || new Error('Unexpected answer'));
        }

        if (res.headers['content-type'] && res.headers['content-type'].toLowerCase() === 'image/x-icon') {
          return cb(null, util.url.shortener(res.request.href));
        }

        // We really didn't find anything!
        return cb();
      });
    });
  }

  return cb(null, util.url.shortener(iconUrl));
};

crawler.__getAppleTouchIcon = function ($, cb) {
  // icon preference flow:
  // apple-touch-icon-precomposed -> apple-touch-icon
  var iconUrls = util.cleanCheerioObj($('link[rel=apple-touch-icon-precomposed]'));

  if (util.isArrayEmpty(iconUrls)) {
    iconUrls = util.cleanCheerioObj($('link[rel=apple-touch-icon]'));
  }
};

crawler.__getSvgIcon = function ($, cb) {
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

  // We should only find one
  // so just return the first
  // element of the array
  return cb(null, iconUrl[0].href);
};

crawler.__getFluidIcon = function ($, cb) {
  var iconUrl = util.cleanCheerioObj($('link[rel=fluid-icon]'));

  // If didn't find anything return early
  if (util.isArrayEmpty(iconUrl)) {
    return cb();
  }

  // We should only find one
  // so just return the first
  // element of the array
  return cb(null, iconUrl[0].href);
};

crawler.__getMsAppIcon = function ($, cb) {
  // Need to read
  // http://stackoverflow.com/questions/20133627/windows-8-tile-not-displaying-correct-images-fav-icon-displayed-instead
};

crawler.__getAllIcons = function (urlObj, $, cb) {
  var methodsMap = {
    'favicon': crawler.__getFavicon.bind(null, urlObj, $),
    'svg': crawler.__getSvgIcon.bind(null, $),
    'fluidapp': crawler.__getFluidIcon.bind(null, $),
    'msapp': crawler.__getMsAppIcon.bind(null, $),
    'apple-touch': crawler.__getAppleTouchIcon.bind(null, $)
  };

  crawler.__executeCrawlers(methodsMap, function (err, results) {
    if (err) {
      return cb(err);
    }

    // Do something
  });
};

crawler.__executeCrawlers = function (methodsMap, cb) {
  var parallelFnsArr = [];

  for (var type in methodsMap) {
    if (methodsMap.hasOwnProperty(type)) {
      parallelFnsArr.push(function (callback) {
        return methodsMap[type](function (err, href) {
          if (err) {
            return callback(err);
          }

          var obj = {};
          obj[type] = href;

          return callback(null, obj);
        });
      });
    }
  }

  return async.parallel(parallelFnsArr, cb);
};

module.exports = crawler;
