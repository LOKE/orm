var Readable = require('stream').Readable;
var Promise = require('../promise');
module.exports = StreamQuery;

require('util').inherits(StreamQuery, Readable)
function StreamQuery(repo, query, options) {
  Readable.call(this, {objectMode: true});
  options = options || [];
  this.query = query || {};
  this.repo = repo;
  this.index = 0;
  this.order = options.order;
  this._current = null
}

StreamQuery.prototype._read = function (n) {
  var self = this;
  var repo = self.repo;
  this._current = Promise.resolve(this._current)
  .then(function () {
    if (self.ended) {
      return self.push(null);
    }
    var start = self.index;
    self.index += n;

    return repo.find(self.query, {
      offset: start,
      limit: n,
      order: self.order
    })
    .then(function (docs) {
      docs.forEach(function (doc) {
        self.push(doc);
      });
      if (docs.length < n) {
        self.ended = true;
        self.push(null);
      }
    });
  })
  .then(null, function (err) {
    setTimeout(function () {
      self.emit('error', err);
    }, 0);
    throw err;
  })
};
