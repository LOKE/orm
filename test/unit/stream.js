'use strict';
var Writable = require('stream').Writable;
var Promise = require('../../lib/promise');
var StreamQuery = require('../../lib/repository/base-stream');
var through2 = require('through2');
var READ = '_read';
var WRITE = '_write';

require('util').inherits(NullConsumer, Writable);
function NullConsumer () {
  Writable.call(this, {objectMode: true, highWaterMark: 1});
}
var currentBuffer = 0;
NullConsumer.prototype[WRITE] = function (chunk, enc, done) {
  currentBuffer--;
  setTimeout(done, 1);
};

describe('StreamQuery', function () {
  it('should not buffer into a slow consumer', function (done) {
    this.timeout(10000);
    var nSent = 0;
    var repo = {
      find: function (q, o) {
        if (nSent > 1000) return Promise.resolve([]);
        var arr = [];
        for (var i = 0; i < o.limit; i++) {
          arr.push({i: i});
          currentBuffer++;
          nSent++;
        }
        return Promise.resolve(arr);
      }
    };
    var stream = new StreamQuery(repo);
    var read = stream[READ];
    stream[READ] = function (n) {
      if (currentBuffer > 100) throw new Error('Too much reading: ' + currentBuffer);
      read.call(this, n);
    };
    var writable = new NullConsumer();

    stream
    .pipe(through2.obj())
    .pipe(through2.obj())
    .pipe(writable)
    .on('finish', done);
  });
});
