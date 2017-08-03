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
      defaultValue: undefined,
      type: String
    };
    var eLastName = {
      name: 'lastName',
      type: String,
      defaultValue: undefined
    };
    expect(schema.relations).toEqual([]);

    expect(schema.specifiers.firstName.name).toBe(eFirstName.name);
    expect(schema.specifiers.firstName.column).toBe(eFirstName.column);
    expect(schema.specifiers.firstName.defaultValue).toBe(eFirstName.defaultValue);
    expect(schema.specifiers.firstName.type).toBe(eFirstName.type);

    expect(schema.specifiers.lastName.name).toBe(eLastName.name);
    expect(schema.specifiers.lastName.column).toBe(eLastName.column);
    expect(schema.specifiers.lastName.defaultValue).toBe(eLastName.defaultValue);
    expect(schema.specifiers.lastName.type).toBe(eLastName.type);

    expect(schema.specifiers.id.name).toBe('id');
    expect(schema.specifiers.id.defaultValue).toBe(undefined);
    expect(schema.specifiers.id.type).toBe(global.lib.Connection.prototype.Id);
    expect(schema.specifiers.id.autoIncrement).toBe(true);
    expect(schema.specifiers.id.primary).toBe(true);

    expect(schema.fields.length).toBe(3);
  });
});
