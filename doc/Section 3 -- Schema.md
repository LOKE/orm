# Schema

Repositories allow you to query and update documents in the database.

To create a repository you first must define a schema to describe which columns and database tables to use.

## Defining Schemas

The `db.table` method allows creating repositories with a schema description.

```js
/**
 * Create a repository
 * @param  {String} tableName
 * @param  {} schemaDescription describe keys
 * @return {Repository} model constructor
 */
Connection.prototype.table = function (tableName, schemaDescription) {
  var schema = new Schema(schemaDescription);
  return new SequelizeRepository(sequelize, tableName, schema);
};
```

Example Usage:

```js
var db = require('loke-mysql-orm').create('mysql://root@localhost/demo');

var userRepo = db.table('Users', {
  firstName: {type: db.String},
  birthdate: {type: db.Date}
});
```

## Relations

Relations are defined by using another repository instance as a `type` value.

Example Usage:

```js
var db = require('loke-mysql-orm').create('mysql://root@localhost/demo');

var address  = db.table('Addresses', { suburb : String });
var petsRepo = db.table('Pets',      { name   : String });

var userRepo = db.table('Users', {
  address  : { type: address },   // Defines a `HasOne` relation
  pets     : { type: [petsRepo] } // Defines a `HasMany` relation
});
```

## Types:

List of all supported types and their MYSQL translation:

- `db.Id` - `INT(11) UNSIGNED`
- `db.String` - `VARCHAR(255)`
- `db.Number` - `DOUBLE`
- `db.Boolean` - `TINYINT(1)`
- `db.Date` - `DATETIME`
- `db.Text` - `TEXT`
- `db.Decimal` - `DECIMAL(10, 2)`
- `db.Enum` - `ENUM`
