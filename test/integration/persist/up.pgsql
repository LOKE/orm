CREATE TABLE users (
  id serial PRIMARY KEY,
  Suburb varchar(20) NOT NULL DEFAULT '',
  State varchar(11) DEFAULT NULL,
  Country varchar(255) DEFAULT NULL,
  FirstName varchar(255) DEFAULT NULL
  -- KEY blah (Country,State,Suburb)
);

CREATE TABLE pets (
  id serial PRIMARY KEY,
  userId integer NOT NULL REFERENCES users,
  name varchar(255) DEFAULT NULL,
  type varchar(255) DEFAULT NULL
);

CREATE TABLE addresses (
  ID serial PRIMARY KEY,
  Country varchar(255) NOT NULL DEFAULT '',
  UserID integer
);
