'use strict';
var expect = require('expect');
var Connection = global.lib.Connection;

describe('Reading from database', function () {
  var db;
  before(function () {
    db = new Connection(process.env.MYSQL_URI);
    return global.query.read(__dirname, 'find-up.sql');
  });
  after(function () {
    return global.query.read(__dirname, 'find-down.sql')
    .then(function () {
      return db.end();
    });
  });

  it('should be able to find documents', function () {
    var customerRepo = db.table('customers', {
      name: String
    });
    var repo = db.table('users', {
      firstName: String,
      customer: customerRepo
    });

    return repo.find({'customer.name': 'customername'})
    .then(function (results) {
      expect(JSON.stringify(results)).toEqual('[{"firstName":"Testing","id":1,"customer":{"name":"customername","id":41}}]');
    });
  });
});
