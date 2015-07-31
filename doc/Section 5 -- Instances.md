# Instances

To add instance methods, define them on the Repository#prototype property:

```js
var userRepository = db.table('Users', {});

userRepository.prototype.getFullName = function () {
  return this.firstName + ' ' + this.lastName;
};
```
