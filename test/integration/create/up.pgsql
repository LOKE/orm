CREATE TABLE users (
  id      serial PRIMARY KEY,
  Suburb  varchar(20) NOT NULL DEFAULT '',
  State   varchar(11) DEFAULT NULL,
  Country varchar(255) DEFAULT NULL,
  FirstName varchar(255) DEFAULT NULL
  -- KEY     blah (Country,State,Suburb)
);

CREATE TABLE customers (
  id      serial PRIMARY KEY,
  userId  integer NOT NULL, -- REFERENCES users(id),
  name    varchar(255) DEFAULT NULL
);
