var cluster = require('cluster');
var config = require('config.js')

if (cluster.isMaster) {
  var numOfInstances = config.app.numOfInstances;

  if (numOfInstances === 'auto-detect') {
    numOfInstances = require('os').cpus().length;
  }

  // Fork workers
  for (var i = 0; i < numOfInstances; i++) {
    cluster.fork();
  }

  cluster.on('exit', function (worker, code, signal) {
    // Reboot
  });
} else {
  require('app.js');
}
