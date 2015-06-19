// Dependencies
var express = require('express');
var config = require('config.js');
var url = require('url');
var crawler = require('lib/crawler');
var boom = require('express-boom');

var app = express();

// Add boom middleware
app.use(boom());

app.get('/get', function (req, res, next) {
  if (!req.query.domain) {
    return res.boom.badRequest('Missing query param domain');
  }

  var domain = url.parse(req.query.domain);

  if (!domain.protocol) {
    return res.boom.badRequest('Query param domain is not a valid domain');
  }

  crawler.queue({
    uri: url.format(domain),
    callback: function (err, res, $) {

    }
  });
});

app.use(function (req, res) {
  return res.boom.notFound();
});

app.listen(config.http.port, function () {
  console.log('icon-crawler lifted at port ' + config.http.port);
});
