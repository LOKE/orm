'use strict';

var Type = require('../type');
var Document = require('../document/base');
var documentModifier = require('../document/modifier');
var P = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

module.exports = Repository;

function AbstractMethod(name) {
  return function () {
    throw new Error('The abstract method ' + name + ' has not been implemented by ' + this.constructor.name + '.');
  };
}

function Repository(schema) {
  this.schema = schema;

  require('util').inherits(Constructor, Document);
  function Constructor (o, parent) {
    Document.call(this, o, parent);
    documentModifier(this).configure(schema);
    Object.freeze(this);
  }

  this.prototype = Constructor.prototype;

  this.new = function (o) {
    o = o || {};
    var document = new Constructor(o, null);
    var values = {};
    schema.fields.forEach(function (field) {
      values[field.name] = o[field.name];
    });
    var modifier = documentModifier(document);

    schema.relations.forEach(function (relation) {
      var value = o[relation.name];
      if (!value) return;
      if (relation.type === Type.HasMany) {
        var subdocs = [].map.call(o[relation.name], function (subrow) {
          var subdoc = relation.target.new(subrow);
          documentModifier(subdoc).setParent(document);
          return subdoc;
        });
        modifier.attach(relation.name, subdocs);
        return;
      }
      if (relation.type === Type.HasOne) {
        var subdoc = relation.target.new(value);
        documentModifier(subdoc).setParent(document);
        modifier.attach(relation.name, subdoc);
        return;
      }
    });
    modifier.didApplyChanges(values);
    return document;
  };
}

function primaryKeyQuery(repo, document) {
  var q = {};
  var primaryKeyAttribute = repo.schema.primaryField.name;
  var primaryKeyValue = document[primaryKeyAttribute];
  if (!primaryKeyValue) throw new Error('Primary key required.');
  q[primaryKeyAttribute] = primaryKeyValue;
  return q;
}

Repository.prototype.insert      = new AbstractMethod('insert');
Repository.prototype.findWhere   = new AbstractMethod('findWhere');
Repository.prototype.updateWhere = new AbstractMethod('updateWhere');
Repository.prototype.removeWhere = new AbstractMethod('removeWhere');

Repository.prototype.find = function (q, opts) {
  return this.findWhere(q, opts || {});
};

Repository.prototype.findById = function (id) {
  var q = {};
  q[this.schema.primaryField.name] = id;
  return this.findOne(q);
};

Repository.prototype.findOne = function (q) {
  return this.find(q, {limit: 1})
  .then(function (results) {
    return results[0] || null;
  });
};

Repository.prototype.persist = function (document, parent, parentRepo, parentRelation) {
  var schema = this.schema;
  var modifier = documentModifier(document);
  var repo = this;
  return P.resolve(modifier.persisting)
  .then(null, Function.prototype)
  .then(function () {
    var changes = modifier.getChanges();
    if (modifier.persisted) {
      if (!Object.keys(changes).length) return;
      return repo.update(document, changes);
    }
    return modifier.persisting = repo.insert(changes, parent, parentRepo, parentRelation)
    .then(function (postChanges) {
      delete modifier.persisting;
      modifier.markAsPersisted();
      modifier.didApplyChanges(changes);
      modifier.didApplyChanges(postChanges);
    });
  })
  .then(function () {
    return P.all(schema.relations.map(function (relation) {
      var value = modifier.get(relation.name);
      if (!value) return;
      if (relation.type === Type.HasMany) {
        return P.all([].map.call(value, function (subdoc) {
          return relation.target.persist(subdoc, document, repo, relation);
        }));
      } else if (relation.type === Type.HasOne) {
        return relation.target.persist(value, document, repo, relation);
      } else {
        throw new Error('Could not insert due to unknown relation type.');
      }
    }));
  });
};

Repository.prototype.update = function (document, updates) {
  return this.updateWhere(primaryKeyQuery(this, document), updates, {limit: 1})
  .then(function (results) {
    var affectedCount = results[0];
    if (affectedCount) documentModifier(document).didApplyChanges(updates);
    return document;
  });
};

Repository.prototype.remove = function (document) {
  return this.removeWhere(primaryKeyQuery(this, document), {limit: 1});
};

Repository.prototype.create = function (o) {
  return this.persist(this.new(o));
};
