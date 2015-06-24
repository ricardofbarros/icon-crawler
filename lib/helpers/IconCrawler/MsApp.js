// Dependencies
var util = require('lib/util');
var parseXml = require('xml2js').parseString;
var color = require('onecolor');
var windowsTileFiller = require('lib/workers/windowsTileFiller');
var config = require('config.js');

function IconCrawlerMsApp (options) {
  this.$ = options.$;
  this.domain = options.domain;
  this.cb = options.cb;
}

IconCrawlerMsApp.prototype.getMetaContent = function (element) {
  var _iconUrl = util.cleanCheerioObj(this.$(element));
  _iconUrl = !util.isArrayEmpty(_iconUrl) ? _iconUrl[0] : false;
  _iconUrl = _iconUrl.content ? _iconUrl.content : false;
  _iconUrl = _iconUrl !== 'null' ? _iconUrl : false;
  return _iconUrl;
};

IconCrawlerMsApp.prototype.parseBrowserConfig = function (str, callback) {
  if (typeof str !== 'string') {
    return callback(new Error('first argument must be a string'));
  }

  return parseXml(str, function (err, elem) {
    if (err) {
      return callback(err);
    }

    elem = util.isArray(elem) ? elem[0] : elem;

    // Malformed browserconfig.xml
    if (!elem || !elem.browserconfig || !elem.browserconfig.msapplication) {
      return callback();
    }

    elem = elem.browserconfig.msapplication;
    elem = util.isArray(elem) ? elem[0] : elem;

    // Tile is not defined
    if (!elem.tile) {
      return callback();
    }

    elem = elem.tile;
    elem = util.isArray(elem) ? elem[0] : elem;

    var tileColor = elem['TileColor'] ? elem['TileColor'] : false;
    tileColor = tileColor && util.isArray(tileColor) ? tileColor[0] : false;

    var square70 = elem['square70x70logo'] ? elem['square70x70logo'] : false;
    square70 = square70 && util.isArray(square70) ? square70[0] : false;
    square70 = square70 && typeof square70 === 'object' ? square70 : false;
    square70 = square70 && square70.$ ? square70.$ : false;
    square70 = square70 && square70.src ? square70.src : false;

    var tileImage = elem['TileImage'] ? elem['TileImage'] : false;
    tileImage = tileImage && util.isArray(tileImage) ? tileImage[0] : false;
    tileImage = tileImage && typeof tileImage === 'object' ? tileImage : false;
    tileImage = tileImage && tileImage.$ ? tileImage.$ : false;
    tileImage = tileImage && tileImage.src ? tileImage.src : false;

    // first try
    if (square70) {
      return callback(null, {
        icon: square70,
        color: tileColor
      });
    }

    // 1st fallback
    if (tileImage) {
      return callback(null, {
        icon: tileImage,
        color: tileColor
      });
    }

    return callback();
  });
};

// Logic to process a tile image
IconCrawlerMsApp.prototype.getTileColor = function (tileColor) {
  // If ImageMagick is not installed
  // the tilefiller workers is useless
  // so just retyurn the raw tile image
  if (!config.app.systemDependencies.ImageMagick) {
    console.log('Please install ImageMagick in your system');
    return false;
  }

  if (!tileColor) {
    return false;
  }

  // Check if tile color is defined
  tileColor = tileColor ? tileColor.toLowerCase() : false;

  // Check if is a valid CSS color and parse it
  // to a hex representation
  var colorParsed = color(tileColor);
  tileColor = colorParsed ? colorParsed.hex() : false;

  // And lastly check if color is different than white
  tileColor = tileColor !== '#ffffff' ? tileColor : false;

  return tileColor;
};

// End execution logic
IconCrawlerMsApp.prototype.end = function (href, tileColor) {
  var self = this;

  href = util.getIconUrl(this.domain, href);

  if (tileColor) {
    return windowsTileFiller(href, tileColor, function (file) {
      return self.cb(null, file);
    });
  }

  return this.cb(null, href);
};

module.exports = IconCrawlerMsApp;
