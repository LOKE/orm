# Connection

Create a connection.

```js
const { Connection } = require('@loke/mysql-orm');
const db = new Connection(MYSQL_URI, {
  logging: function (sql) {
    console.log('SQL: ' +  sql);
  }
});

function finish() {
  db.end();
}
```
