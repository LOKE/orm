"use strict";
const mysql = require("mysql2");
const pg = require("pg");
const { Connection } = require("../lib");

/** @type {mysql.Connection} */
let mysqlConn;

/** @type {pg.Client} */
let pgConn;

/**
 * @param {string} sql
 * @param {mysql.Connection} [c]
 * @returns
 */
async function queryMysql(sql, c) {
  const result = await (c || mysqlConn).promise().query(sql);
  return result;
}

/**
 * @param {string} sql
 * @param {pg.Client} [c]
 * @returns
 */
async function queryPostgres(sql, c) {
  const result = await (c || pgConn).query(sql);
  return result;
}

function readMysqlQuery(folder, name) {
  var str = require("fs").readFileSync(
    require("path").join(folder, name),
    "utf8"
  );
  return queryMysql(str);
}

function readPostgresQuery(folder, name) {
  var str = require("fs").readFileSync(
    require("path").join(folder, name),
    "utf8"
  );
  return queryPostgres(str);
}

global.query = queryMysql;
global.readQuery = readMysqlQuery;

exports.queryMysql = queryMysql;
exports.readMysqlQuery = readMysqlQuery;
exports.queryPostgres = queryPostgres;
exports.readPostgresQuery = readPostgresQuery;

exports.databases = (dirname) => [
  {
    name: "MySql",
    before: async () => {
      const db = new Connection(process.env.MYSQL_URI);
      await readMysqlQuery(dirname, "up.sql");
      return db;
    },
    after: async (db) => {
      await readMysqlQuery(dirname, "down.sql");
      await db.end();
    },
  },
  {
    name: "Postgres",
    before: async () => {
      const db = new Connection(process.env.PG_URI);
      await readPostgresQuery(dirname, "up.pgsql");
      return db;
    },
    after: async (db) => {
      await readPostgresQuery(dirname, "down.pgsql");
      await db.end();
    },
  },
];

before(function () {
  const dbURL = process.env.MYSQL_URI;
  let resetConnection = mysql.createConnection(dbURL.replace("/ormtest", "/"));

  return queryMysql(
    "DROP DATABASE IF EXISTS ormtest;CREATE DATABASE ormtest;",
    resetConnection
  )
    .then(function () {
      return resetConnection.end();
    })
    .then(function () {
      mysqlConn = mysql.createConnection(dbURL);
    });
});

before(async () => {
  const dbURL = process.env.PG_URI;
  let resetConnection = new pg.Client(dbURL.replace("/ormtest", "/postgres"));
  await resetConnection.connect();

  await queryPostgres("DROP DATABASE IF EXISTS ormtest;", resetConnection);
  await queryPostgres("CREATE DATABASE ormtest;", resetConnection);

  await resetConnection.end();

  pgConn = new pg.Client(dbURL);
  await pgConn.connect();
});

after(function () {
  mysqlConn.end();
});

after(function () {
  pgConn.end();
});
