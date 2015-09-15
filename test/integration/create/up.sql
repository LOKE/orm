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
  `State` varchar(11) DEFAULT NULL,
  `Country` varchar(255) DEFAULT NULL,
  `FirstName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `blah` (`Country`,`State`,`Suburb`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
