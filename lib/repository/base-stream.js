'use strict';

var Readable = require('stream').Readable;
var Promise = require('../promise');
module.exports = StreamQuery;
var READ = '_read';

require('util').inherits(StreamQuery, Readable);
function StreamQuery(repo, query, options) {
  Readable.call(this, {objectMode: true});
  options = options || [];
  this.query = query || {};
  this.repo = repo;
  this.index = 0;
  this.order = options.order;
  this.current = null;
}

StreamQuery.prototype[READ] = function (n) {
  var self = this;
  var repo = self.repo;
  this.current = Promise.resolve(this.current)
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
  });
};
