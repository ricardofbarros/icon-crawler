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
  var type = !req.query.type ? 'all' : req.query.type;

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

    var sendObj = {};

    if (typeof href === 'string') {
      sendObj[type] = sanitizeIconUrl(href, domainUrl);
    } else {
      href.forEach(function (iconObj) {
        sendObj[iconObj.type] = sanitizeIconUrl(iconObj.href, domainUrl);
      });
    }

    return res.json(sendObj);
  };

  crawler.queue({
    uri: domainUrl,
    callback: crawler.findIcons(type, domainUrl, responseHandler)
  });
};
