-- here are all the queries used to create the database
CREATE TABLE users (
    did               bigint PRIMARY KEY,
    mid               int    UNIQUE,
    discord_name      varchar(100),
    real_name         varchar(200),
    region            varchar(3),
    departement       smallint,
    email             varchar(100) UNIQUE,
    state             varchar(20)  DEFAULT 'new',
    validation_code   varchar(6),
    validation_trials tinyint DEFAULT 0 
);

-- did = Discord ID
-- mid = numéro Mensa
-- state =
--     new : nouveau contact
--     welcomed : le message de bienvenue lui a été envoyé
--     vcode_sent : le code de validation lui a été envoyé
--     found : la fiche du mensan a bien été trouvée dans l'annuaire
--     err_no_name: le nom  n'a pas été trouvé dans l'annuaire de Mensa
--     err_no_mail: l'email n'a pas été trouvé dans l'annuaire de Mensa
--     in_error : il manque des infos nécessaires : nom, ou email, ....
--     validated : utilisteur validé en tant que Mensan


-- servers
CREATE TABLE guilds (
    gid         bigint PRIMARY KEY,
    name        varchar(200),
    mensan_role bigint
);


-- memberships: which users belong to which guilds
CREATE TABLE members (
    gid bigint NOT NULL,
    did bigint NOT NULL,
    state varchar(20)
);


-- state = this is the state on the discord guild
--    null  : we don't know
--   member : he's a Mensa member in the guild
