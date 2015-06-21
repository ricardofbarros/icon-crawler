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
    return res.boom.badRequest(err);
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

  // See https://en.wikipedia.org/wiki/ICO_%28file_format%29#MIME_type
  // for more info
  var acceptableIconMIMETypes = [
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]

  var icons = $('link[rel=icon]');
  var iconUrl;
  var keys = Object.keys(icons);

  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];

    // util.isNumber works as hasOwnProperty for the object
    // returned from the cheerio
    // and the indexOf will get the favicon for us
    if (util.isNumber(k) && acceptableIconMIMETypes.indexOf(icons[k].attribs.type)) {
      return cb(null, icons[k].attribs.href);
    }
  }

  // Fallback - Didn't find anything
  return cb();
};


crawler.__getAppleTouchIcon = function (res, $) {
  var icons = $('link[rel=apple-touch-icon], link[rel=apple-touch-icon-precomposed]')
};

crawler.__getSvgIcon = function ($) {

};

crawler.__getFluidIcon = function ($) {

};

crawler.__getMsAppIcon = function ($) {

};


module.exports = crawler;
