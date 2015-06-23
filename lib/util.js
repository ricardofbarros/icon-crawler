// Dependencies
var crypto = require('crypto');
var config = require('config.js');
var url = require('url');
var validUrl = require('valid-url');

var util = {};

util.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

util.cleanCheerioObj = function (cheerioObj, filterFn) {
  var icons = [];

  for (var k in cheerioObj) {
    if (cheerioObj.hasOwnProperty(k) && cheerioObj[k].attribs) {
      icons.push(cheerioObj[k].attribs);
    }
  }

  if (typeof filterFn === 'function') {
    icons = icons.filter(filterFn);
  }

  return icons;
};

util.url = {};

util.url.encrypt = function (text) {
  if (typeof text !== 'string') {
    throw new Error('Unexpected argument');
  }

  var cipher = crypto.createCipher('aes-128-ofb', config.app.urlShortenerCipherPass);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

util.url.decrypt = function (text) {
  if (typeof text !== 'string') {
    throw new Error('Unexpected argument');
  }

  var decipher = crypto.createDecipher('aes-128-ofb', config.app.urlShortenerCipherPass);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

util.url.shortener = function (iconUrl) {
  var encryptedUrl = util.url.encrypt(iconUrl);
  var domain = url.format(config.http);

  return url.resolve(domain, 'proxy/' + encryptedUrl);
};

util.isArrayEmpty = function (arr) {
  if (typeof arr !== 'object') {
    return true;
  }

  return arr.length <= 0;
};

util.compareIconDimensions = function (dimension1, dimension2) {
  // Default values
  if (dimension1.search('x') <= 0) {
    dimension1 = 120; // 60x60
  }
  if (dimension2.search('x') <= 0) {
    dimension2 = 120; // 60x60
  }

  // transform dimensions into a int
  // and sum both values and of course
  // if not 120, because if its 120 it's
  // already "calculated"
  if (dimension1 !== 120) {
    dimension1 = dimension1.split('x');
    dimension1 = parseInt(dimension1[0], 10) + parseInt(dimension1[1], 10);
  }
  if (dimension2 !== 120) {
    dimension2 = dimension2.split('x');
    dimension2 = parseInt(dimension2[0], 10) + parseInt(dimension2[1], 10);
  }

  // One last check
  dimension1 = isNaN(dimension1) ? 120 : dimension1;
  dimension2 = isNaN(dimension2) ? 120 : dimension2;

  return dimension1 >= dimension2;
};

util.getIconUrl = function (domain, file) {
  // If file is already a url
  // return it
  if (validUrl.isWebUri(file)) {
    return file;
  }

  return url.resolve(domain, file);
};

util.capitalizeFirstLetter = function (str) {
  return str.substring(0, 1).toUpperCase() + str.substring(1);
};

module.exports = util;
