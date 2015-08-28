'use strict';
var expect = require('expect');
var Connection = global.lib.Connection;

describe('Reading from database', function () {
  var db;
  var userRepo;
  var petRepo;
  var addrRepo;

  before(function () {
    db = new Connection(process.env.MYSQL_URI);

    petRepo = db.table('pets', {
      name: String,
      type: ['cat', 'dog']
    });
    addrRepo = db.table('addresses', {
      country: String
    });
    petRepo.prototype.makeSound = function () {
      if (this.type === 'cat') return 'meow';
    };
    userRepo = db.table('users', {
      FirstName: String,
      pets: [petRepo],
      address: addrRepo
    });

    return global.query.read(__dirname, 'up.sql');
  });
  after(function () {
    return global.query.read(__dirname, 'down.sql')
    .then(function () {
      return db.end();
    });
  });

  it('should be able to insert users without any pets', function () {
    var newUser = userRepo.new({firstName: 'test'});
    expect(newUser.pets.length).toBe(0);
    expect(newUser.address).toNotExist();
    return userRepo.persist(newUser)
    .then(function (res) {
      expect(res).toBe(newUser);
      expect(newUser.pets.length).toBe(0);
    });
  });

  it('should be able to insert users with one pet', function () {
    var newUser = userRepo.new({firstName: 'test', pets: [{type: 'cat', name: '#1'}]});
    expect(newUser.pets.length).toBe(1);
    expect(newUser.pets[0].makeSound()).toBe('meow');
    expect(newUser.address).toNotExist();
    return userRepo.persist(newUser)
    .then(function (res) {
      expect(res).toBe(newUser);
      expect(newUser.pets.length).toBe(1);
      expect(newUser.pets[0].id).toExist();
    });
  });
});
