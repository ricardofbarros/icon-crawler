var config = {};

config.http = {
  port: process.env.APP_SERVER_PORT || 3000
};

config.crawler = {
  maxConnections: process.env.APP_CRAWLER_MAX_CONN || 10,
  timeout: process.env.APP_CRAWLER_TIMEOUT || 5000, // ms
  retries: process.env.APP_CRAWLER_RETRIES || 1
};

module.exports = config;
