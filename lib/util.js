// Dependencies
var crypto = require('crypto');
var config = require('config.js');

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

  return icons.filter(filterFn);
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

module.exports = util;
