'use strict';

var Type = require('../type');
var Transaction = require('../transaction');
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
  function Constructor (o) {
    Document.call(this, o, schema);
  }

  this.prototype = Constructor.prototype;

  this.new = function (o) {
    return new Constructor(o);
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

Repository.prototype.delete = function (document) {
  return this.remove(document);
};

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

Repository.prototype.persist = function (document, parent, parentRepo, parentRelation, transaction) {
  if (!document) throw new TypeError('Missing parameter: document.');
  var schema = this.schema;
  var modifier = documentModifier(document);
  var repo = this;
  modifier.getChanges();
  return P.resolve(modifier.persisting)
  .then(null, Function.prototype)
  .then(function () {
    var changes = modifier.getChanges();
    if (modifier.persisted) {
      if (!Object.keys(changes).length) return;
      return repo.update(document, changes);
    }
    return modifier.persisting = repo.insert(changes, parent, parentRepo, parentRelation, transaction)
    .then(function (postChanges) {
      delete modifier.persisting;
      modifier.markAsPersisted();
      modifier.didApplyChanges(changes);
      modifier.didApplyChanges(postChanges);
    });
  })
  .then(function () {
    return P.all(schema.relations.map(function (relation) {
      var primaryKeyAttribute = relation.target.schema.primaryField.name;
      var value = modifier.relations[relation.name];
      var oldValue = modifier.originalRelations[relation.name];
      if (relation.type === Type.HasMany) {
        if (!oldValue) {
          throw new Error('Old values missing for relation: ' + relation.name);
        }
        var missingFromArray = oldValue && oldValue.filter(function (subdoc) {
          if (value.indexOf(subdoc) !== -1) return false;
          if (value.some(function (doc) {
            return doc[primaryKeyAttribute] === subdoc[primaryKeyAttribute];
          })) return false;
          return true;
        });
        return P.all(value.map(function (subdoc) {
          return relation.target.persist(subdoc, document, repo, relation, transaction)
          .then(function () {
            oldValue.push(subdoc);
          });
        }).concat(missingFromArray.map(function (subdoc) {
          return relation.target.delete(subdoc, {transaction: transaction})
          .then(function () {
            var index = oldValue.indexOf(subdoc);
            if (index !== -1) oldValue.splice(index, 1);
          });
        })));
      } else if (relation.type === Type.HasOne) {
        return Promise.resolve()
        .then(function () {
          if (oldValue && (oldValue !== value) && (oldValue[primaryKeyAttribute] !== value[primaryKeyAttribute])) {
            var mod = documentModifier(oldValue)
            .then(function () {
              if (mod.deleting) return mod.deleting;
              return mod.deleting = relation.target.delete(oldValue, {transaction: transaction});
            })
            .then(function () {
              delete mod.deleting;
              modifier.originalRelations[relation.name] = null;
            });
          }
        })
        .then(function () {
          if (value) return relation.target.persist(value, document, repo, relation, transaction);
        })
        .then(function () {
          modifier.originalRelations[relation.name] = value;
        });
      } else {
        throw new Error('Could not insert due to unknown relation type.');
      }
    }));
  })
  .then(function () {
    return document;
  });
};

Repository.prototype.update = function (document, updates, options) {
  if (!document) throw new TypeError('Missing parameter: document.');
  options = options || {};
  options.limit = 1;
  return this.updateWhere(primaryKeyQuery(this, document), updates, options)
  .then(function (affectedCount) {
    if (affectedCount) documentModifier(document).didApplyChanges(updates);
    return document;
  });
};

Repository.prototype.remove = function (document, options) {
  if (!document) throw new TypeError('Missing parameter: document.');
  options = options || {};
  options.limit = 1;
  return this.removeWhere(primaryKeyQuery(this, document), options);
};

Repository.prototype.reload = function (document) {
  if (!document) throw new TypeError('Missing parameter: document.');
  return this.findOne(primaryKeyQuery(this, document))
  .then(function (newDocument) {
    // copy values from a onto b:
    var a = documentModifier(newDocument);
    var b = documentModifier(document);

    b.didApplyChanges(a.fields, a.relations);
    b.markAsPersisted();

    return document;
  });
};

Repository.prototype.create = function (o) {
  return this.persist(this.new(o));
};
