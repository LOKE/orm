# Connection

Create a connection.

```js
var db = require('loke-mysql-orm').create(MYSQL_URI, {
  logging: function (sql) {
    console.log('SQL: ' +  sql);
  }
});

function finish() {
  db.end();
}
```
