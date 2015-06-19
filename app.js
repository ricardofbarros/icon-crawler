// Dependencies
var express = require('express');
var config = require('config.js');
var url = require('url');
var crawler = require('lib/crawler');

var app = express();

app.get('/get', function (req, res, next) {
  if (!req.query.domain) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Bad request - missing query param domain' });
  }

  var domain = url.parse(req.query.domain);

  if (!domain.protocol) {
    return res
      .status(400)
      .json({ statusCode: 400, message: 'Bad request - query param domain is not a valid domain' });
  }

  res.json({'test': 'tst'});
});

app.use(function (req, res) {
  res.status(404)
     .json({statusCode: 404, message: 'Not found'});
});

app.listen(config.http.port, function () {
  console.log('icon-crawler lifted at port ' + config.http.port);
});
