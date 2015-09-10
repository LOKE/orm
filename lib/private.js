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
  if (typeof Symbol === 'function') {
    var PRIVATE = Symbol('private');
    return function $private(obj) {
      var v = obj[PRIVATE];
      if (!v) v = obj[PRIVATE] = {};
      return v;
    };
  }
  // Node v0.10.x fallback:
  return function $private(obj) {
    var key = '_private';
    var v = obj[key];
    if (!v) {
      v = {};
      Object.defineProperty(obj, key, {
        value: v
      });
    }
    return v;
  };
};
