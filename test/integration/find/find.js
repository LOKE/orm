'use strict';
var expect = require('expect');
var Connection = global.lib.Connection;

describe('Reading from database', function () {
  var db;
  before(function () {
    db = new Connection(process.env.MYSQL_URI);
    return global.query.read(__dirname, 'up.sql');
  });
  after(function () {
    return global.query.read(__dirname, 'down.sql')
    .then(function () {
      return db.end();
    });
  });

  it('should be able to find documents', function () {
    var customerRepo = db.table('customers', {
      name: String
    });
    var repo = db.table('users', {
      first: {type: String, column: 'firstName'},
      customer: customerRepo
    });

    return repo.find({'customer.name': 'customername'})
    .then(function (results) {
      expect(JSON.stringify(results)).toEqual('[{"first":"Testing","id":1,"customer":{"name":"customername","id":41}}]');
    });
  });
  it('should be able to count documents', function () {
    var repo = db.table('users', {
      first: {type: String, column: 'firstName'}
    });
    repo.literal('COUNT(*)');
    return repo.count()
    .then(function (n) {
      expect(n).toBe(1)
    });
  });
  it('should be able to select raw SQL with arrays inserted', function () {
    var repo = db.table('users', {
      first: {type: String, column: 'firstName'}
    });
    return repo.rawSelect('select * from users where firstname in (:priceTypes)', {priceTypes: ['cat', 'dog']});
  });
  it('should be able to stream documents', function (done) {
    var repo = db.table('users', {
      first: {type: String, column: 'firstName'}
    });

    repo.prototype.greet = function () {
      return 'Hello ' + this.first + '!';
    };

    var count = 0;
    repo.stream({
      first: 'Testing'
    })
    .on('data', function (data) {
      expect(data.greet()).toBe('Hello Testing!');
      count++;
    })
    .on('end', function () {
      expect(count).toBe(1);
      done();
    });
  });
});
