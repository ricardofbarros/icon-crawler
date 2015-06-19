// Dependencies
var Crawler = require('crawler');
var config = require('config.js');

var crawler = new Crawler(config.crawler);

// Extend crawler module
crawler.findFavicon = function (err, resp, $) {
  // function scope will be binded
  // in app.js
  var res = this.res;

  if (err) {
    return res.boom.badRequest(err);
  }

  console.log(resp.body)
  res.end();
}

module.exports = crawler;
