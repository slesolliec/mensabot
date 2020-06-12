-- here are all the queries used to create the database

CREATE TABLE users (
    did          INTEGER         PRIMARY KEY,
    mid          INTEGER         UNIQUE,
    discord_name STRING (0, 100),
    real_name    STRING (0, 200),
    region       STRING (0, 3),
    departement  INTEGER,
    email        STRING (0, 100) UNIQUE,
    state        STRING (0, 20)  DEFAULT new
);

-- did = Discord ID
-- mid = numéro Mensa
-- state =
--     new : nouveau contact
--     welcomed : le message de bienvenue lui a été envoyé
--     validationCodeSent : le code de validation lui a été envoyé
--     validated : utilisteur validé en tant que Mensan


-- servers
CREATE TABLE guilds (
    gid  INTEGER         PRIMARY KEY,
    name STRING (0, 200) 
);

-- memberships: which users belong to which guilds
CREATE TABLE members (
    gid INTEGER NOT NULL,
    did INTEGER NOT NULL
);
