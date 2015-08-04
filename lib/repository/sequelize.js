'use strict';

var Type = require('../type');
var Transaction = require('../transaction');
var $private = require('../private').create();
var Repository = require('./base');
var Sequelize = require('sequelize');
var documentModifier = require('../document/modifier');

var P = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

module.exports = SequelizeRepository;

function includeAll() {
  return [{all: true, include: {all: true}}];
}

function sequelizeType(field) {
  var type = field.type;
  if (type === Type.String)  return Sequelize.STRING;
  if (type === Type.Number)  return Sequelize.DOUBLE;
  if (type === Type.Date)    return Sequelize.DATE;
  if (type === Type.Boolean) return Sequelize.BOOLEAN;
  if (type === Type.Text)    return Sequelize.TEXT;
  if (type === Type.Decimal) return Sequelize.DECIMAL;
  if (type === Type.Id)      return Sequelize.INTEGER.UNSIGNED;
  if (type === Type.Enum)    return new Sequelize.ENUM(field.values);
}

function buildSequelizeSchema(schema) {
  var sequelizeSchema = {};
  schema.fields.forEach(function (field) {
    if (field.type === Type.HasOne || field.type === Type.HasMany) return;
    var sType = sequelizeType(field);
    var sDetails = sequelizeSchema[field.name] = {type: sType};
    if (field.primary)       sDetails.primaryKey    = field.primary;
    if (field.defualtValue)  sDetails.defaultValue  = field.defaultValue;
    if (field.column)        sDetails.field         = field.column;
    if (field.autoIncrement) sDetails.autoIncrement = field.autoIncrement;
  });
  return sequelizeSchema;
}
function addSequelizeRelation(sequelizeModel, relation, defaultForeignKey) {
  var target = relation.target;
  if (!(target instanceof SequelizeRepository)) {
    throw new Error('Cannot build relation "' + relation.name + '". Linking accross different repository types is not supported.');
  }
  var sequelizeTarget = $private(target).sequelizeModel;
  var foreignKey = relation.foreignKey || defaultForeignKey;
  var targetOpts = {
    foreignKey : foreignKey,
    as         : relation.name
  };
  if (relation.scope) targetOpts.scope = relation.scope;
  switch (relation.type) {
    case Type.HasOne: {
      sequelizeModel.hasOne(sequelizeTarget, targetOpts);
      break;
    }
    case Type.HasMany: {
      sequelizeModel.hasMany(sequelizeTarget, targetOpts);
      break;
    }
  }
}

require('util').inherits(SequelizeRepository, Repository);
function SequelizeRepository(sequelize, tableName, schema) {
  Repository.call(this, schema);
  var defaultForeignKey = tableName.toLowerCase().replace(/s$/, '') + 'Id';
  $private(this).defaultForeignKey = defaultForeignKey;
  var sequelizeModel = sequelize.define(tableName, buildSequelizeSchema(schema), {
    timestamps: false,
    tableName: tableName
  });

  schema.relations.forEach(function (relation) {
    addSequelizeRelation(sequelizeModel, relation, defaultForeignKey);
  });

  $private(this).sequelize = sequelize;
  $private(this).sequelizeModel = sequelizeModel;
}

SequelizeRepository.prototype.findWhere = function (q, opts) {
  var include = includeAll();
  var where = {};
  var schema = this.schema;
  var params = {where: where, include: include};
  if (opts.limit) params.limit = opts.limit;
  if (opts.offset) params.offset = opts.offset;
  if (opts.order) params.order = opts.order;
  var relationqs = {};
  for(var k in q) {
    if (!Object.hasOwnProperty.call(q, k)) continue;
    var value = q[k];
    if (value === undefined) continue;
    var pathComponents = k.split('.');
    if (pathComponents.length > 1) {
      var name = pathComponents[0];
      var relation = schema.specifiers[name];
      if (!relation || !relation.target) throw new Error('Invalid key in .find() clause: ' + k + '. Unknown relation: ' + name + '.');
      var srelationq = relationqs[name];
      if (!relationqs[name]) {
        srelationq = relationqs[name] = {};
        relationqs[name] = srelationq;
        include.push({
          model : $private(relation.target).sequelizeModel,
          as    : relation.name,
          where : srelationq,
          include: includeAll()
        });
      }
      srelationq[pathComponents[1]] = value;
    } else {
      where[k] = value;
    }
  }

  var sequelizeModel = $private(this).sequelizeModel;
  var repository = this;
  return Promise.resolve(sequelizeModel.findAll(params))
  .then(function (rows) {
    return rows.map(function (row) {
      return documentFromRow(repository, row, null);
    });
  });
};

