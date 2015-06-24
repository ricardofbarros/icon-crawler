var config = {};

config.app = {
  // TODO better name for this. is it needed?
  numOfInstances: process.env.APP_NUM_INSTANCES || 'auto-detect',

  // Smallest possible
  // we dont need security
  // we need speed
  urlShortenerCipherPass: process.env.APP_URL_CIPHER || 'd',

  // URI to serve cached images in
  // the filesystem through nginx
  nginxIconUri: process.env.APP_CACHED_ICON_URI || '/images',

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
    ImageMagick: false
  },

  // Icon types. This is as well
  // the response interface
  types: {
    favicon: process.env.APP_TYPE_FAVICON || 'favicon',
    svg: process.env.APP_TYPE_SVG || 'svg',
    fluid: process.env.APP_TYPE_FLUID || 'fluidapp',
    msapp: process.env.APP_TYPE_MSAPP || 'msapp',
    all: process.env.APP_TYPE_ALL || 'all',
    appleTouch: process.env.APP_TYPE_APLT || 'apple-touch'
  }
};

config.http = {
  port: process.env.APP_SERVER_PORT || 8000,
  hostname: process.env.APP_SERVER_HOST || 'localhost',
  protocol: process.env.APP_SERVER_PROTOCOL || 'http'
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
