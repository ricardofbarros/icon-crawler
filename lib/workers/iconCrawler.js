// Dependencies
var IconCrawler = require('lib/helpers/IconCrawler');

function iconCrawler (crawlerOptions, typeToIgnore, callback) {
  // cleanup just in case
  var cleanUp = setTimeout(function () {
    return callback();
  }, 60000);

  try {
    var iconCrawler = new IconCrawler(crawlerOptions);

    var methodsMap = iconCrawler.exportIconMethods('ignore', typeToIgnore);

    return iconCrawler.executeCrawlers(methodsMap, function (err, results) {
      if (err) {
        console.error('iconCrawler worker error', err);
      }

      clearTimeout(cleanUp);
      return callback(results);
    });
  } catch(err) {
    // If something happens
    // log and cleanup everything
    console.error('iconCrawler worker error', err);
    clearTimeout(cleanUp);
    return callback();
  }
}

module.exports = iconCrawler;
