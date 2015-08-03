'use strict';
module.exports = Document;
var Modifier = require('./modifier');

function Document(values, schema) {
  var modifier = new Modifier(this);
  modifier.init(values || {}, schema);
  Object.freeze(this);
}
