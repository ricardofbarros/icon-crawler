// Dependencies
var express = require('express');
var config = require('config.js');
var boom = require('express-boom');
var routesHandlers = require('./app/index');

var app = express();

// Middlewares
app.use(boom());

app.get('/get', routesHandlers.getImage);
app.get('/proxy', routesHandlers.proxyImage);

// Not found handler
app.use(function (req, res) {
  return res.boom.notFound();
});

app.listen(config.http.port, function () {
  console.log('icon-crawler lifted at port ' + config.http.port);
});
