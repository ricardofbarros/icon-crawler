// Dependencies
var cheerio = require('cheerio');

function imageCrawler (body, typeToIgnore, callback) {
  try {
    var $ = cheerio.load(body);

    
  } catch(e) {
    // If something happens
    // cleanup everything
    return callback();
  }
}

module.exports = imageCrawler;
