// Dependencies
var exec = require('child_process').exec;
var config = require('./config');
var async = require('async');

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

module.exports = function (callback) {
  if (typeof callback !== 'function') {
    callback = function () {};
  }

  return async.parallel([
    function (done) {
      ImageMagick(function () {
        return done();
      });
    }
  ], callback);
};
