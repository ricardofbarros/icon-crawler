// Dependencies
var express = require('express');
var config = require('config.js');
var boom = require('express-boom');
var checkSysDeps = require('./checkSysDeps');
var routesHandlers = require('./app/index');
var mkdirp = require('mkdirp');
var workerFarm = require('worker-farm');
var path = require('path');

// Create tmp and tmp/__queueMsAppIcons
// directories
mkdirp('tmp/__queueMsAppIcons', function (err, success) {
  if (err) {
    return console.error(err || new Error('Couldn\'t create tmp and tmp/__queueMsAppIcons directories'));
  }

  // Create cache workers constructors
  var deleteCacheExpired = workerFarm(require.resolve('./lib/workers/deleteCacheExpired'));
  var zsetDecrementer = workerFarm(require.resolve('./lib/workers/zsetDecrementer'));

  var app = express();

  // Check system dependencies
  // this will modify config.js
  // config.app.systemDependenciesInstalled
  checkSysDeps(function (err) {
    if (err) {
      return console.error('Something happened at the boot', err);
    }

    // Middlewares
    app.use(boom());

    app.get('/get', routesHandlers.getImage);
    app.get('/proxy/*', routesHandlers.proxyImage);

    if (!config.app.systemDependencies.reverseProxy) {
      app.get('/tmp/*', function (req, res) {
        var filePath = req.originalUrl.substring(1);
        res.sendFile(path.resolve(filePath));
      });
    }

    // Not found handler
    app.use(function (req, res) {
      return res.boom.notFound();
    });

    app.listen(config.app.http.port, function () {
      console.log('icon-crawler lifted at port ' + config.app.http.port);

      // Start cache workers
      setInterval(function () {
        // This worker is responsible to decrement -1 to all
        // domain in the set
        zsetDecrementer(function (err) {
          if (err) {
            return console.error('Error on zsetDecrementer worker', err);
          }

          // Now that we decremented all members from the set
          // time to delete files that are no longer of interest
          deleteCacheExpired(function (err) {
            if (err) {
              return console.error('Error on deleteCacheExpired worker', err);
            }
          });
        });
      }, parseFloat(config.cache.checkInterval * 60 * 1000));
    });
  });
});
