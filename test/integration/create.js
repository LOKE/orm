'use strict';
var expect = require('expect');
var Connection = global.lib.Connection;
var query = global.query;

describe('insert a document', function () {
  var db;
  before(function () {
    db = new Connection(process.env.MYSQL_URI);

    return query.read(__dirname, 'create-up.sql');
  });
  after(function () {
    return query.read(__dirname, 'create-down.sql')
    .then(function () {
      return db.end();
    });
  });

  it('should be able to insert', function () {
    var repo = db.table('Customers', {
      name: String
    });
    return repo.create({name: 'Testing'})
    .then(function (document) {
      expect(document).toExist();
      expect(document.id).toExist();
    });
  });
  it('should insert relations', function () {
    var customers = db.table('customers', {
      name: String
    });
    var users = db.table('users', {
      firstName: String,
      customer: customers
    });

    var user = users.new({
      firstName: 'John',
      customer: {
        name: '6789'
      }
    });
    return users.persist(user)
    .then(function () {
      expect(user.id).toExist();
      expect(user.customer.id).toExist();
      return users.findById(user.id)
      .then(function (u) {
        // TODO: this obviously needs to broken up into smaller tests
        expect(u.id).toBe(user.id);
        expect(u.firstName).toBe(user.firstName);
        expect(u.customer).toExist();
        expect(u.customer.name).toBe('6789');
        expect(u.customer.id).toEqual(user.customer.id);
        users.persist(u);
        return users.persist(u)
        .then(function () {
          return users.update(u, {firstName: 'Something'})
          .then(function (res) {
            expect(u.firstName).toEqual('Something');
            expect(u).toBe(res);
            return users.updateWhere({id: u.id}, {firstName: 'B'})
            .then(function (affectedCount) {
              expect(affectedCount).toBe(1);
              console.log('userId', u.id);
              return users.findById(u.id)
              .then(function (u2) {
                expect(u2.firstName).toEqual('B');
                return users.remove(u)
                .then(function (dres) {
                  expect(dres).toBe(1);
                });
              });
            });
          });
        });
      });
    });
  });
});
