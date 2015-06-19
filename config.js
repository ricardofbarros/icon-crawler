var config = {};

config.http = {
  port: process.env.APP_SERVER_PORT || 3000
};

config.crawler = {
  maxConnections: process.env.APP_CRAWLER_MAX_CONN || 10
};

module.exports = config;
