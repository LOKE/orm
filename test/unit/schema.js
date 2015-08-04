'use strict';
var Schema = global.lib.Schema;
var expect = require('expect');

describe('Schema', function () {
  it('should allow defining properties', function () {
    var schema = new Schema({
      firstName : { type: String, column: 'first_name' },
      lastName  : String
    });
    var eFirstName = {
      name: 'firstName',
      column: 'first_name',
      type: String,
      defaultValue: undefined
    };
    var eLastName = {
      name: 'lastName',
      type: String,
      defaultValue: undefined
    };
    expect(schema.relations).toEqual([]);
    expect(schema.specifiers.firstName).toEqual(eFirstName);
    expect(schema.specifiers.lastName).toEqual(eLastName);
    expect(schema.fields).toEqual([eFirstName, eLastName, {name: 'id', defaultValue: undefined, autoIncrement: true, primary: true, type: global.lib.Connection.prototype.Id}]);
  });
});
