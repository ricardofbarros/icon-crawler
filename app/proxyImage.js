// Dependencies
var util = require('lib/util');
var request = require('request');

module.exports = function (req, res) {
  var domainEncrypted = req.params && req.params[0] ? req.params[0] : false;

  if (!domainEncrypted) {
    return res.boom.badRequest('Something went wrong, please try again later');
  }

  try {
    var domain = util.url.decrypt(domainEncrypted);
  } catch(err) {
    return res.boom.badRequest('Not a valid domain');
  }

  request(domain).pipe(res);
};
