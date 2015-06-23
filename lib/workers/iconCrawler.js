// Dependencies
var cheerio = require('cheerio');
var crawler = require('../crawler');

function iconCrawler (urlObj, body, typeToIgnore, callback) {
  // cleanup just in case
  var cleanUp = setTimeout(function () {
    return callback();
  }, 60000);

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

      clearTimeout(cleanUp);
      return callback();
    });
  } catch(err) {
    // If something happens
    // log and cleanup everything
    console.error(err);
    clearTimeout(cleanUp);
    return callback();
  }
}

module.exports = iconCrawler;
