// Dependencies
var exec = require('child_process').exec;
var path = require('path');

// This is used for msapp icons
// Because windows 8 will fill
// the .png with the background color
function windowsTileFiller(filePath, bckgColor) {
  var command = [ 'convert',
    path.resolve('tmp/' + filePath),
    '-background', '"' + bckgColor + '"',
    '-alpha', 'remove',
    '-alpha', 'off',
    path.resolve('tmp/out.png')
  ];

  var child = exec(command.join(' '), function (err, stdout, stderr) {

  });
}

module.exports = windowsTileFiller;
