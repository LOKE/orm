"use strict";
var expect = require("expect");
const { databases } = require("../..");

describe("insert a document", function () {
  databases(__dirname).forEach((database) => {
    describe(database.name, () => {
      let db;
      before(async () => {
        db = await database.before();
      });
      after(async () => {
        await database.after(db);
      });

      it("should be able to insert", function () {
        var repo = db.table("customers", {
          name: String,
          userId: Number,
        });
        return repo
          .create({ name: "Testing", userId: 300 })
          .then(function (document) {
            expect(document).toExist();
            expect(document.id).toExist();
          });
      });

      it("should be able to insert multiple records simultaneously", function () {
        var customers = db.table("customers", {
          name: String,
        });
        var users = db.table("users", {
          firstName: String,
          customers: [customers],
        });

        var promises = [];
        for (var i = 0; i < 5; i++) {
          promises.push(
            users.create({
              firstName: "Testing",
              customers: [{ name: "testing" }],
            })
          );
        }
        return Promise.all(promises);
      });
      it("should not insert empty relations", function () {
        var customers = db.table("customers", {
          name: String,
        });
        var users = db.table("users", {
          firstName: String,
          customer: customers,
          customers: [customers],
        });

        var user = users.new({
          firstName: "John",
        });
        return users.persist(user);
      });
      it("should insert relations", function () {
        var customers = db.table("customers", {
          name: String,
        });
        var users = db.table("users", {
          firstName: String,
          customer: customers,
        });

        var user = users.new({
          firstName: "John",
          customer: {
            name: "6789",
          },
        });
        expect(user.id).toBe(undefined, "user.id === undefined");
        expect(user.customer).toExist("user.customer");
        return users.persist(user).then(function () {
          expect(user.id).toExist("user.id");
          expect(user.customer).toExist("should still have user.customer");
          expect(user.customer.id).toExist("user.customer.id");
          return users.findById(user.id).then(function (u) {
            // TODO: this obviously needs to broken up into smaller tests
            expect(u.id).toExist("Result of findById should have .id");
            expect(u.id).toBe(user.id);
            expect(u.firstName).toBe(user.firstName);
            expect(u.customer).toExist();
            expect(u.customer.name).toBe("6789");
            expect(u.customer.id).toEqual(user.customer.id);
            users.persist(u);
            return users.persist(u).then(function () {
              return users
                .update(u, { firstName: "Something" })
                .then(function (res) {
                  expect(u.firstName).toEqual("Something");
                  expect(u).toBe(res);
                  return users
                    .updateWhere({ id: u.id }, { firstName: "B" })
                    .then(function (affectedCount) {
                      expect(affectedCount).toBe(1);
                      return users.findById(u.id).then(function (u2) {
                        expect(u2.firstName).toEqual("B");
                        return users.remove(u).then(function (dres) {
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
  });
});
