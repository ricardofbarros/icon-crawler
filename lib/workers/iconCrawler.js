// Dependencies
var cheerio = require('cheerio');
var crawler = require('../crawler');

function imageCrawler (urlObj, body, typeToIgnore, callback) {
  try {
    var $ = cheerio.load(body);

    var methodsMap = {
      'favicon': crawler.__getFavicon.bind(null, urlObj, $),
      'svg': crawler.__getSvgIcon.bind(null, $),
      'fluidapp': crawler.__getFluidIcon.bind(null, $),
      'msapp': crawler.__getMsAppIcon.bind(null, $),
      'apple-touch': crawler.__getAppleTouchIcon.bind(null, $)
    };

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

module.exports = imageCrawler;
