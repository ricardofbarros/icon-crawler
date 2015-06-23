// Dependencies
var Crawler = require('crawler');
var config = require('config.js');
var url = require('url');
var workerFarm = require('worker-farm');
var Cache = require('./helpers/Cache');
var IconCrawler = require('./helpers/IconCrawler');

// Create crawler
var crawler = new Crawler(config.crawler);

// Start extending crawler API

/**
 * Crawler queue callback used to crawl
 * fresh icons from domains
 * @param  {Error} err
 * @param  {Object} resp HTML Response Object
 * @param  {Object} $    Cheerio Object
 * @return {Function} Crawler callback
 */
crawler.findIcons = function (type, domainUrl, cb) {
  return function (err, res, $) {
    if (err || !$) {
      return cb(err || new Error('Not a valid website to fetch info, maybe it\'s a web API'));
    }

    var urlObj = url.parse(domainUrl);

    switch (type) {
      case 'favicon':
        crawler.__getFavicon(urlObj, $, cb);
        break;

      case 'svg':
        crawler.__getSvgIcon(urlObj, $, cb);
        break;

      case 'fluidapp':
        crawler.__getFluidIcon(urlObj, $, cb);
        break;

      case 'msapp':
        crawler.__getMsAppIcon(urlObj, $, cb);
        break;

      case 'apple-touch':
        crawler.__getAppleTouchIcon(urlObj, $, cb);
        break;

      case 'all':
        return crawler.__getAllIcons(urlObj, $, cb);

      // Fallback just in case
      default:
        return cb(new Error('Something went wrong: type -> ' + type));
    }

    // Run worker to fetch the rest of the icons types
    // the worker will be created for all types unless
    // it's type "all"
    var iconCrawlerWorker = workerFarm(require.resolve('lib/workers/iconCrawler'));
    iconCrawlerWorker(urlObj, res.body, type, function () {
      workerFarm.end(iconCrawlerWorker);
    });
  };
};

module.exports = crawler;
