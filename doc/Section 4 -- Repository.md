# Repository

All query methods defined on repositories return a `Promise`, using native promises if available, and otherwise falling back to using the [`es6-promise`](https://www.npmjs.com/package/es6-promise) library on NPM. If you want it to use a different promise implementation use the `require('loke-mysql-orm').setPromiseConstructor(Promise)` method.

## find

Query documents: `find(q, opts)`.

Example:

```js
userRepo.find({added: {$lt: new Date('2014')});
```

Options:

| Option           | Description                      |
| ---------------- | -------------------------------- |
| opts.attributes  | List of field names to select   |
| opts.limit       | Number of rows to return         |
| opts.offset      | Number of rows to skip           |
| opts.order       | Sort. E.g. `[['ID', 'ASC']]`     |

## stream

Query documents using a streaming interface.
Same function signature as `find()`, but returns a Readable stream.

```js
userRepo.find({added: {$lt: new Date('2014')})
.on('data', user => console.log(user.firstName))
.on('end', () => console.log('END'));
```

Options:


| Option              | Description                      |
| ------------------- | -------------------------------- |
| opts.highWaterMark  | Maximum number of rows to pre-buffer in memory when there is a slow consumer   |
| opts.attributes     | List of field names to select    |
| opts.limit          | Number of rows to return         |
| opts.offset         | Number of rows to skip           |
| opts.order          | Sort. E.g. `[['ID', 'ASC']]`     |

## findOne

Find the first document for a query.

```js
Repository.prototype.findOne = function (q, opts) {
  opts = opts || {};
  opts.limit = 1;
  return this.find(q, opts)
  .then(function (results) {
    return results[0] || null;
  });
};
```

## findById

Find a document by its primary key.

```js
Repository.prototype.findById = function (id, opts) {
  var q = {};
  q[this.schema.primaryField.name] = id;
  return this.findOne(q, opts);
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

## reload

Reload the entire document.

```js
exampleRepo.reload(document);
```

## remove

Delete a document. Creates a `DELETE` query with the primary key.

Example:

```js
userRepo.remove(user);
```

## delete

Delete a document. By default, this will call .remove, but can be overridden to implement soft-deleting.

Example:

```js
userRepo.delete(user);
```

## updateWhere

Creates an `UPDATE` query. Returns a promise that resolves to the number of rows affected.

```js
// UPDATE Users SET y = 5 WHERE X = 3
userRepo.updateWhere({x: 3}, {y: 5});
```

## removeWhere

Create a `DELETE` query.
Example

```js
// DELETE FROM Users WHERE X = 3
userRepo.deleteWhere({x: 3});
```



## rawInsert

Create a custom `INSERT` query.

Example:

rawSQLString:

```sql
INSERT INTO example (a,b,c) VALUES (1,2,0)
  ON DUPLICATE KEY UPDATE c=c+:value;
```

code:

```js
exampleRepo.rawInsert(rawSQLString, {value: 1});
```

## rawSelect

Create a custom `SELECT` query.

Example:

rawSQLString:

```sql
SELECT * FROM example WHERE a + b < :value
```

code:

```js
exampleRepo.rawSelect(rawSQLString, {value: 300});
```

## rawUpdate

Create a custom `UPDATE` query.
Returns the number of affected rows.

Example:

rawIncrementString:

```sql
UPDATE example SET c = c + 1 WHERE a = :a LIMIT 1
```

code:

```js
exampleRepo.rawUpdate(rawIncrementString, {a: 239});
```

## didApplyChanges

When you use the `repo.update(document, {...changes})` method the change tracking system will update the local `document` object. However, with custom SQL queries this cannot be done automatically.

Although it is possible to update the in-memory object simply by setting `document.c = document.c + 1`, that would cause problems if you were to persist that object later on.

Hence, to update the local value on the document, without triggering the change tracker to overwrite anything, there is a `didApplyChanges(document, fieldValues, relationValues)` method for this purpose.

Example:

rawIncrementString:

```sql
UPDATE example SET c = c + 1 WHERE id = :id LIMIT 1
```

code:

```js
exampleRepo.rawUpdate(rawIncrementString, {id: document.id})
.then(nUpdated => {
  if (nUpdated) exampleRepo.didApplyChanges(document, {c: document.c + 1});
});
```
