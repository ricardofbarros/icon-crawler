// Dependencies
var url = require('url');
var crawler = require('lib/crawler');
var validUrl = require('valid-url');
var util = require('lib/util');

function sanitizeIconUrl (icon, domainUrl) {
  // If icon url was undefined
  // return false
  if (!icon) {
    return false;
  }

  // Check if icon is hosted on
  // website root if true
  // return url shortened
  if (icon[0] === '/') {
    return util.url.shortener(url.resolve(domainUrl, icon));
  }

  // Check if icon href is a valid url
  if (validUrl.isWebUri(icon)) {
    return util.url.shortener(icon);
  }

  // TODO check for cached files transform to an url
}

// Route handler
module.exports = function (req, res) {
  if (!req.query.domain) {
    return res.boom.badRequest('Missing query param domain');
  }

  var domain = req.query.domain;
  var type = !req.query.type ? 'favicon' : req.query.type;

  var possibleTypes = [
    'favicon',
    'svg',
    'fluidapp',
    'msapp',
    'all',
    'apple-touch'
  ];

  if (possibleTypes.indexOf(type) < 0) {
    return res.boom.badRequest('Invalid type');
  }

  // TODO sanitize domains
  var domainUrl = 'http://' + domain;

  // TODO make it more all-purpose
  var responseHandler = function (err, href) {
    if (err) {
      return res.boom.badRequest(err);
    }

    var sendObj;

    // TODO improve this
    if (typeof href === 'string') {
      sendObj = {};
      sendObj[type] = sanitizeIconUrl(href, domainUrl);
    } else {
      for (var k in href) {
        if (href.hasOwnProperty(k)) {
          href[k] = sanitizeIconUrl(href[k], domainUrl);
        }
      }

      sendObj = href;
    }

    return res.json(sendObj);
  };

  crawler.queue({
    uri: domainUrl,
    callback: crawler.findIcons(type, domainUrl, responseHandler)
  });
};
