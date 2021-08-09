"use strict";

var Type = require("../type");
var Document = require("../document/base");
var documentModifier = require("../document/modifier");
var Promise = require("../promise");

module.exports = Repository;

function AbstractMethod(name) {
  return function () {
    throw new Error(
      "The abstract method " +
        name +
        " has not been implemented by " +
        this.constructor.name +
        "."
    );
  };
}

function Repository(schema) {
  this.schema = schema;

  require("util").inherits(Constructor, Document);
  function Constructor(o) {
    Document.call(this, o, schema);
  }

  this.prototype = Constructor.prototype;

  this.new = function (o) {
    return new Constructor(o);
  };
}

/** Return {[primaryKey]: document[primaryKey]} */
function primaryKeyQuery(repo, document) {
  var q = {};
  repo.schema.primaryFields.forEach(function (specifier) {
    var key = specifier.name;
    var value = document[key];
    if (!value) throw new Error("Primary key required.");
    q[key] = value;
  });
  return q;
}

// Methods which must be implemented by persisting class:
Repository.prototype.insert = new AbstractMethod("insert");
Repository.prototype.findWhere = new AbstractMethod("findWhere");
Repository.prototype.updateWhere = new AbstractMethod("updateWhere");
Repository.prototype.removeWhere = new AbstractMethod("removeWhere");

Repository.prototype.delete = function (document) {
  return this.remove(document);
};

Repository.prototype.find = function (q, opts) {
  return this.findWhere(q, opts || {});
};

Repository.prototype.findById = function (id, opts) {
  if (!id) throw new Error("Invalid ID: " + id + ".");
  var q = {};
  var keys = this.schema.primaryFields;
  if (keys.length !== 1) {
    throw new Error(
      "This repository has " +
        keys.length +
        " primary keys. To use .findById(...) it must have exactly one."
    );
  }
  var specifier = keys[0];
  q[specifier.name] = id;
  return this.findOne(q, opts);
};

Repository.prototype.findOne = function (q, opts) {
  opts = opts || {};
  opts.limit = 1;
  return this.find(q, opts).then(function (results) {
    return results[0] || null;
  });
};

function isSameDocument(schema, a, b) {
  var primaryKeys = schema.primaryFields;
  return primaryKeys.every(function (key) {
    return a[key] === b[key];
  });
}

Repository.prototype.persist = function (
  document,
  options,
  parent,
  parentRepo,
  parentRelation
) {
  if (!document) throw new TypeError("Missing parameter: document.");
  options = options || {};
  var transaction = options.transaction;
  var schema = this.schema;
  var modifier = documentModifier(document);
  var repo = this;

  return (
    Promise.resolve(modifier.persisting)
      .then(null, Function.prototype)
      .then(function () {
        var changes = modifier.getChanges();
        if (modifier.persisted) {
          if (!Object.keys(changes).length) return;
          return repo.update(document, changes);
        }
        return (modifier.persisting = repo
          .insert(
            changes,
            { transaction: transaction },
            parent,
            parentRepo,
            parentRelation
          )
          .then(function (postChanges) {
            delete modifier.persisting;
            modifier.markAsPersisted();
            modifier.didApplyChanges(changes);
            modifier.didApplyChanges(postChanges);
          }));
      })

      // Then save all relations:
      .then(function () {
        return Promise.all(
          schema.relations.map(function (relation) {
            var schema = relation.target.schema;
            var value = modifier.relations[relation.name];
            var oldValue = modifier.originalRelations[relation.name];
            if (relation.type === Type.HasMany) {
              if (!oldValue) {
                throw new Error(
                  "Old values missing for relation: " + relation.name
                );
              }
              var missingFromArray =
                oldValue &&
                oldValue.filter(function (oldDoc) {
                  if (~value.indexOf(oldDoc)) return false;
                  if (
                    value.some(function (newDoc) {
                      return isSameDocument(schema, oldDoc, newDoc);
                    })
                  ) {
                    return false;
                  }
                  return true;
                });
              return Promise.all(
                value
                  .map(function (subdoc) {
                    return relation.target
                      .persist(
                        subdoc,
                        { transaction: transaction },
                        document,
                        repo,
                        relation,
                        transaction
                      )
                      .then(function () {
                        oldValue.push(subdoc);
                      });
                  })
                  .concat(
                    missingFromArray.map(function (subdoc) {
                      // Delete old values removed from relations array:
                      return relation.target
                        .delete(subdoc, { transaction: transaction })
                        .then(function () {
                          var index = oldValue.indexOf(subdoc);
                          if (index !== -1) oldValue.splice(index, 1);
                        });
                    })
                  )
              );
            } else if (relation.type === Type.HasOne) {
              return Promise.resolve()
                .then(function () {
                  if (
                    oldValue &&
                    oldValue !== value &&
                    !isSameDocument(schema, oldValue, value)
                  ) {
                    var mod = documentModifier(oldValue)
                      .then(function () {
                        if (mod.deleting) return mod.deleting;
                        return (mod.deleting = relation.target.delete(
                          oldValue,
                          { transaction: transaction }
                        ));
                      })
                      .then(function () {
                        delete mod.deleting;
                        modifier.originalRelations[relation.name] = null;
                      });
                  }
                })
                .then(function () {
                  if (value) {
                    return relation.target.persist(
                      value,
                      { transaction: transaction },
                      document,
                      repo,
                      relation,
                      transaction
                    );
                  }
                })
                .then(function () {
                  modifier.originalRelations[relation.name] = value;
                });
            } else {
              throw new Error("Could not insert due to unknown relation type.");
            }
          })
        );
      })
      .then(function () {
        return document;
      })
  );
};

Repository.prototype.update = function (document, updates, options) {
  if (!document) throw new TypeError("Missing parameter: document.");
  options = options || {};
  options.limit = 1;
  return this.updateWhere(
    primaryKeyQuery(this, document),
    updates,
    options
  ).then(function (affectedCount) {
    if (affectedCount) documentModifier(document).didApplyChanges(updates);
    return document;
  });
};

Repository.prototype.remove = function (document, options) {
  if (!document) throw new TypeError("Missing parameter: document.");
  options = options || {};
  options.limit = 1;
  return this.removeWhere(primaryKeyQuery(this, document), options);
};

Repository.prototype.reload = function (document) {
  if (!document) throw new TypeError("Missing parameter: document.");
  return this.findOne(primaryKeyQuery(this, document)).then(function (
    newDocument
  ) {
    // copy values from a onto b:
    var a = documentModifier(newDocument);
    var b = documentModifier(document);

    b.didApplyChanges(a.fields, a.relations);
    b.markAsPersisted();

    return document;
  });
};

Repository.prototype.didApplyChanges = function (
  document,
  fieldValues,
  relationValues
) {
  fieldValues = fieldValues || {};
  relationValues = relationValues || {};

  var modifier = documentModifier(document);
  modifier.didApplyChanges(fieldValues, relationValues);
};

Repository.prototype.create = function (o) {
  return this.persist(this.new(o));
};
