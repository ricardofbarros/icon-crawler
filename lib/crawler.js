// Dependencies
var Crawler = require('crawler');
var config = require('config.js');
// var worker = require('lib/worker.js');
// var imageCrawlerWorker = require('lib/worker/imageCrawler');
var util = require('lib/util');

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

var crawler = new Crawler(config.crawler);

crawler.findIcons = function (err, resp, $) {
  // function scope will be binded
  // in app.js
  var cb = this.callback;
  var type = this.type;

  if (err) {
    return cb(err);
  }

  switch (type) {
    case 'favicon':
      crawler.__getFavicon($, cb);
      break;

    case 'svg':
      crawler.__getSvgIcon($);
      break;

    case 'fluid':
      crawler.__getFluidIcon($);
      break;

    case 'msapp':
      crawler.__getMsAppIcon($);
      break;

    case 'all':
      crawler.__getFavicon($);
      crawler.__getSvgIcon($);
      crawler.__getFluidIcon($);
      crawler.__getMsAppIcon($);
      break;
  }

  //imageCrawlerWorker(type);
};

crawler.__cleanCheerioObj = function (cheerioObj, filterFn) {
  var icons = [];

  for (var k in cheerioObj) {
    if (cheerioObj.hasOwnProperty(k) && cheerioObj[k].attribs) {
      icons.push(cheerioObj[k].attribs);
    }
  }

  return icons.filter(filterFn);
};

// Extend crawler module
crawler.__getFavicon = function ($, cb) {
  // See https://en.wikipedia.org/wiki/Favicon#How_to_use
  var acceptableIconMIMETypes = [
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/gif',
    'image/png'
  ];

  // Sync method arr filter
  var iconUrls = crawler.__cleanCheerioObj($('link[rel=icon]'), function (iconObj) {
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

  // Get preferable image
  // with higher quality
  for (var i = 0; i < iconUrls.length; i++) {
    // icon image preference flow:
    // .png -> .gif -> .ico
    if (iconUrls[i].href.search('.png') >= 0) {
      return cb(null, iconUrls[i].href);
    }

    if (iconUrls[i].href.search('.gif') >= 0) {
      return cb(null, iconUrls[i].href);
    }

    if (iconUrls[i].href.search('.ico') >= 0) {
      return cb(null, iconUrls[i].href);
    }
  }

  // Fallback - Didn't find anything
  return cb();
};


crawler.__getAppleTouchIcon = function (res, $) {
  var icons = $('link[rel=apple-touch-icon], link[rel=apple-touch-icon-precomposed]');


};

crawler.__getSvgIcon = function ($) {
var icons = $('link[rel=apple-touch-icon], link[rel=apple-touch-icon-precomposed]')
};

crawler.__getFluidIcon = function ($) {

};

crawler.__getMsAppIcon = function ($) {

};


module.exports = crawler;
