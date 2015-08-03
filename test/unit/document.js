'use strict';
var expect = require('expect');
var Schema = global.lib.Schema;
var Document = require('../../lib/document/base');
var Modifier = require('../../lib/document/modifier');

describe('Document', function () {
  describe('modifier(doc).getChanges()', function () {
    it('should track changes', function () {
      var schema = new Schema({
        firstName: String
      });
      var d = new Document(undefined, schema);
      var modifier = new Modifier(d);
      expect(modifier.getChanges()).toEqual({firstName: null, id: null});
      d.firstName = 'Anthony';
      var changes = modifier.getChanges();
      expect(changes).toEqual({firstName: 'Anthony', id: null});
      modifier.didApplyChanges({firstName: 'Testing', id: 32});
      modifier.markAsPersisted();
      expect(d.firstName).toEqual('Testing');
      expect(modifier.getChanges()).toEqual({});
    });
  });
  describe('boolean values', function () {
    it('should cast to true on creation', function () {
      var schema = new Schema({
        firstName: String,
        isAdmin: Boolean
      });
      var d = new Document({isAdmin: 1}, schema);
      expect(d.isAdmin).toBe(true);
    });
    it('should cast to false on creation', function () {
      var schema = new Schema({
        firstName: String,
        isAdmin: Boolean
      });
      var d = new Document({isAdmin: 0}, schema);
      expect(d.isAdmin).toBe(false);
    });
  });
  describe('date values', function () {
    it('should have default value of undefined', function () {
      var schema = new Schema({
        dob: Date
      });
      var d = new Document(undefined, schema);
      expect(d.dob).toBe(undefined);
    });
    it('should allow default value of null', function () {
      var schema = new Schema({
        dob: {type: Date, defaultValue: null }
      });
      var d = new Document(undefined, schema);
      expect(d.dob).toBe(null);
    });
    it('should allow setting date to null', function () {
      var schema = new Schema({
        dob: Date
      });
      var d = new Document({dob: null}, schema);
      expect(d.dob).toBe(null);
    });
    it('should allow setting date to custom values', function () {
      var schema = new Schema({
        dob: Date
      });
      var d = new Document({dob: new Date('2010')}, schema);
      expect(d.dob.getFullYear()).toBe(2010);
    });
  });
});
