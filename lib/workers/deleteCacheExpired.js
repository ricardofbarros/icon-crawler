var FileCacheMetadata = require('lib/helpers/FileCache/Metadata');

function deleteCacheExpired (cb) {
  return FileCacheMetadata.removeExpired(cb);
}

module.exports = deleteCacheExpired;
