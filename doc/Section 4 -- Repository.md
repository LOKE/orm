# Repository

All query methods defined on repositories return a `Promise`, using native promises if available, and otherwise falling back to using the [`es6-promise`](https://www.npmjs.com/package/es6-promise) library on NPM.

## find

Query documents.

Example:

```js
userRepo.find({added: {$lt: new Date('2014')});
```

## findOne

Find the first document for a query.

```js
Repository.prototype.findOne = function (q) {
  return this.find(q, {limit: 1})
  .then(function (results) {
    return results[0] || null;
  });
};
```

## findById

Find a document by its primary key.

```js
Repository.prototype.findById = function (id) {
  var q = {};
  q[this.schema.primaryField.name] = id;
  return this.findOne(q);
};
```

## new

Create a document without yet persisting it to the database.

Example:

```js
var user = userRepository.new({firstName: 'Testing'});
console.log(user.firstName);
```

## persist

Save a document. Depending on whether the object is already in the database, this will trigger either an `INSERT` or an `UPDATE` query.
Persisting a document will also persist all of its related child documents (HasOne and HasMany).

```js
var user = userRepository.new({firstName: 'Testing'});
userRepository.persist(user);
```

## update

Update a document by using its primary key.

```js
userRepository.update(user, {firstName: 'ReplacementValue'});
```

## create

Shorthand to build a document and persist it:

```js
Repository.prototype.create = function (o) {
  return this.persist(this.new(o));
};
```

## insert

You would usually not use this directly, but use `persist()` instead. This inserts values into a table.

Example:

```js
userRepo.insert({x: 3, y: 5});
// INSERT INTO `Users` (`ID`, `x`, `y`)
// VALUES (DEFAULT, 3, 5);

```


## remove

Delete a document. Creates a `DELETE` query with the primary key.

Example:

```js
userRepo.remove(user);
```

## updateWhere

```js
// UPDATE Users SET y = 5 WHERE X = 3
userRepo.updateWhere({x: 3}, {y: 5});
```

## removeWhere

Create a `DELETE` query.
Example

```js
// DELETE FROM User sWHERE X = 3
userRepo.deleteWhere({x: 3});
```
