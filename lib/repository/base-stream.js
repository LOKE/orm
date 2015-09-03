var Readable = require('stream').Readable;
var Promise = require('../promise');
module.exports = StreamQuery;

require('util').inherits(StreamQuery, Readable)
function StreamQuery(repo, query, options) {
  Readable.call(this, {objectMode: true});
  options = options || [];
  this.query = query || {};
  this.batchSize = options.batchSize || 100;
  this.repo = repo;
  this.index = 0;
  this.order = options.order;
  this._current = null
}

StreamQuery.prototype._read = function () {
  var self = this;
  var limit = self.batchSize;
  var repo = self.repo;
  this._current = Promise.resolve(this._current)
  .then(function () {
    if (self.ended) {
      return self.push(null);
    }
    var start = self.index;
    self.index += limit;

    return repo.find(self.query, {
      offset: start,
      limit: limit,
      order: self.order
    })
    .then(function (docs) {
      docs.forEach(function (doc) {
        self.push(doc);
      });
      if (docs.length < limit) {
        self.ended = true;
        self.push(null);
      }
    });
  });
};
