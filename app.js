// Dependencies
var express = require('express');
var config = require('config.js');
var boom = require('express-boom');
var checkSysDeps = require('./checkSysDeps');
var routesHandlers = require('./app/index');
var mkdirp = require('mkdirp');

// Create tmp and tmp/msapp
// directories
mkdirp('tmp/msapp', function (err, success) {
  if (err) {
    return console.log(err || new Error('Couldn\'t create tmp and tmp/msapp directories'));
  }

  // Check system dependencies
  // this will modify config.js
  // config.app.systemDependenciesInstalled
  checkSysDeps();

  var app = express();

  // Middlewares
  app.use(boom());

  app.get('/get', routesHandlers.getImage);
  app.get('/proxy/*', routesHandlers.proxyImage);

  // Not found handler
  app.use(function (req, res) {
    return res.boom.notFound();
  });

  app.listen(config.http.port, function () {
    console.log('icon-crawler lifted at port ' + config.http.port);
  });
});
