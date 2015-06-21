var util = {};

util.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

util.cleanCheerioObj = function (cheerioObj, filterFn) {
  var icons = [];

  for (var k in cheerioObj) {
    if (cheerioObj.hasOwnProperty(k) && cheerioObj[k].attribs) {
      icons.push(cheerioObj[k].attribs);
    }
  }

  return icons.filter(filterFn);
};

module.exports = util;
