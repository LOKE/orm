'use strict';

process.env.MYSQL_URI = 'mysql://root@localhost/ormtest?multipleStatements=true';

global.lib = require('../../');
