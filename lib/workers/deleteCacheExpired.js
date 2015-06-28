var FileCacheMetadata = require('lib/helpers/FileCache/Metadata');

function deleteCacheExpired (cb) {
  return FileCacheMetadata.getExpired(function (err, results) {
    if (err) {
      return cb(err);
    }

    return FileCacheMetadata.removeExpired(results, function (err, result) {
      if (err || result !== results.length) {
        return cb(err || new Error('Something unexpected happened'));
      }

      return cb();
    });
  });

}

module.exports = deleteCacheExpired;
