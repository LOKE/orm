CREATE TABLE `customers` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userId` int(11) unsigned NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Suburb` varchar(20) NOT NULL DEFAULT '',
  `State` int(11) DEFAULT NULL,
  `Country` int(11) DEFAULT NULL,
  `FirstName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `blah` (`Country`,`State`,`Suburb`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;


INSERT INTO `users` (`id`, `Suburb`, `State`, `Country`, `FirstName`)
VALUES
	(1, '', NULL, NULL, 'Testing');

  INSERT INTO `customers` (`id`, `userId`, `name`)
  VALUES
  	(41, 1, 'customername');
