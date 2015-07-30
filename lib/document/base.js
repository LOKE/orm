'use strict';
module.exports = Document;
var internal = require('./modifier');

function Document(values) {
  internal(this).init(values);
}
