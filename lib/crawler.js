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

// Extend crawler module
crawler.__getFavicon = function ($, cb) {
  // See https://en.wikipedia.org/wiki/Favicon#How_to_use
  var acceptableIconMIMETypes = [
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/gif',
    'image/png'
  ];

  var icons = $('link[rel=icon]');
  var iconUrls = [];
  var keys = Object.keys(icons);
  var i;

  for (i = 0; i < keys.length; i++) {
    var k = keys[i];

    // util.isNumber works as hasOwnProperty for the object
    // returned from the cheerio
    if (util.isNumber(k)) {
      // If has attr 'type' check
      // acceptable mime types if found
      // push to array
      if (icons[k].attribs.type && acceptableIconMIMETypes.indexOf(icons[k].attribs.type)) {
        iconUrls.push(icons[k].attribs.href);
        continue;
      }

      if (icons[k].attribs.href && icons[k].attribs.href.search('.ico')) {
        iconUrls.push(icons[k].attribs.href);
      }
    }
  }

  for (i = 0; i < iconUrls.length; i++) {
    // icon image preference flow:
    // .png -> .gif -> .ico
    if (iconUrls[i].search('.png')) {
      return cb(null, iconUrls[i].href);
    }

    if (iconUrls[i].search('.gif')) {
      return cb(null, iconUrls[i].href);
    }

    if (iconUrls[i].search('.ico')) {
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
