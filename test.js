var path = require('path');
var exec = require('child_process').exec,
    child;
var command = [ 'convert',
  path.resolve('tmp/windows-tile.png'),
  '-background', '"#f20000"',
  '-alpha', 'remove',
  '-alpha', 'off',
  path.resolve('tmp/windows.png')
]


child = exec(command.join(' '),
  function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});
