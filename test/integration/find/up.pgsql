CREATE TABLE users (
  id serial PRIMARY KEY,
  Suburb varchar(20) NOT NULL DEFAULT '',
  State varchar(255) DEFAULT NULL,
  Country varchar(255) DEFAULT NULL,
  FirstName varchar(255) DEFAULT NULL
  -- KEY blah (Country,State,Suburb)
);

CREATE TABLE customers (
  id serial PRIMARY KEY,
  userId integer NOT NULL REFERENCES users,
  name varchar(255) DEFAULT NULL
);

INSERT INTO users (id, Suburb, State, Country, FirstName)
VALUES
	(1, '', NULL, NULL, 'Testing');

INSERT INTO customers (id, userId, name)
VALUES
  	(41, 1, 'customername');
