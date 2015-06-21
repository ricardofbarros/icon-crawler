var util = {};

util.isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

module.exports = util;
