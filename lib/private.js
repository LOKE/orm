'use strict';

/**
 * Provides provide variable access.
 *
 * Example usage:
 *
 * const $private = require('./private').create();
 * $private(object).connection = {};
 *
 * @return {Accessor}
 */
exports.create = function () {
  var PRIVATE = Symbol('Private');
  var $private  = function (obj) { return obj[PRIVATE] || (obj[PRIVATE] = {}); };
  return $private;
};
