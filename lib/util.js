// Dependencies
var crypto = require('crypto');
var config = require('config.js');
var url = require('url');

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
  var cipher = crypto.createCipher('aes-256-cbc', config.app.urlShortenerCipherPass);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

util.url.decrypt = function (text) {
  var decipher = crypto.createDecipher('aes-256-cbc', config.app.urlShortenerCipherPass);
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

module.exports = util;
