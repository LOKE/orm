"use strict";
var Type = require("./type");
var Repository = require("./repository/base");
module.exports = Schema;

var typesByString = {
  string: Type.String,
  number: Type.Number,
  date: Type.Date,
  text: Type.Text,
  boolean: Type.Boolean,
  id: Type.Id,
  enum: Type.Enum,
};

function getTypeFromString(typeName) {
  var t = typesByString[typeName.toLowerCase()];
  if (!t) throw new Error("Unknown schema type: " + typeName);
  return t;
}

function getDefaultValue(details) {
  var value = details.defaultValue;
  if (value === undefined) return;
  if (value === Date.now) {
    return function () {
      return new Date();
    };
  }
  if (typeof value === "function") {
    return value;
  }
  return function () {
    return value;
  };
}

/**
 * Represents a property or relation on an object
 *
 * (immutable)
 *
 * @param {String} name property name on the object
 * @param {Type} [definition] type specifier shorthand
 * @param {Type} definition.type type specifier or another repository -- see type.js
 * @param {Boolean} [definition.primary]
 * @param {String} [definition.foreignKey]
 * @param {String} [definition.column]
 * @param {Object} [definition.scope]
 * @param {Function | Boolean | String | Number | Date} [definition.defaultValue]
 * @param {Object} [definition.autoIncrement]
 */
function Specifier(name, definition) {
  this.name = name;
  // {firstName: String} and {firstName: {type: String}} are equivalent.
  var details = definition.type ? definition : { type: definition };
  var type = details.type;

  // Convert type = 'string' to type = Type.String
  if (typeof type === "string") type = getTypeFromString(type);

  if (details.foreignKey) this.foreignKey = details.foreignKey;
  if (details.scope) this.scope = details.scope;
  if (details.column) this.column = details.column;
  if (details.primary) this.primary = details.primary;
  if (details.autoIncrement) this.autoIncrement = details.autoIncrement;

  this.defaultValue = getDefaultValue(details);

  if (Array.isArray(type)) {
    if (!type.length) throw new Error("Empty array as type specifier.");
    var first = type[0];

    if (typeof first === "string") {
      // Array of strings: {type: ['ADMIN', 'CUSTOMER']}
      // Enumerable:
      this.array = true;
      this.type = Type.Enum;
      this.values = type;
    } else if (first instanceof Repository) {
      this.type = Type.HasMany;
      this.target = first;
    } else {
      throw new Error("Unknown array type specifier.");
    }
  } else if (type instanceof Repository) {
    // Nested schema reference
    this.type = Type.HasOne;
    this.target = type;
  } else if (type === Date) {
    // Don't use Date directly, because Date('2015') returns strings, not objects
    this.type = Type.Timestamp;
  } else {
    this.type = type;
  }
}

/**
 * Schemas describe what fields and relations a document should have.
 * They also have extra details which can be used by the persistance layer (e.g. column name)
 *
 * (immutable)
 *
 * @param {ScemaDescription} opts
 */
function Schema(opts) {
  // Direct keys on this object:
  this.fields = [];
  // Arrays and sub-objects:
  this.relations = [];
  // Dictionary of all fields and relations:
  this.specifiers = {};
  for (var name in opts) {
    if (Object.hasOwnProperty.call(opts, name)) {
      if (!opts[name]) throw new Error("Missing value for schema key: " + name);
      var spec = new Specifier(name, opts[name]);
      this.specifiers[name] = spec;
      this[spec.target ? "relations" : "fields"].push(spec);
    }
  }
  this.primaryFields = this.fields.filter(function (f) {
    return f.primary;
  });
  if (!this.primaryFields.length) {
    // Default primary key:
    var idField = (this.specifiers.id = new Specifier("id", {
      type: Type.Id,
      primary: true,
      autoIncrement: true,
    }));
    this.primaryFields.push(idField);
    this.fields.push(idField);
  }
}
