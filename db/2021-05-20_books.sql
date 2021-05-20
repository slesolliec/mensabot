

CREATE TABLE `books` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `authors` varchar(250) DEFAULT NULL,
  `year` smallint(6) unsigned DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `cover_ext` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`id`)
);


CREATE TABLE `reviews` (
  `book_id` int(11) NOT NULL,
  `mid` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `rating` tinyint(1) unsigned DEFAULT NULL,
  `comment` text DEFAULT NULL
);


ALTER TABLE tags ADD COLUMN book_id SMALLINT(5) UNSIGNED NULL DEFAULT NULL AFTER mid;

ALTER TABLE books ADD COLUMN cover_ext VARCHAR(5) NULL AFTER created_at;

