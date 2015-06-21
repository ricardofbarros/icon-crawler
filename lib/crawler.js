// Dependencies
var Crawler = require('crawler');
var config = require('config.js');
var imageCrawlerWorker = require('lib/workers/imageCrawler');
var util = require('./util');
var request = require('request');
var url = require('url');
var async = require('async');

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

    // Exception
    // run worker to fetch the rest of the icons types
    if (type !== 'all') {
      imageCrawlerWorker(type, res.body);
    }

    switch (type) {
      case 'favicon':
        return crawler.__getFavicon(urlObj, $, cb);

      case 'svg':
        return crawler.__getSvgIcon($, cb);

      case 'fluid':
        return crawler.__getFluidIcon($, cb);

      case 'msapp':
        return crawler.__getMsAppIcon($, cb);

      case 'apple':
        return crawler.__getAppleTouchIcon($, cb);

      case 'all':
        return crawler.__getAllIcons(urlObj, $, cb);

      // Fallback just in case
      default:
        return cb(new Error('Something went wrong'));
    }
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

  // Didn't find anything
  if (!iconUrl) {
    // 1st favicon fallback
    return request({
      // url -> http://example.com/favicon.ico
      url: url.resolve(url.format(urlObj), 'favicon.ico'),
      timeout: 5000
    }, function (err, res) {
      // If found
      // return cb(null, somthing)

      // 2nd favicon fallback
      return request({
        // url -> http://www.example.com/favicon.ico
        url: url.resolve(urlObj.protocol + '//www', urlObj.host + '/favicon.ico'),
        timeout: 5000
      }, function (err, res) {
        // If found
        // return cb(null, somthing)

        // We didn't really find anything!
        return cb();
      });
    });
  }

  return cb(null, util.url.shortener(iconUrl));
};

crawler.__getAppleTouchIcon = function (res, $) {
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

};

crawler.__getAllIcons = function (urlObj, $, cb) {

};

module.exports = crawler;
