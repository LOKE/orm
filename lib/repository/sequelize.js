'use strict';

var Type = require('../type');
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
    if (field.colummn)       sDetails.column        = field.column;
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
      var relation = schema[name];
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
    limit: options.limit
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
    limit: options.limit
  };
  return P.resolve($private(this).sequelizeModel.destroy(params));
};

SequelizeRepository.prototype.insert = function (changes, parent, parentRepo, parentRelation) {
  var values = {};
  if (parent) {
    // Need to set foreign key:
    var foreignKey = parentRelation.foreignKey || $private(parentRepo).defaultForeignKey;
    var primaryKeyAttribute = parentRepo.schema.primaryField.name;
    if (!primaryKeyAttribute) throw new Error('Missing primary key attribute from parent repository.');
    if (!foreignKey) throw new Error('Missing foreign key attribute.');
    values[foreignKey] = documentModifier(parent).get(primaryKeyAttribute);
  }
  var sequelizeModel = $private(this).sequelizeModel;
  var repo = this;
  this.schema.fields.forEach(function (field) {
    values[field.name] = changes[field.name];
  });
  // var instance = sequelizeModel.build(values, {isNewRecord: true, include: {all: true}});
  return P.resolve(sequelizeModel.create(values))
  .then(function (newInstance) {
    var postChanges = {};
    postChanges[repo.schema.primaryField.name] = newInstance[repo.schema.primaryField.name];
    return postChanges;
  });
};

function documentFromRow(repository, row, parent) {
  var document = repository.new(row);
  var modifier = documentModifier(document);
  modifier.setParent(parent);
  function markAllAsPersisted(schema, doc) {
    var mod = documentModifier(doc);
    mod.markAsPersisted();
    schema.relations.forEach(function (relation) {
      var value = mod.get(relation.name);
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
