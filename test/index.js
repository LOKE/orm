"use strict";
var mysql = require("mysql");

var connection;
var P =
  typeof Promise === "undefined" ? require("es6-promise").Promise : Promise;

global.query = function (sql, c) {
  return new P(function (resolve, reject) {
    return (c || connection).query(sql, function (err, result) {
      return err ? reject(err) : resolve(result);
    });
  });
};
global.query.read = function (folder, name) {
  var str = require("fs").readFileSync(
    require("path").join(folder, name),
    "utf8"
  );
  return global.query(str);
};

before(function () {
  var dbURL = process.env.MYSQL_URI;
  var resetConnection = mysql.createConnection(dbURL.replace("/ormtest", "/"));

  return global
    .query(
      "DROP DATABASE IF EXISTS ormtest; CREATE DATABASE ormtest;",
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
