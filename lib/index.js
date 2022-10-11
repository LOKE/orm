//@ts-check
"use strict";

const Schema = require("./schema");
const Type = require("./type");
const SequelizeRepository = require("./repository/sequelize");

const { Sequelize, Op } = require("sequelize");

/** @typedef {import("sequelize").Options & { searchPath?: string }} SequelizeOptions */
/** @typedef {import("sequelize").OperatorsAliases} OperatorsAliases */

exports.Connection = Connection;
exports.Op = Op;
exports.Schema = Schema;

/**
 * Create connection pool to MySQL database
 * @param {string} uri to MySQL database (mysql://root:pass@localhost/testdb)
 * @param {object} [opts] pool options (see Sequelize documentation)
 * @param {(msg: string) => undefined} [opts.logging] function called every time a query is sent
 * @param {string} [opts.searchPath] Postgres search path
 * @param {object} [opts.pool] pool options (see Sequelize documentation)
 * @param {number} [opts.pool.min] min number of connections in pool
 * @param {number} [opts.pool.max] max number of connections in pool
 * @param {number} [opts.pool.idle] number of milliseconds idle before dropping a connection
 * @param {object} [opts.dialectOptions] sequelize dialectOptions
 * @param {OperatorsAliases} [opts.operatorsAliases] for backwards compatibility. It is recommended to use Sequelize Op symbols instead.
 * @param {(sql: string, timing?: number) => void} [opts.logging] function to log raw SQL queries for debugging
 */
function Connection(uri, opts) {
  if (!(this instanceof Connection)) return new Connection(uri, opts);
  opts = opts || {};

  const defaultDialectOptions = uri.startsWith("postgres://")
    ? { prependSearchPath: true }
    : {};

  /** @type {SequelizeOptions} */
  const options = {
    logging: opts.logging,
    dialectOptions: opts.dialectOptions || defaultDialectOptions,
    operatorsAliases: opts.operatorsAliases || undefined,
    quoteIdentifiers: false,
    sync: { searchPath: opts.searchPath },
    searchPath: opts.searchPath,
  };

  // Important - this will cause issues if you set options.pool = undefined
  // This needs to be completely unset to not use pools (required for tests)
  if (opts.pool) options.pool = opts.pool;

  var sequelize = new Sequelize(uri, options);

  /**
   * Create a repository
   * @param  {String} tableName
   * @param  {unknown} schemaDescription describe keys
   * @return {SequelizeRepository} model constructor
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

  this.loke = true;
  this.sequelize = sequelize;
}

Object.keys(Type).forEach(function (name) {
  Connection.prototype[name] = Type[name];
});
