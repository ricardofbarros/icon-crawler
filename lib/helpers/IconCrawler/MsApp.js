// Dependencies
var util = require('lib/util');
var parseXml = require('xml2js').parseString;
var color = require('onecolor');
var windowsTileFiller = require('./workers/windowsTileFiller');
var config = require('config.js');

function MsApp (options) {
  this.$ = options.$;
  this.domain = options.domain;
  this.cb = options.cb;
}

MsApp.prototype.getMetaContent = function (element) {
  var _iconUrl = util.cleanCheerioObj(this.$(element));
  _iconUrl = !util.isArrayEmpty(_iconUrl) ? _iconUrl[0] : false;
  _iconUrl = _iconUrl.content ? _iconUrl.content : false;
  _iconUrl = _iconUrl !== 'null' ? _iconUrl : false;
  return _iconUrl;
};

MsApp.prototype.parseBrowserConfig = function (str) {
  var self = this;

  return parseXml(str, function (err, result) {
    if (err) {
      return self.cb(err);
    }

    // Malformed browserconfig.xml
    if (!str && !str.browserconfig && !str.browserconfig.msapplication) {
      return self.cb();
    }

    str = str.browserconfig.msapplication;

    // Tile is not defined
    if (!str.tile) {
      return self.cb();
    }

    str = str.tile;

  });
};

// Logic to process a tile image
MsApp.prototype.processTileImage = function (href) {
  // If ImageMagick is not installed
  // the tilefiller workers is useless
  // so just retyurn the raw tile image
  if (!config.app.systemDependencies.ImageMagick) {
    return this.end(href);
  }

  var tileColor = util.cleanCheerioObj(this.$('meta[name=msapplication-TileColor]'));
  tileColor = !util.isArrayEmpty(tileColor) ? tileColor[0].content : false;

  // Check if tile color is defined
  tileColor = tileColor ? tileColor.toLowerCase() : false;

  // Check if is a valid CSS color and parse it
  // to a hex representation
  var colorParsed = color(tileColor);
  tileColor = colorParsed ? colorParsed.hex() : false;

  // And lastly check if color is different than white
  tileColor = tileColor !== '#ffffff' ? tileColor : false;

  // If there is not a valid tile color there is
  // no need to run the windowsTileFiller worker
  if (!tileColor) {
    return this.end(href);
  }

  // TODO see how this can be done
  return windowsTileFiller();
};

// End execution logic
MsApp.prototype.end = function (href) {
  href = util.getIconUrl(this.domain, href);

  return this.cb(null, href);
};

module.exports = MsApp;
