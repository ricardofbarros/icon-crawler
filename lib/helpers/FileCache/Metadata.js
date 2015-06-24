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

function FileCacheMetadata (domain) {
  // Property dependent of argument
  this.domain = domain.replace(/^http(s*):\/\//, '');

  this.zsetKey = 'icon-crawler:zset';
  this.hmKey = 'icon-crawler:' + this.domain;
  this.multi = client.multi();
}

FileCacheMetadata.prototype.save = function (urlsObj) {
  if (!urlsObj) {
    return console.error(new Error('Invalid urlsObj in FileCacheMetadata'));
  }

  return this.multi
    .hmset(this.hmKey, urlsObj)
    .zincrby(this.zsetKey, 1, this.domain)
    .exec(function (err) {
      if (err) {
        console.error(new Error('Executing multi in FileCacheMetadata:', err));
      }
    });
};

module.exports = FileCacheMetadata;
