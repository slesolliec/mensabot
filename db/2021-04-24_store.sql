CREATE TABLE `store` (
  `key` VARCHAR(40) NOT NULL,
  `val` VARCHAR(200) NULL,
  UNIQUE INDEX `key_UNIQUE` (`key` ASC));

INSERT INTO `store` (`key`, `val`) VALUES ('bot_lastping', '0');
INSERT INTO `store` (`key`, `val`) VALUES ('spider_lastping', '0');

