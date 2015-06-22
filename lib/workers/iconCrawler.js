// Dependencies
var cheerio = require('cheerio');
var crawler = require('../crawler');

function iconCrawler (urlObj, body, typeToIgnore, callback) {
  try {
    var $ = cheerio.load(body);

    var methodsMap = crawler.exportIconMethods(urlObj, $);

    // delete the function that was already
    // executed
    delete methodsMap[typeToIgnore];

    return crawler.executeCrawlers(methodsMap, function (err) {
      if (err) {
        console.error(err);
      }

      return callback();
    });
  } catch(err) {
    // If something happens
    // log and cleanup everything
    console.error(err);
    return callback();
  }
}

module.exports = iconCrawler;
