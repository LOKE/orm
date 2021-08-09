"use strict";
var expect = require("expect");
var Schema = global.lib.Schema;
var Repository = require("../../lib/repository/base");

describe("Repository", function () {
  describe("new()", function () {
    it("should create new objects", function () {
      var repo = new Repository(new Schema({}));
      var d = repo.new();
      expect(d).toExist();
      var d2 = repo.new();
      expect(d2).toExist();
    });
    it("should create objects with correct prototype", function () {
      var repo = new Repository(new Schema({}));
      var d = repo.new();
      var x = (repo.prototype.x = {});
      expect(d.x).toExist();
      expect(d.x).toEqual(x);
    });
    it("should create empty arrays for has-many relations", function () {
      var repo2 = new Repository(new Schema());
      var repo = new Repository(new Schema({ tests: [repo2] }));
      var d = repo.new();
      expect(d.tests).toExist();
      expect(d.tests).toEqual([]);
    });
    it("should create objects with the correct values", function () {
      var repo2 = new Repository(new Schema());
      var repo = new Repository(new Schema({ name: String, tests: [repo2] }));
      var d = repo.new({ name: "test" });
      expect(d.tests).toExist();
      expect(d.tests).toEqual([]);
      expect(d.name).toEqual("test");
      expect(d.id).toBe(undefined);
    });
  });
});
