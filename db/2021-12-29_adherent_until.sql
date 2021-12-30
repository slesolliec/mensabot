ALTER TABLE users 
ADD COLUMN adherent_until DATE NULL AFTER adherent;

ALTER TABLE users 
ADD COLUMN birthdate DATE NULL AFTER real_name,
ADD COLUMN code_postal INT NULL AFTER region;

ALTER TABLE users 
ADD COLUMN pays varchar(50) NULL AFTER region;
