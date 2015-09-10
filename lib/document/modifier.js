'use strict';
var clone = require('clone');
var Type = require('../type');

var PRIVATE;
if (typeof Symbol === 'function') {
  PRIVATE = Symbol('Private');
} else {
  // Support for node v0.10.x
  PRIVATE = '_private';
}

/**
 * Monitors object changes.
 * @param  {Document} document
 * @return {Modifier} modifier for that change-tracked document
 */
module.exports = function (document) {
  if (!document[PRIVATE]) {
    document[PRIVATE] = new Wrapper(document);
  }
  return document[PRIVATE];
};

function Wrapper(document) {
  this.document = document;
}

/**
 * Return a copy of modifier.relations
 * @param  {Modifier} modifier
 * @return {Object}
 */
function getCurrentRelations(modifier) {
  return Object.keys(modifier.relations)
  .reduce(function (o, key) {
    var val = modifier.relations[key];
    if (Array.isArray(val)) {
      o[key] = val.slice(0);
    } else {
      o[key] = val;
    }
    return o;
  }, {});
}

Wrapper.prototype.init = function (values, schema) {
  // Track changed field values:
  this.changes = {};

  // Field values:
  this.fields = schema.fields.reduce(function (o, field) {
    var val = values[field.name];
    if (val === null) {
      // Null values never pass through field.type casting:
      val = null;
    } else if (val !== undefined) {
      // Cast to type:
      val = field.type(val);
    } else if (field.defaultValue) {
      // Use default value:
      val = field.defaultValue();
    }
    o[field.name] = val;
    return o;
  }, {});

  // Relation values:
  this.relations = schema.relations.reduce(function (o, relation) {
    var value = values[relation.name];
    if (relation.type === Type.HasMany) {
      o[relation.name] = Array.isArray(value) ? [].map.call(value, function (subrow) {
        return relation.target.new(subrow);
      }) : [];
    } else if (relation.type === Type.HasOne) {
      o[relation.name] = value ? relation.target.new(value) : null;
    }
    return o;
  }, {});

  // Track original relations by name:
  // This is done so we can mark them as deleted when they are removed from an array.
  this.originalRelations = getCurrentRelations(this);

  this.configureGetters(schema);
};
Wrapper.prototype.getChanges = function () {
  if (!this.fields) throw new Error('Undefined state: ' + JSON.stringify(this.document));
  if (!this.persisted) return this.fields;
  return clone(this.changes);
};

Wrapper.prototype.didApplyChanges = function (fieldValues, relationValues) {
  var fields = this.fields;
  var relations = this.relations;

  for (var fieldName in fieldValues) {
    if (Object.hasOwnProperty.call(fieldValues, fieldName)) {
      fields[fieldName] = fieldValues[fieldName];
      delete this.changes[fieldName];
    }
  }
  for (var relationName in relationValues) {
    if (Object.hasOwnProperty.call(relationValues, relationName)) {
      relations[relationName] = relationValues[relationName];
    }
  }
};

Wrapper.prototype.markAsPersisted = function () {
  this.persisted = true;
  this.originalRelations = getCurrentRelations(this);
};

Wrapper.prototype.configureGetters = function (schema) {
  var document = this.document;
  var fields = this.fields;
  var changes = this.changes;
  var relations = this.relations;

  schema.fields.forEach(function (field) {
    var name = field.name;
    Object.defineProperty(document, name, {
      enumerable: true,
      get: function () {
        return fields[name];
      },
      set: function (value) {
        if (fields[name] !== value) {
          changes[name] = value;
          fields[name] = value;
        }
      }
    });
  });
  schema.relations.forEach(function (relation) {
    var name = relation.name;
    Object.defineProperty(document, name, {
      enumerable: true,
      get: function () {
        return relations[name];
      },
      set: function (value) {
        relations[name] = value;
      }
    });
  });
};
