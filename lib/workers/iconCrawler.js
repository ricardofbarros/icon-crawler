// Dependencies
var IconCrawler = require('lib/helpers/IconCrawler');

function iconCrawler (crawlerOptions, typeToIgnore, callback) {
  // cleanup just in case
  var cleanUp = setTimeout(function () {
    return callback(new Error('timeout'));
  }, 60000);

  try {
    var iconCrawler = new IconCrawler(crawlerOptions);

    var methodsMap = iconCrawler.exportIconMethods('ignore', typeToIgnore);

    return iconCrawler.executeCrawlers(methodsMap, function (err, results) {
      if (err) {
        return callback(err);
      }

      clearTimeout(cleanUp);
      return callback(null, results);
    });
  } catch(err) {
    // If something happens
    // log and cleanup everything
    clearTimeout(cleanUp);
    return callback(err);
  }
}

module.exports = iconCrawler;
