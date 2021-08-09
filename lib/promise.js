"use strict";

// Find native promise constructor if available:
var P =
  typeof Promise === "undefined" ? require("es6-promise").Promise : Promise;

/**
 * Promise
 * @param {Function} [resolve]
 * @param {Function} [reject]
 * @returns {Promise}
 */
module.exports = function (resolve, reject) {
  return new P(resolve, reject);
};
module.exports.resolve = function (value) {
  return P.resolve(value);
};
/**
 * Wait for all promises to resolve
 * @param  {[Promise]} array of promises
 * @return {Promise}
 */
module.exports.all = function (array) {
  return P.all(array);
};

/**
 * Override promise library
 *
 * Example:
 * orm.setPromiseConstructor(require('bluebird'));
 *
 * @param {(Function, Function) => Promise} constructor
 */
module.exports.setPromiseConstructor = function (constructor) {
  P = constructor;
};
