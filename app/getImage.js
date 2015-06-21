// Dependencies
var url = require('url');
var crawler = require('lib/crawler');

// Route handler
module.exports = function (req, res) {
  if (!req.query.domain) {
    return res.boom.badRequest('Missing query param domain');
  }

  var domainString = req.query.domain;
  var type = !req.query.type ? 'favicon' : req.query.type;

  var possibleTypes = [
    'favicon',
    'svg',
    'fluid',
    'msapp',
    'all',
    'apple'
  ];

  if (possibleTypes.indexOf(type) < 0) {
    return res.boom.badRequest('Invalid type');
  }

  var domain = url.parse(domainString);

  if (!domain.protocol) {
    return res.boom.badRequest('Invalid domain');
  }

  // TODO document this handler
  // and make it more all-purpose
  var responseHandler = function (err, href) {
    if (err) {
      return res.boom.badRequest(err);
    }

    var sendObj;

    if (typeof href === 'string') {
      sendObj = {};
      sendObj[type] = href;
    } else {
      sendObj = href;
    }

    return res.json(sendObj);
  };

  crawler.queue({
    uri: domainString,
    callback: crawler.findIcons(type, responseHandler)
  });
};
