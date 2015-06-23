// Dependencies
var exec = require('child_process').exec;
var config = require('./config');

function ImageMagick () {
  exec('convert --version', function (err, stdout) {
    if (err) {
      return;
    }

    if (typeof stdout === 'string' && stdout.toLowerCase().search('imagemagick')) {
      config.app.systemDependencies.ImageMagick = true;
    }
  });
}

module.exports = function () {
  ImageMagick();
};
