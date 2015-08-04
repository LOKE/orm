'use strict';
var Type = require('./type');
var Repository = require('./repository/base');
module.exports = Schema;


var typesByString = {
  string   : Type.String,
  number   : Type.Number,
  date     : Type.Date,
  text     : Type.Text,
  boolean  : Type.Boolean,
  id       : Type.Id,
  enum     : Type.Enum
};

function getTypeFromString(typeName) {
  var t = typesByString[typeName.toLowerCase()];
  if (!t) throw new Error('Unknown schema type: ' + typeName);
  return t;
}

function getDefaultValue(details) {
  var value = details.defaultValue;
  if (value === undefined) return;
  if (value === Date.now) {
    return function () { return new Date(); };
  }
  if (typeof value === 'function'){
    return value;
  }
  return function () { return value; };
}

/**
 * Represents a property or relation on an object
 * @param {String} name property name on the object
 * @param {Type} definition.type type specifier or another repository -- see types.js
 * @param {Boolean} [definition.primary]
 * @param {String} [definition.column]
 */
function Specifier(name, definition) {
  this.name = name;
  // {firstName: String} and {firstName: {type: String}} are equivalent.
  var details = definition.type ? definition : {type: definition};
  var type = details.type;

  // Convert type = 'string' to type = Type.String
  if (typeof type === 'string') type = getTypeFromString(type);

  if (details.foreignKey) this.foreignKey = details.foreignKey;
  if (details.scope)      this.scope      = details.scope;
  if (details.column)     this.column     = details.column;
  if (details.primary)    this.primary    = details.primary;
  if (details.autoIncrement) this.autoIncrement = details.autoIncrement;

  this.defaultValue = getDefaultValue(details);

  if (Array.isArray(type)) {
    if (!type.length) throw new Error('Empty array as type specifier.');
    var first = type[0];

    if (typeof first === 'string') {
      // Enumerable:
      this.array = true;
      this.type = Type.Enum;
      this.values = type;
    } else if (first instanceof Repository) {
      this.type       = Type.HasMany;
      this.target     = first;
    } else {
      throw new Error('Unknown array type specifier.');
    }
  } else if (type instanceof Repository) {
    this.type = Type.HasOne;
    this.target = type;
  } else if (type === Date) {
    this.type = Type.Timestamp;
  } else {
    this.type = type;
  }
}

function Schema(opts) {
  this.fields    = [];
  this.relations = [];
  this.specifiers = {};
  for (var name in opts) {
    if (Object.hasOwnProperty.call(opts, name)) {
      if (!opts[name]) throw new Error('Missing value for schema key: ' + name);
      var spec = new Specifier(name, opts[name]);
      this.specifiers[name] = spec;
      this[spec.target ? 'relations' : 'fields'].push(spec);
    }
  }
  this.primaryField = this.fields.filter(function (f) {return f.primary; })[0];
  if (!this.primaryField) {
    this.specifiers.id = this.primaryField = new Specifier('id', {type: Type.Id, primary: true, autoIncrement: true});
    this.fields.push(this.primaryField);
  }
}
