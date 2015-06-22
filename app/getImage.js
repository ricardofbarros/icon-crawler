// Dependencies
var url = require('url');
var crawler = require('lib/crawler');
var validUrl = require('valid-url');
var util = require('lib/util');

function sanitizeIconUrl (icon) {
  // If icon url was undefined
  // return false
  if (!icon) {
    return false;
  }

  // If true the icon url returned was
  // from third party and wasn't cached
  // yet
  if (validUrl.isWebUri(icon)) {
    return util.url.shortener(icon);
  }

  // TODO cached files transform to an url
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

  var domainUrl = 'http://' + domain;
  var urlObj = url.parse(domainUrl);

  if (!urlObj.protocol) {
    return res.boom.badRequest('Invalid url');
  }

  // TODO make it more all-purpose
  var responseHandler = function (err, href) {
    if (err) {
      return res.boom.badRequest(err);
    }

    var sendObj;

    if (typeof href === 'string') {

      sendObj = {};
      sendObj[type] = sanitizeIconUrl(href);
    } else {
      for (var k in href) {
        if (href.hasOwnProperty(k)) {
          href[k] = sanitizeIconUrl(href[k]);
        }
      }

      sendObj = href;
    }

    return res.json(sendObj);
  };

  crawler.queue({
    uri: domainUrl,
    callback: crawler.findIcons(type, urlObj, responseHandler)
  });
};
