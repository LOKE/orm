'use strict';

var Schema     = require('./schema');
var Type       = require('./type');
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

function Connection(uri, opts) {
  if (!(this instanceof Connection)) return new Connection(uri, opts);
  opts = opts || {};
  var dbOptions = parseURL(uri);
  var sequelize = new Sequelize(dbOptions, {
    logging: function (sql) {
      if (opts.logging) return opts.logging(sql);
    }
  });

  /**
   * Create a repository
   * @param  {String} tableName
   * @param  {} schema [description]
   * @param  {} opts   [description]
   * @return {Repository} model constructor
   */
  this.table = function (tableName, schemaOpts) {
    var schema = new Schema(schemaOpts);
    return new SequelizeRepository(sequelize, tableName, schema);
  };

  this.end = function () {
    sequelize.close();
  };
}

Object.keys(Type).forEach(function (name) {
  Connection.prototype[name] = Type[name];
});
