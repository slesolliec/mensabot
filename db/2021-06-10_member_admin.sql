ALTER TABLE members ADD COLUMN is_admin TINYINT(3) UNSIGNED NULL DEFAULT 0 AFTER `state`;
