# Overview

## Installation

```
npm install --save @loke/orm
```

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
    return userRepository.persist(users[0]);
  });
```
