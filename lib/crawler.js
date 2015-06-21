// Dependencies
var Crawler = require('crawler');
var config = require('config.js');
// var worker = require('lib/worker.js');
var imageCrawlerWorker = require('lib/workers/imageCrawler');
var util = require('./util');

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
crawler.findIcons = function (type, cb) {
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
        return crawler.__getFavicon($, cb);

      case 'svg':
        return crawler.__getSvgIcon($, cb);

      case 'fluid':
        return crawler.__getFluidIcon($, cb);

      case 'msapp':
        return crawler.__getMsAppIcon($, cb);

      case 'apple':
        return crawler.__getAppleTouchIcon($, cb);

      case 'all':
        return crawler.__getAllIcons($, cb);

      // Fallback just in case
      default:
        return cb(new Error('Something went wrong'));
    }
  };
};

crawler.__getFavicon = function ($, cb) {
  // See https://en.wikipedia.org/wiki/Favicon#How_to_use
  var acceptableIconMIMETypes = [
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/gif',
    'image/png'
  ];

  // Sync method arr filter
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
    return cb();
  }

  return cb(null, util.url.shortener(iconUrl));
};

crawler.__getAppleTouchIcon = function (res, $) {
  var icons = $('link[rel=apple-touch-icon], link[rel=apple-touch-icon-precomposed]');
};

crawler.__getSvgIcon = function ($) {
  var icons = $('link[rel=apple-touch-icon], link[rel=apple-touch-icon-precomposed]');
};

crawler.__getFluidIcon = function ($) {

};

crawler.__getMsAppIcon = function ($) {

};

module.exports = crawler;
