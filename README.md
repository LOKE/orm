# @loke/mysql-orm

[![NPM Version](https://img.shields.io/npm/v/loke-mysql-orm.svg)](https://www.npmjs.com/package/@loke/mysql-orm)
[![NPM Downloads](https://img.shields.io/npm/dm/loke-mysql-orm.svg)](https://www.npmjs.com/package/@loke/mysql-orm)
[![License](https://img.shields.io/npm/l/loke-mysql-orm.svg)](https://www.npmjs.com/package/@loke/mysql-orm)

## Breaking Changes

1) You must now import Connection from the module.

Before: `const Connection = require("@loke/mysql-orm");`

After: `const { Connection } = require("@loke/mysql-orm");`

2) `create` and `createConnection` are gone. Please use `Connection`.

3) `$` operators are gone, as per underlying Sequelize update. You should import `Op` instead.

Before: `myRepo.find({ age: {$gt: 18} })`

After:

```js
const { Op } = require("@loke/mysql-orm");
myRepo.find({ age: {[Op.gt]: 18} })
```

1) You can still use `$` operators by declaring them in the connection options using the field `operatorsAliases`. See sequelize documentation for more details.
## Install

`npm install @loke/mysql-orm`

## Example

```js
const { Connection } = require('@loke/mysql-orm');
const db = new Connection('mysql://root@localhost/demo');
const petRepository = db.table('Pets', {
  name: { type: String, defaultValue: () => 'Untitled' },
  description: db.Text
});
const userRepository = db.table('Users', {
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

# [View Documentation](http://loke.github.io/mysql-orm).

## Tests

`npm test`

## Coverage

`npm run coverage`

