"use strict";
var mysql = require("mysql2");

/** @type {mysql.Connection} */
var connection;

/**
 * @param {string} sql
 * @param {mysql.Connection} [c]
 * @returns
 */
function query(sql, c) {
  return (c || connection).promise().query(sql);
}

function read(folder, name) {
  var str = require("fs").readFileSync(
    require("path").join(folder, name),
    "utf8"
  );
  return global.query(str);
}

global.query = query;
global.readQuery = read;

before(function () {
  var dbURL = process.env.MYSQL_URI;
  var resetConnection = mysql.createConnection(dbURL.replace("/ormtest", "/"));

  return query(
    "DROP DATABASE IF EXISTS ormtest;CREATE DATABASE ormtest;",
    resetConnection
  )
    .then(function () {
      return resetConnection.end();
    })
    .then(function () {
      connection = mysql.createConnection(dbURL);
    });
});

after(function () {
  connection.end();
});
