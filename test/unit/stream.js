'use strict';
var Schema = global.lib.Schema;
var Writable = require('stream').Writable;
var expect = require('expect');
var P = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;
var StreamQuery = require('../../lib/repository/base-stream');
var through2 = require('through2');

require('util').inherits(NullConsumer, Writable);
function NullConsumer () {
  Writable.call(this, {objectMode: true, highWaterMark: 1});
}
var maxBufferSize = 0;
var currentBuffer = 0;
var nSent = 0;
NullConsumer.prototype._write = function (chunk, enc, done) {
  currentBuffer--;
  setTimeout(done, 1);
};

describe('StreamQuery', function () {
  it('should not buffer into a slow consumer', function (done) {
    this.timeout(10000);
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
    var _read = stream._read;
    var nReadCalls = 0;
    stream._read = function (n) {
      nReadCalls++;
      if (currentBuffer > 100) throw new Error('Too much reading: ' + currentBuffer);
      _read.call(this, n);
    }
    var writable = new NullConsumer();
    stream
    .pipe(through2.obj())
    .pipe(through2.obj())
    .pipe(writable)
    .on('finish', done);
  });
});
