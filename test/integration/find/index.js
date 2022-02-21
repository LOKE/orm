"use strict";
const expect = require("expect");
const { databases } = require("../..");

describe("Reading from database", function () {
  databases(__dirname).forEach((database) => {
    describe(database.name, () => {
      let db;
      before(async () => {
        db = await database.before();
      });
      after(async () => {
        await database.after(db);
      });

      it("should be able to find documents", function () {
        var customerRepo = db.table("customers", {
          name: String,
        });
        var repo = db.table("users", {
          first: { type: String, column: "firstName" },
          customer: customerRepo,
        });

        return repo
          .find({ "customer.name": "customername" })
          .then(function (results) {
            expect(JSON.stringify(results)).toEqual(
              '[{"first":"Testing","id":1,"customer":{"name":"customername","id":41}}]'
            );
          });
      });
      it("should be able to count documents", function () {
        var repo = db.table("users", {
          first: { type: String, column: "firstName" },
        });
        repo.literal("COUNT(*)");
        return repo.count().then(function (n) {
          expect(n).toBe(1);
        });
      });
      it("should be able to select raw SQL with arrays inserted", function () {
        var repo = db.table("users", {
          first: { type: String, column: "firstName" },
        });
        return repo.rawSelect(
          "select * from users where firstname in (:priceTypes)",
          { priceTypes: ["cat", "dog"] }
        );
      });

      it("should be able to stream documents", function (done) {
        var repo = db.table("users", {
          first: { type: String, column: "firstName" },
        });

        repo.prototype.greet = function () {
          return "Hello " + this.first + "!";
        };

        var count = 0;
        repo
          .stream({
            first: "Testing",
          })
          .on("data", function (data) {
            expect(data.greet()).toBe("Hello Testing!");
            count++;
          })
          .on("end", function () {
            expect(count).toBe(1);
            done();
          });
      });
    });
  });
});
