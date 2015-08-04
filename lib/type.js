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
/**
 * Date type
 *
 * Converts to date type, because Date('2010') !== new Date('2010')
 *
 * @param {Date} value
 */
function Timestamp(value) {
  return new Date(value);
}
function HasMany(array) {
  return array;
}
function HasOne(document) {
  return document;
}
