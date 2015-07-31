'use strict';
var clone = require('clone');
var PRIVATE = Symbol('Private');
var Type = require('../type');

module.exports = function (document) {
  if (!document[PRIVATE]) {
    document[PRIVATE] = new Wrapper(document);
  }
  return document[PRIVATE];
};

function Wrapper(document) {
  this.document = document;
}

Wrapper.prototype.init = function (values) {
  this.values = values || {};
  this.changes = {};
};
Wrapper.prototype.set = function (key, value) {
  if (this.values[key] !== value) {
    this.changes[key] = value;
    this.values[key] = value;
  }
};
Wrapper.prototype.get = function (key) {
  return this.values[key];
};
Wrapper.prototype.getChanges = function () {
  if (!this.persisted) return this.values;
  return clone(this.changes);
};

Wrapper.prototype.didApplyChanges = function (changes) {
  for (var fieldName in changes) {
    if (Object.hasOwnProperty.call(changes, fieldName)) {
      this.values[fieldName] = changes[fieldName];
      delete this.changes[fieldName];
    }
  }
};
Wrapper.prototype.markAsPersisted = function () {
  this.persisted = true;
};

Wrapper.prototype.configure = function (schema) {
  var document = this.document;
  var modifier = this;
  schema.fields.forEach(function (field) {
    var name = field.name;
    Object.defineProperty(document, name, {
      enumerable: true,
      get: function ()      { return modifier.get(name); },
      set: function (value) { return modifier.set(name, value); }
    });
  });
  schema.relations.forEach(function (relation) {
    var name = relation.name;
    var value = modifier.values[name];
    if (!value) {
      if (relation.type === Type.HasMany) {
        value = [];
      } else if (relation.type === Type.HasOne) {
        value = null;
      }
    }
    modifier.values[name] = value;
    if (relation.type === Type.HasMany) {
      if (!value) modifier.values[name] = [];
    } else if (relation.type === Type.HasOne) {
      if (!value) modifier.values[name] = [];
    }
    Object.defineProperty(document, name, {
      enumerable: true,
      get: function () { return modifier.get(name); }
      // set: function () {
        // return modifier.set(name, value);
      // }
    });
  });
};

Wrapper.prototype.setParent = function (parent) {
  this.parent = parent;
};

Wrapper.prototype.attach = function (relationName, value) {
  this.values[relationName] = value;
};
