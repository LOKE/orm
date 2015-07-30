'use strict';
var expect = require('expect');
var Connection = global.lib.Connection;

describe('insert a document', function () {
  var db;
  before(function () {
    db = new Connection(process.env.MYSQL_URI);
  });
  after(function () {
    return db.end();
  });

  it('should be able to insert', function () {
    var repo = db.table('Customers', {
      name: String
    });
    return repo.create({name: 'Testing'});
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
