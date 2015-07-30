'use strict';
var Type = require('./type');
var Repository = require('./repository/base');
module.exports = Schema;

/**
 * Represents a property or relation on an object
 * @param {String} name property name on the object
 * @param {Type} definition.type type specifier or another repository -- see types.js
 * @param {Boolean} [definition.primary]
 * @param {String} [definition.column]
 */
function Specifier(name, definition) {
  // {firstName: String} and {firstName: {type: String}} are equivalent.
  var details = definition.type ? definition : {type: definition};
  var type = details.type;

  // Convert type = 'string' to type = Type.String
  if (typeof type === 'string') type = Type.fromString(type);

  this.name = name;
  if (details.foreignKey) this.foreignKey = details.foreignKey;
  if (details.scope)      this.scope      = details.scope;
  if (details.column)     this.column     = details.column;
  if (details.primary)    this.primary    = details.primary;
  if (details.autoIncrement) this.autoIncrement = details.autoIncrement;

  if (details.defaultValue) {
    if (details.defaultValue === Date.now) {
      this.defaultValue = function () { return new Date(); };
    } else {
      this.defaultValue = details.defaultValue;
    }
  }

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
  } else {
    this.type = type;
  }

}

function Schema(opts) {
  this.fields    = [];
  this.relations = [];
  for (var name in opts) {
    if (opts.hasOwnProperty(name)) {
      if (!opts[name]) throw new Error('Missing value for schema key: ' + name);
      var spec = new Specifier(name, opts[name]);
      this[name] = spec;
      this[spec.target ? 'relations' : 'fields'].push(spec);
    }
  }
  this.primaryField = this.fields.filter(function (f) {return f.primary; })[0];
  if (!this.primaryField) {
    this.primaryField = new Specifier('id', {type: Type.Id, primary: true, autoIncrement: true});
    this.fields.push(this.primaryField);
    this.id = this.primaryField;
  }
}
