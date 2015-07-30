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
      type: String
    };
    var eLastName = {
      name: 'lastName',
      type: String
    };
    expect(schema.relations).toEqual([]);
    expect(schema.firstName).toEqual(eFirstName);
    expect(schema.lastName).toEqual(eLastName);
    expect(schema.fields).toEqual([eFirstName, eLastName, {name: 'id', autoIncrement: true, primary: true, type: global.lib.Connection.prototype.Id}]);
  });
});
