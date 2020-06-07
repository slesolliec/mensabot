-- here are all the queries used to create the database

CREATE TABLE users (
    did          INTEGER         PRIMARY KEY,
    mid          INTEGER         UNIQUE,
    discord_name STRING (0, 100),
    firstname    STRING (0, 200),
    lastname     STRING (0, 200),
    email        STRING (0, 100) UNIQUE
);
