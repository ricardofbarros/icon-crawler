// Dependencies
var exec = require('child_process').exec;
var path = require('path');
var request = require('request');
var fs = require('fs');
var mime = require('mime');
var uuid = require('node-uuid');

// This is used for msapp icons
// Because windows 8 will fill
// the .png with the background color
function windowsTileFiller (href, bckgColor, callback) {
  return request(href, function (err, res) {
    if (err) {
      return callback();
    }

    // Content-type must be honored
    if (!res.headers['content-type']) {
      return callback();
    }

    // Generate a unique filename
    var filename = uuid.v4() + '.' + mime.extension(res.headers['content-type']);

    var filePath = path.resolve('tmp/msapp/' + filename);

    // cmd to be executed by exec
    var command = [ 'convert',
      filePath,
      '-background', '"' + bckgColor + '"',
      '-alpha', 'remove',
      '-alpha', 'off',
      filePath
    ];

    // Create a write stream
    var w = fs.createWriteStream(filePath);

    w.on('error', function (err) {
      console.error('windowsTileFiller worker error', err);
      return callback();
    });

    w.on('finish', function () {
      exec(command.join(' '), function (err, stdout, stderr) {
        if (err || stderr) {
          console.error('windowsTileFiller worker error', err || stderr);
          return callback();
        }

        return callback(filePath);
      });
    });

    res.pipe(w);
  });
}

module.exports = windowsTileFiller;
