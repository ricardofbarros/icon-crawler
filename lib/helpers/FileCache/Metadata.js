// Dependencies
var redis = require('redis');
var config = require('config.js');
var client = redis.createClient(config.redis.options);

if (config.redis.password) {
  client.auth(config.redis.password);
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
  if (!this.urlsObj) {
    return console.error('Invalid urlsObj in FileCacheMetadata');
  }

  return this.multi
    .hmset(this.hmKey, urlsObj)
    .zincrby(this.zsetKey, 1, this.domain)
    .exec(function (err) {
      if (err) {
        console.error('Executing multi in FileCacheMetadata:', err);
      }
    });
};

module.exports = FileCacheMetadata;
