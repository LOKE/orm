'use strict';

function makeSymbol(name) {
  if (typeof Symbol === 'function') {
    return Symbol(name);
  }
  return '_' + name;
}

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
  var PRIVATE = Symbol('private');
  var $private  = function (obj) { return obj[PRIVATE] || (obj[PRIVATE] = {}); };
  return $private;
};
