# Overview

## Installation

[![NPM Version](https://img.shields.io/npm/v/loke-mysql-orm.svg)](https://www.npmjs.com/package/loke-mysql-orm)

Install from [npm](https://npmjs.org):

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
  return userRepository.persist(users[0]);
});
```
