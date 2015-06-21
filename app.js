// Dependencies
var express = require('express');
var config = require('config.js');
var url = require('url');
var crawler = require('lib/crawler');
var boom = require('express-boom');

var app = express();

// Middlewares
app.use(boom());

app.get('/get', function (req, res) {
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
      callback: function (err, href) {
        if (err) {
          return res.boom.badRequest(err);
        }

        var sendObj = {};

        sendObj[type] = href;

        return res.json(sendObj);
      }
    })
  });
});

// Not found handler
app.use(function (req, res) {
  return res.boom.notFound();
});

app.listen(config.http.port, function () {
  console.log('icon-crawler lifted at port ' + config.http.port);
});
