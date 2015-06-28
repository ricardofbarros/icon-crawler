var FileCacheMetadata = require('lib/helpers/FileCache/Metadata');

function zsetDecrementer (cb) {
  FileCacheMetadata.decrementAllFromZset(cb);
}

module.exports = zsetDecrementer;
