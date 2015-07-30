'use strict';

var PRIVATE = Symbol('Private');
var $private  = function (obj) { return obj[PRIVATE] || (obj[PRIVATE] = {}); };

exports.create = function () {
  return $private;
};