SequelizeRepository.prototype.updateWhere = function (where, updates, options) {
  options = options || {};
  if (updates.$set) updates = updates.$set;
  var params = {
    where: where,
    limit: options.limit,
    transaction: getSequelizeTransaction(options.transaction)
  };
  return Promise.resolve($private(this).sequelizeModel.update(updates, params))
  .then(function (results) {
    return results[0];
  });
};

SequelizeRepository.prototype.removeWhere = function (where, options) {
  options = options || {};
  var params = {
    where: where,
    limit: options.limit,
    transaction: getSequelizeTransaction(options.transaction)
  };
  return P.resolve($private(this).sequelizeModel.destroy(params));
};

function getSequelizeTransaction(transaction) {
  if (transaction && transaction.sql) return transaction.sql;
}

var superPersist = SequelizeRepository.prototype.persist;
SequelizeRepository.prototype.persist = function (document, parent, parentRepo, parentRelation, transaction) {
  if (transaction) return superPersist.apply(this, arguments);
  var modifier = documentModifier(document);
  var needsTransaction = this.schema.relations.some(function (relation) {
    var val = modifier.relations[relation.name];
    if (Array.isArray(val)) return val.length;
    return !!val;
  });
  if (!needsTransaction) return superPersist.apply(this, arguments);
  var repo = this;
  var sequelize = $private(this).sequelize;
  transaction = new Transaction();
  return P.resolve()
  .then(function () {
    return sequelize.transaction(function (t) {
      transaction.sql = t;
      return superPersist.call(repo, document, parent, parentRepo, parentRelation, transaction);
    });
  });
};

SequelizeRepository.prototype.insert = function (changes, parent, parentRepo, parentRelation, transaction) {
  if (!changes) throw new TypeError('Missing parameter: changes.');
  var values = {};
  this.schema.fields.forEach(function (field) {
    values[field.name] = changes[field.name];
  });
  if (parent) {
    // Need to set foreign key:
    var foreignKey = parentRelation.foreignKey || $private(parentRepo).defaultForeignKey;
    var primaryKeyAttribute = parentRepo.schema.primaryField.name;
    if (!primaryKeyAttribute) throw new Error('Missing primary key attribute from parent repository.');
    if (!foreignKey) throw new Error('Missing foreign key attribute.');
    values[foreignKey] = documentModifier(parent).fields[primaryKeyAttribute];
  }
  var sequelizeModel = $private(this).sequelizeModel;
  var repo = this;
  return P.resolve(sequelizeModel.create(values, {transaction: getSequelizeTransaction(transaction)}))
  .then(function (newInstance) {
    var postChanges = {};
    postChanges[repo.schema.primaryField.name] = newInstance[repo.schema.primaryField.name];
    return postChanges;
  });
};

function documentFromRow(repository, row) {
  var document = repository.new(row);
  function markAllAsPersisted(schema, doc) {
    var mod = documentModifier(doc);
    mod.markAsPersisted();
    schema.relations.forEach(function (relation) {
      var value = mod.relations[relation.name];
      if (!value) return;
      var targetSchema = relation.target.schema;
      if (relation.type === Type.HasOne) {
        markAllAsPersisted(targetSchema, value);
      } else if (relation.type === Type.HasMany) {
        value.forEach(function (subdoc) {
          markAllAsPersisted(targetSchema, subdoc);
        });
      }
    });
  }
  markAllAsPersisted(repository.schema, document);
  return document;
}
