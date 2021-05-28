ALTER TABLE books 
ADD COLUMN mid SMALLINT(5) UNSIGNED NULL COMMENT 'mid of person who added the book' AFTER cover_ext;
