"use strict";

process.env.MYSQL_URI =
  process.env.GH_ACTIONS_MYSQL_URI ||
  "mysql://root@localhost/ormtest?multipleStatements=true";

process.env.PG_URI =
  process.env.GH_ACTIONS_PG_URI || "postgres://localhost/ormtest";

global.lib = require("../../");
