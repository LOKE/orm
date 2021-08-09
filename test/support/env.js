"use strict";

process.env.MYSQL_URI =
  process.env.GH_ACTIONS_MYSQL_URI ||
  "mysql://root@localhost/ormtest?multipleStatements=true";

global.lib = require("../../");
