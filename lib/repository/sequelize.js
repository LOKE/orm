'use strict';

var Type = require('../type');
var through2 = require('through2');
var Transaction = require('../transaction');
var $private = require('../private').create();
var Repository = require('./base');
var Sequelize = require('sequelize');
var documentModifier = require('../document/modifier');
var Promise = require('../promise');

module.exports = SequelizeRepository;

/**
 * Construct default value for `include` option in Sequelize queries
 */
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

/**
 * Create schema description for Sequelize
 * @param  {Schema} schema
 * @return {Sequelize.SchemaDescription} object to be passed into sequelize.define
 */
function buildSequelizeSchema(schema) {
  var sequelizeSchema = {};
  schema.fields.forEach(function (field) {
    if (field.type === Type.HasOne || field.type === Type.HasMany) return;
    var sType = sequelizeType(field);
    var sDetails = sequelizeSchema[field.name] = {type: sType};

    // Define key options:
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

/**
 * Repository backed by sequelize MySQL storage
 * @param {Sequelize.Connection} sequelize
 * @param {String} tableName
 * @param {Schema} schema
 */
function SequelizeRepository(sequelize, tableName, schema) {
  Repository.call(this, schema);

  /**
   * Default key name for other tables to reference this table.
   * @type {String}
   */
  var defaultForeignKey = $private(this).defaultForeignKey = tableName.toLowerCase().replace(/s$/, '') + 'Id';

  // Describe the document fields:
  var sequelizeModel = sequelize.define(tableName, buildSequelizeSchema(schema), {
    timestamps: false,
    tableName: tableName
  });

  // Describe the document relations:
  schema.relations.forEach(function (relation) {
    addSequelizeRelation(sequelizeModel, relation, defaultForeignKey);
  });

  $private(this).sequelize = sequelize;
  $private(this).sequelizeModel = sequelizeModel;
}

function allColumnAttributes(schema) {
  return schema.fields.map(function (field) {
    return field.name;
  });
}

function makeAttributes(schema, options) {
  options = options || {};
  var attributes = options.attributes ? options.attributes.slice(0) : allColumnAttributes(schema);
  if (!options.raw) {
    schema.primaryFields.forEach(function (specifier) {
      var key = specifier.name;
      if (!~attributes.indexOf(key)) {
        attributes.push(key);
      }
    });
  }
  return attributes
}

SequelizeRepository.prototype.findWhere = function (q, opts) {
  var include = includeAll();
  var where = {};
  var schema = this.schema;
  var params = {where: where, include: include};
  if (opts.limit) params.limit = opts.limit;
  if (opts.offset) params.offset = opts.offset;
  if (opts.order) params.order = opts.order;
  if (opts.raw) params.raw = true;
  if (opts.attributes) {
    params.attributes = makeAttributes(this.schema, opts);
    params.include = [];
  }
  var relationqs = {};
  for(var k in q) {
    if (!Object.hasOwnProperty.call(q, k)) continue;
    var value = q[k];
    if (value === undefined) continue;
    var pathComponents = k.split('.');
    if (pathComponents.length > 1) {
      // The field being filtered on is on a JOIN:
      var name = pathComponents[0];
      var relation = schema.specifiers[name];
      if (!relation || !relation.target) throw new Error('Invalid key in .find() clause: ' + k + '. Unknown relation: ' + name + '.');
      var srelationq = relationqs[name];
      if (!relationqs[name]) {
        srelationq = relationqs[name] = {};
        relationqs[name] = srelationq;
        include.push({
          model : $private(relation.target).sequelizeModel,
          as    : relation.name, // relation identifier
          where : srelationq,    // filter
          include: includeAll()  // still include deeper related objects
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

  // Convert results into this.Document instances:
  .then(function (rows) {
    if (params.raw) return rows;
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

  // UPDATE {tableName} SET {updates} WHERE {}
  return Promise.resolve($private(this).sequelizeModel.update(updates, params))
  .then(function (results) {
    // Return number of changed rows:
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
  // DELETE FROM {tableName} WHERE {where}
  return Promise.resolve($private(this).sequelizeModel.destroy(params));
};

function getSequelizeTransaction(transaction) {
  if (transaction && transaction.sql) return transaction.sql;
}

var superPersist = SequelizeRepository.prototype.persist;
SequelizeRepository.prototype.persist = function (document, options, parent, parentRepo, parentRelation) {
  options = options || {};
  var transaction = options.transaction;
  if (transaction) return superPersist.apply(this, arguments);
  var modifier = documentModifier(document);
  var needsTransaction = this.schema.relations.some(function (relation) {
    var val = modifier.relations[relation.name];
    if (Array.isArray(val)) return val.length;
    return !!val;
  });
  if (!needsTransaction) return superPersist.apply(this, arguments);

  // Wrap .persist() in a transaction:
  var repo = this;
  var sequelize = $private(this).sequelize;
  transaction = new Transaction();
  return Promise.resolve()
  .then(function () {
    return sequelize.transaction(function (t) {
      transaction.sql = t;
      return superPersist.call(repo, document, {transaction: transaction}, parent, parentRepo, parentRelation);
    });
  });
};

SequelizeRepository.prototype.insert = function (changes, options, parent, parentRepo, parentRelation) {
  if (!changes) throw new TypeError('Missing parameter: changes.');
  var values = {};
  this.schema.fields.forEach(function (field) {
    values[field.name] = changes[field.name];
  });
  if (parent) {
    // Need to set foreign key:
    var foreignKey = parentRelation.foreignKey || $private(parentRepo).defaultForeignKey;
    var parentKeys = parentRepo.schema.primaryFields;
    if (parentKeys.length !== 1) throw new Error('Not implemented. Parent documents must have one primary key to match the one foreign key.');
    parentKeys.forEach(function (key) {
      values[foreignKey] = documentModifier(parent).fields[key.name];
    });
  }
  var sequelizeModel = $private(this).sequelizeModel;
  var repo = this;
  // INSERT INTO {tableName} VALUES ({values})
  return Promise.resolve(sequelizeModel.create(values, {transaction: getSequelizeTransaction(options.transaction)}))
  .then(function (newInstance) {
    var postChanges = {};
    repo.schema.primaryFields.forEach(function (key) {
      postChanges[key.name] = newInstance[key.name];
    });
    return postChanges;
  });
};

Repository.prototype.stream = function (q, opts) {
  opts = opts || {};
  var sequelize = $private(this).sequelize;
  var model = $private(this).sequelizeModel;

  var tableNames = {};
  tableNames[model.getTableName({})] = true;
  // https://github.com/felixge/node-mysql/#streaming-query-rows
  // https://dev.mysql.com/doc/refman/5.5/en/server-system-variables.html#sysvar_net_write_timeout

  // Does not support paranoidClause()
  var options = {};
  var isRaw = !!opts.raw;
  options.type = sequelize.QueryTypes.SELECT;
  options.model = model;
  options.where = q;
  options.tableNames = tableNames;
  options.attributes = makeAttributes(this.schema, opts);
  if (opts.order) options.order = opts.order;
  if (opts.offset) options.order = opts.offset;
  if (opts.limit) options.order = opts.limit;

  sequelize.Utils.mapOptionFieldNames(options, model);

  var sql = model.QueryGenerator.selectQuery(model.getTableName(options), options, model);

  var ctor = this.new;

  var stream = through2.obj(function (obj, enc, callback) {
    // cast to instance type:
    if (!isRaw) obj = ctor(obj);
    callback(null, obj);
  });

  var connectionManager = sequelize.connectionManager;

  connectionManager.getConnection()
  .then(function (connection) {
    var sqlStream = connection.query(sql).stream({highWaterMark: opts.highWaterMark || 5});

    sqlStream.pipe(stream);

    var isReleased = false;
    function release() {
      if (isReleased) return;
      isReleased = true;
      connectionManager.releaseConnection(connection);
    }

    sqlStream
    .on('error', function (err) {
      release();
      stream.emit('error', err);
    })
    .on('end', function () {
      release();
    });
  })
  .then(null, function (err) {
    setTimeout(function () {
      stream.emit('error', err);
    }, 0);
  });

  return stream;
};

SequelizeRepository.prototype.rawInsert = function (rawSQL, replacements) {
  var sequelize = $private(this).sequelize;
  return Promise.resolve(sequelize.query(rawSQL, {replacements: replacements, type: sequelize.QueryTypes.INSERT}));
};

SequelizeRepository.prototype.rawSelect = function (rawSQL, replacements) {
  var sequelize = $private(this).sequelize;
  return Promise.resolve(sequelize.query(rawSQL, {replacements: replacements, type: sequelize.QueryTypes.SELECT}));
};

SequelizeRepository.prototype.rawUpdate = function (rawSQL, replacements) {
  var sequelize = $private(this).sequelize;
  return Promise.resolve(sequelize.query(rawSQL, {replacements: replacements, type: sequelize.QueryTypes.BULKUPDATE}));
};

SequelizeRepository.prototype.literal = function (sqlCode) {
  var sequelize = $private(this).sequelize;
  return new sequelize.Utils.literal(sqlCode);
};

/**
 * Count number of records matching a query
 * Uses SELECT COUNT(*) FROM ___ WHERE ___
 * @param  {Object} q - query
 * @return {Promise<Number>} number of matching rows
 */
SequelizeRepository.prototype.count = function (q) {
  var params = {where: q};
  var sequelizeModel = $private(this).sequelizeModel;
  return Promise.resolve(sequelizeModel.count(params));
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
