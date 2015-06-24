// Dependencies
var Crawler = require('crawler');
var config = require('config.js');
var Cache = require('./helpers/Cache');
var IconCrawler = require('./helpers/IconCrawler');

// Create crawler
var crawler = new Crawler(config.crawler);

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

    // Construct helpers
    var iconCrawler = new IconCrawler({ $: $, domain: domainUrl, htmlBody: res.body });
    var cache = new Cache(domainUrl);

    iconCrawler.on('finish', function (urlsObj) {
      cache.store(urlsObj);
    });

    return iconCrawler.get(type, cb);
  };
};

module.exports = crawler;
