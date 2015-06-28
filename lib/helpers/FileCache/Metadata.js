// Dependencies
var redis = require('redis');
var config = require('config.js');
var client = redis.createClient(config.redis.options);

if (config.redis.authPassword) {
  client.auth(config.redis.authPassword);
}

client.on('error', function (err) {
  console.error('Redis error:', err);
});

var zsetKey = 'icon-crawler:zset';

function FileCacheMetadata (domain) {
  // Property dependent of argument
  this.domain = domain.replace(/^http(s*):\/\//, '');

  this.hmKey = 'icon-crawler:' + this.domain;
}

FileCacheMetadata.prototype.get = function (cb) {
  return client.hgetall(this.hmKey, cb);
};

FileCacheMetadata.prototype.create = function (urlsObj) {
  if (!urlsObj) {
    return console.error(new Error('Invalid urlsObj in FileCacheMetadata'));
  }

  return client.multi()
    .hmset(this.hmKey, urlsObj)
    .zadd(zsetKey, 1, this.domain)
    .exec(function (err) {
      if (err) {
        console.error(new Error('FileCacheMetadata.save -> ', err));
      }
    });
};

FileCacheMetadata.prototype.incrementZset = function () {
  return client.zincrby(zsetKey, 1, this.domain, function (err) {
    if (err) {
      console.error(new Error('FileCacheMetadata.incrementZset -> ', err));
    }
  });
};

FileCacheMetadata.decrementAllFromZset = function (cb) {
  return client.zrange(zsetKey, 0, -1, function (err, members) {
    if (err) {
      return cb(err);
    }

    if (!members || !(members instanceof Array)) {
      return;
    }

    var commandsArray = [];

    members.forEach(function (member) {
      commandsArray.push('zincrby ' + zsetKey + '-1 "' + member + '"');
    });

    return client.multi(commandsArray)
      .exec(cb);
  });
};

FileCacheMetadata.removeExpired = function (cb) {
  return client.zremrangebyscore(zsetKey, '-inf', 0, cb);
};

module.exports = FileCacheMetadata;
