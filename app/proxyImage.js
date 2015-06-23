// Dependencies
var util = require('lib/util');
var request = require('request');
var validUrl = require('valid-url');

module.exports = function (req, res) {
  var hrefEncrypted = req.params && req.params[0] ? req.params[0] : false;

  if (!hrefEncrypted) {
    return res.boom.badRequest('Something went wrong, please try again later');
  }

  try {
    var href = util.url.decrypt(hrefEncrypted);
  } catch(err) {
    return res.boom.badRequest('Not a valid icon image, please try again');
  }

  if (!validUrl.isWebUri(href)) {
    return res.boom.badRequest('Not a valid icon image, please try again');
  }

  return request(href).pipe(res);
};
