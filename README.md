# loke-mysql-orm

[![NPM Version](https://img.shields.io/npm/v/loke-mysql-orm.svg)](https://www.npmjs.com/package/loke-mysql-orm)
[![Build Status](https://img.shields.io/travis/LOKE/loke-mysql-orm/master.svg)](https://travis-ci.org/LOKE/loke-mysql-orm)
[![Coverage Status](https://img.shields.io/coveralls/LOKE/loke-mysql-orm/master.svg)](https://coveralls.io/r/LOKE/loke-mysql-orm?branch=master)
[![NPM Downloads](https://img.shields.io/npm/dm/loke-mysql-orm.svg)](https://www.npmjs.com/package/loke-mysql-orm)
[![License](https://img.shields.io/npm/l/loke-mysql-orm.svg)](https://www.npmjs.com/package/loke-mysql-orm)

## Install

`npm install --save loke-mysql-orm`

## Example

```js
var db = require('loke-mysql-orm').create('mysql://root@localhost/demo');
var petRepository = db.table('Pets', {
  name: { type: String, defaultValue: () => 'Untitled' },
  description: db.Text
});
var userRepository = db.table('Users', {
  firstName: db.String,
  lastName: db.String,
  pets: [petRepository]
});

userRepository.find({firstName: 'Testing'})
.then(function (users) {
  users[0].pets[0].description = 'Hello World!';
  // Save changes:
  return userRepository.persist(users[0]);
});
```

## Tests

`npm test`

## Coverage

`npm run coverage`

Documentation:

See the `doc/` folder.
TODO: Set up gh-pages branch.
