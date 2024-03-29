# @loke/orm

This package is only used in some legacy systems at LOKE, and as such is deprecated.

Dependency updates and changes will be limited to security and features to transition away from the system.

## Breaking Changes

1) You must now import Connection from the module.

Before: `const Connection = require("@loke/orm");`

After: `const { Connection } = require("@loke/orm");`

2) `create` and `createConnection` are gone. Please use `Connection`.

3) `$` operators are gone, as per underlying Sequelize update. You should import `Op` instead.

Before: `myRepo.find({ age: {$gt: 18} })`

After:

```js
const { Op } = require("@loke/orm");
myRepo.find({ age: {[Op.gt]: 18} })
```

4) You can still use `$` operators by declaring them in the connection options using the field `operatorsAliases`. See sequelize documentation for more details.

5) `sequelize`, `pg` and `mysql2` are now peer dependencies. You must install them yourself.


## Install

`npm install @loke/orm`

## Example

```js
const { Connection } = require('@loke/orm');
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

# [View Documentation](http://loke.github.io/orm).

## Tests

`npm test`

## Coverage

`npm run coverage`

