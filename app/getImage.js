// Dependencies
var crawler = require('lib/crawler');
var util = require('lib/util');
var config = require('config.js');
var url = require('url');
var validUrl = require('valid-url');
var FileCacheMetadata = require('lib/helpers/FileCache/Metadata');

// Get possible types from config
// and store them in an array
var types = config.app.types;
var possibleTypes = [];

for (var k in types) {
  if (types.hasOwnProperty(k)) {
    possibleTypes.push(types[k]);
  }
}

// Route handler
module.exports = function (req, res) {
  if (!req.query.domain) {
    return res.boom.badRequest('Missing query param domain');
  }

  var domain = req.query.domain;
  var type = !req.query.type ? types.all : req.query.type;

  // Sanitize type strings
  if (!util.isArray(type)) {
    type = [type];
  }

  // Check if this type is supported
  type.forEach(function (t) {
    if (possibleTypes.indexOf(t) < 0) {
      return res.boom.badRequest('Invalid type');
    }
  });

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
  var domainUrl = url.parse(domain);
  domainUrl = 'http://' + domainUrl.host;

  // TODO check if this domain
  // is in WIP (Work in Progress)
  //

  var responseHandler = function (err, hrefObj) {
    if (err) {
      return res.boom.badRequest(err);
    }

    return res.json(hrefObj);
  };

  var fileCacheMetadata = new FileCacheMetadata(domainUrl);

  return fileCacheMetadata.get(function (err, hrefObj) {
    if (err) {
      return res.boom.badRequest(err);
    }

    // Increase score of the requested domain
    fileCacheMetadata.incrementZset();

    // If files havenn't been cached yet
    // start crawler in the request domain
    if (!hrefObj) {
      return crawler.queue({
        uri: domain,
        callback: crawler.findIcons(type, domainUrl, responseHandler)
      });
    }

    // Convert 'false' to false
    for (var k in hrefObj) {
      if (hrefObj.hasOwnProperty(k) && hrefObj[k] === 'false') {
        hrefObj[k] = false;
      }
    }

    return responseHandler(err, hrefObj);
  });
};
