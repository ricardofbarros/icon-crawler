// Dependencies
var url = require('url');
var crawler = require('lib/crawler');

module.exports = function (req, res) {
  if (!req.query.domain) {
    return res.boom.badRequest('Missing query param domain');
  }

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

  // Exception - clean array
  // because all types must be processed
  // before answering the request
  if (type === 'all') {
    possibleTypes = [];
  } else {
    possibleTypes.splice(possibleTypes.indexOf('all'));
    possibleTypes.splice(type);
  }

  var domain = url.parse(req.query.domain);

  if (!domain.protocol) {
    return res.boom.badRequest('Invalid domain');
  }

  crawler.queue({
    uri: req.query.domain,
    callback: crawler.findIcons.bind({
      type: type,
      // TODO put this handle elsewhere
      // and document it
      callback: function (err, href) {
        if (err) {
          return res.boom.badRequest(err);
        }

        var sendObj;

        if (type !== 'all' && typeof href === 'string') {
          sendObj = {};
          sendObj[type] = href;
        } else {
          sendObj = href;
        }

        return res.json(sendObj);
      }
    })
  });
};
