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
      var d = new Document();
      var modifier = new Modifier(d);
      modifier.configure(schema);
      expect(modifier.getChanges()).toEqual({});
      d.firstName = 'Anthony';
      var changes = modifier.getChanges();
      expect(changes).toEqual({firstName: 'Anthony'});
      modifier.didApplyChanges({firstName: 'Testing'});
      modifier.markAsPersisted();
      expect(d.firstName).toEqual('Testing');
      expect(modifier.getChanges()).toEqual({});
    });
  });
});
