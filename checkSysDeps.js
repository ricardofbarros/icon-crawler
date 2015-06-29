// Dependencies
var exec = require('child_process').exec;
var config = require('./config');
var async = require('async');
var url = require('url');

function ImageMagick (callback) {
  exec('convert --version', function (err, stdout) {
    if (err) {
      return callback(err);
    }

    if (typeof stdout === 'string' && stdout.toLowerCase().search('imagemagick')) {
      config.app.systemDependencies.ImageMagick = true;
      return callback();
    }
  });
}

function reverseProxy () {
  var httpDomain = url.format(config.app.http);
  var reverseProxyDomain = url.format(config.reverseProxy.http);

  if (httpDomain !== reverseProxyDomain) {
    config.app.systemDependencies.reverseProxy = true;
  }
}

module.exports = function (callback) {
  if (typeof callback !== 'function') {
    callback = function () {};
  }

  return async.parallel([
    function (done) {
      ImageMagick(function () {
        return done();
      });
    },
    function (done) {
      reverseProxy();
      return done();
    }
  ], callback);
};
