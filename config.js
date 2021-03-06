var config = {};

config.app = {
  // Smallest possible
  // we dont need security
  // we need speed
  urlShortenerCipherPass: process.env.APP_URL_CIPHER || 'd',

  // Node.js App HTTP Server config
  http: {
    port: process.env.APP_SERVER_PORT || 8000,
    hostname: process.env.APP_SERVER_HOST || 'localhost',
    protocol: process.env.APP_SERVER_PROTOCOL || 'http'
  },

  // System dependencies needed
  // true ->  installed
  // false -> not installed
  //
  // Default value is false,
  // on app boot checkSysDeps.js will
  // check if the dependencies are
  // installed and modify the values
  // if needed
  systemDependencies: {
    ImageMagick: false,
    reverseProxy: false
  },

  // Icon types. This is as well
  // the response interface
  types: {
    favicon: process.env.APP_TYPE_FAVICON || 'favicon',
    svg: process.env.APP_TYPE_SVG || 'svg',
    fluid: process.env.APP_TYPE_FLUID || 'fluidapp',
    msapp: process.env.APP_TYPE_MSAPP || 'msapp',
    appleTouch: process.env.APP_TYPE_APLT || 'apple-touch'
  },

  // Useful for FileCache
  directoryPath: __dirname
};

config.reverseProxy = {
  http: {
    port: process.env.APP_REVPROXY_SERVER_PORT || 8000,
    hostname: process.env.APP_REVPROXY_SERVER_HOST || 'localhost',
    protocol: process.env.APP_REVPROXY_SERVER_PROTOCOL || 'http'
  }
};

config.crawler = {
  maxConnections: process.env.APP_CRAWLER_MAX_CONN || 10,
  timeout: process.env.APP_CRAWLER_TIMEOUT || 5000, // ms
  retries: process.env.APP_CRAWLER_RETRIES || 1
};

config.redis = {
  options: {
    host: process.env.APP_REDIS_HOST || 'localhost',
    port: process.env.APP_REDIS_PORT || 6379
  },
  authPassword: process.env.APP_REDIS_AUTH_PASS || false
};

config.cache = {
  checkInterval: process.env.APP_CACHE_CHECK_INTERVAL || 0.5 // minutes
};

module.exports = config;
