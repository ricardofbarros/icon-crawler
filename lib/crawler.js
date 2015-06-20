// Dependencies
var Crawler = require('crawler');
var config = require('config.js');

var crawler = new Crawler(config.crawler);

crawler.findIcons = function (err, resp, $) {
  // function scope will be binded
  // in app.js
  var res = this.res;
  var type = this.type;

  if (err) {
    return res.boom.badRequest(err);
  }

  switch (type) {
    case 'favicon':
      this.__getFavicon($);
      break;

    case 'svg':
      this.__getSvgIcon($);
      break;

    case 'fluid':
      this.__getFluidIcon($);
      break;

    case 'msapp':
      this.__getMsAppIcon($);
      break;

    case 'all':
      this.__getFavicon($);
      this.__getSvgIcon($);
      this.__getFluidIcon($);
      this.__getMsAppIcon($);
      break;
  }

};


// Extend crawler module
crawler.__getFavicon = function ($) {

  var icons = $('link[rel=icon], link[rel=apple-touch-icon]')

  res.end();
};

crawler.__getSvgIcon = function ($) {

};

crawler.__getFluidIcon = function ($) {

};

crawler.__getMsAppIcon = function ($) {

};


module.exports = crawler;
