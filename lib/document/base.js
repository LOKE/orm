'use strict';
module.exports = Document;
var Modifier = require('./modifier');

/**
 * Change-tracked object.
 * The resultant object behaves as an ordinary object,
 * except that changes can be tracked internally via the use of a Modifier instance.
 * @param {Object} values initial values
 * @param {Schema} schema only keys defined in the schema are used
 */
function Document(values, schema) {
  var modifier = new Modifier(this);

  // Copy values and set initial state (everything is a change, not persisted yet)
  modifier.init(values || {}, schema);

  // Prevent new properties from being added.
  Object.freeze(this);
}

Document.prototype.inspect = function () {
  var modifier = new Modifier(this);
  var fields = modifier.fields;
  var relations = modifier.relations;
  var o = {};
  for (var k in fields) {
    if (Object.hasOwnProperty.call(fields, k)) {
      o[k] = fields[k];
    }
  }
  for (var kr in relations) {
    if (Object.hasOwnProperty.call(relations, kr)) {
      o[kr] = relations[kr];
    }
  }
  return o;
};
