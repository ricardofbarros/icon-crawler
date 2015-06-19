// Dependencies
var Crawler = require('crawler');
var config = require('config.js');

var crawler = new Crawler(config.crawler);

module.exports = crawler;
