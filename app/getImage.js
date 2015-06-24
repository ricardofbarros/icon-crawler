// Dependencies
var crawler = require('lib/crawler');
// var util = require('lib/util');
var config = require('config.js');
var url = require('url');
var validUrl = require('valid-url');

// Route handler
module.exports = function (req, res) {
  if (!req.query.domain) {
    return res.boom.badRequest('Missing query param domain');
  }

  var types = config.app.types;
  var domain = req.query.domain;
  var type = !req.query.type ? types.all : req.query.type;

  // Get possible types from config
  var possibleTypes = Object.keys(types);

  if (possibleTypes.indexOf(type) < 0) {
    return res.boom.badRequest('Invalid type');
  }

  // If protocol is not present
  // add default protocol
  if (domain.search(/^http(s*):\/\//)) {
    domain = 'http://' + domain;
  }

  if (!validUrl.isWebUri(domain)) {
    return res.boom.badRequest('Invalid domain');
  }

  // sanitize domain by removing
  // the subsequent uri
  domain = url.parse(domain);
  domain = 'http://' + domain.host;

  // TODO go redis check cache
  crawler.queue({
    uri: domain,
    callback: crawler.findIcons(type, domain, function (err, hrefObj) {
      if (err) {
        return res.boom.badRequest(err);
      }

      return res.json(hrefObj);
    })
  });
};
