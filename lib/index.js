//@ts-check
"use strict";

var Schema = require("./schema");
var Type = require("./type");
var SequelizeRepository = require("./repository/sequelize");

var { Sequelize } = require("sequelize");

var exports = Connection;

module.exports =
  exports.Connection =
  exports.createConnection =
  exports.create =
    Connection;

exports.Schema = Schema;

/**
 * Create connection pool to MySQL database
 * @param {string} uri to MySQL database (mysql://root:pass@localhost/testdb)
 * @param {object} [opts] pool options (see Sequelize documentation)
 * @param {(msg: string) => undefined} [opts.logging] function called every time a query is sent
 * @param {object} [opts.pool] pool options (see Sequelize documentation)
 * @param {number} [opts.pool.min] min number of connections in pool
 * @param {number} [opts.pool.max] max number of connections in pool
 * @param {number} [opts.pool.idle] number of milliseconds idle before dropping a connection
 * @param {object} [opts.dialectOptions] sequelize dialectOptions
 */
function Connection(uri, opts) {
  if (!(this instanceof Connection)) return new Connection(uri, opts);
  opts = opts || {};
  var options = {
    logging: function (sql) {
      if (opts.logging) return opts.logging(sql);
    },
    dialectOptions: opts.dialectOptions || undefined,
  };

  // Important - this will cause issues if you set options.pool = undefined
  // This needs to be completely unset to not use pools (required for tests)
  if (opts.pool) options.pool = opts.pool;

  var sequelize = new Sequelize(uri, options);

  /**
   * Create a repository
   * @param  {String} tableName
   * @param  {unknown} schemaDescription describe keys
   * @return {Repository} model constructor
   */
  this.table = function (tableName, schemaDescription) {
    var schema = new Schema(schemaDescription);
    return new SequelizeRepository(sequelize, tableName, schema);
  };

  /**
   * Close connection
   */
  this.end = function () {
    sequelize.close();
  };
}

Object.keys(Type).forEach(function (name) {
  Connection.prototype[name] = Type[name];
});
