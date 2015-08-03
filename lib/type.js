'use strict';

exports.String  = String;
exports.Number  = Number;
exports.Date = Timestamp;
exports.Timestamp = Timestamp;
exports.Boolean = Boolean;
exports.Text = Text;
exports.Decimal = Decimal;
exports.Id = Id;
exports.Enum = Enum;
exports.HasMany = HasMany;
exports.HasOne = HasOne;

function Text(str) {
  return String(str);
}
function Decimal(n) {
  return Number(n);
}
function Id(n) {
  return Number(n);
}
function Enum(str) {
  return String(str);
}
function Timestamp(val) {
  return new Date(val);
}
function HasMany(array) {
  return array;
}
function HasOne(document) {
  return document;
}

var typesByString = {
  string   : exports.String,
  number   : exports.Number,
  date     : exports.Date,
  text     : exports.Text,
  boolean  : exports.Boolean,
  id       : exports.Id,
  enum     : exports.Enum
};

exports.fromString = function (typeName) {
  var t = typesByString[typeName.toLowerCase()];
  if (!t) throw new Error('Unknown schema type: ' + typeName);
  return t;
};
