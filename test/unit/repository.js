'use strict';
var expect = require('expect');
var Schema = global.lib.Schema;
var Repository = require('../../lib/repository/base');

describe('Repository', function () {
  describe('new()', function () {
    it('should create new objects', function () {
      var schema = new Schema({
        firstName: String
      });
      var repo = new Repository(schema);
      var d = repo.new();
      expect(d).toExist();
      var d2 = repo.new();
      expect(d2).toExist();
    });
  });
});
