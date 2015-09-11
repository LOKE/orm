'use strict';

var Schema     = require('./schema');
var Type       = require('./type');
var Promise    = require('./promise');
var SequelizeRepository = require('./repository/sequelize');

var parseURL  = require('url').parse;
var Sequelize = require('sequelize');

var exports = Connection;

module.exports
  = exports.Connection
  = exports.createConnection
  = exports.create
  = Connection;

exports.Schema = Schema;
exports.setPromiseConstructor = Promise.setPromiseConstructor;

/**
 * Create connection pool to MySQL database
 * @param {String} uri to MySQL database (mysql://root:pass@localhost/testdb)
 * @param {String => undefined} [opts.logging] function called every time a query is sent
 */
function Connection(uri, opts) {
  if (!(this instanceof Connection)) return new Connection(uri, opts);
  opts = opts || {};
  var options = {
    logging: function (sql) {
      if (opts.logging) return opts.logging(sql);
    }
  };
  var urlParts = parseURL(uri);

  var database;
  var username = null;
  var password = null;

  if (urlParts.pathname) {
    database = urlParts.pathname.replace(/^\//, '');
  }

  options.dialect = urlParts.protocol.replace(/:$/, '');
  options.host = urlParts.hostname;

  if (urlParts.auth) {
    var authComponents = urlParts.auth.split(':');
    username = authComponents[0];
    password = authComponents.slice(1).join(':');
  }

  var sequelize = new Sequelize(database, username, password, options);

  /**
   * Create a repository
   * @param  {String} tableName
   * @param  {} schemaDescription describe keys
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
