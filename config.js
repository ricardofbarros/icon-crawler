var config = {};

config.app = {
  numOfInstances: process.env.APP_NUM_INSTANCES || 'auto-detect' // TODO preciso de ver o nome disto
};

config.http = {
  port: process.env.APP_SERVER_PORT || 8000
};

config.crawler = {
  maxConnections: process.env.APP_CRAWLER_MAX_CONN || 10,
  timeout: process.env.APP_CRAWLER_TIMEOUT || 5000, // ms
  retries: process.env.APP_CRAWLER_RETRIES || 1
};

config.cache = {
  occurencesMemory: 5, // number of occurences that we should start to cache in memory
  imagesTTL: 300 // time to live of images in seconds
};

module.exports = config;
