//npm install mysql2
let mysql = require("mysql2");

var dbConnectionInfo = require("./connectionInfo");

var con = mysql.createConnection({
	host: dbConnectionInfo.host,
	user: dbConnectionInfo.user,
	password: dbConnectionInfo.password,
	port: dbConnectionInfo.port,
	multipleStatements: true,
});

con.connect(function (err) {
	if (err) {
		throw err;
	} else {
		console.log("database.js: Connected to server!");

		con.query("CREATE DATABASE IF NOT EXISTS RVPark", function (err, result) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: RVPark database created.");
			selectDatabase();
		});
	}
});

function selectDatabase() {
	let sql = "USE RVPark";
	con.query(sql, async function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("database.js: Selected RVPark database");
			//Create tables, sps, and add table db functions here
			createTables();
			await createStoredProcedures();
			addTableData();
		}
	});
}

//#region Create Tables
function createTables() {
	// roles table
	let sql =
		"CREATE TABLE IF NOT EXISTS role(\n" +
		"role_id INT NOT NULL AUTO_INCREMENT,\n" +
		"role VARCHAR(50) NOT NULL UNIQUE,\n" +
		"PRIMARY KEY (role_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: role table created if not exists");
	});

	// allowed file types table
	sql =
		"CREATE TABLE IF NOT EXISTS allowed_file_type(\n" +
		"file_type_id INT NOT NULL AUTO_INCREMENT,\n" +
		"file_type VARCHAR(4) NOT NULL,\n" +
		"PRIMARY KEY (file_type_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: allowed_file_type table created if not exists");
	});

	// site_type table
	sql =
		"CREATE TABLE IF NOT EXISTS site_type(\n" +
		"site_type_id INT NOT NULL AUTO_INCREMENT,\n" +
		"site_type VARCHAR(50) NOT NULL,\n" +
		"PRIMARY KEY (site_type_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: site_type table created if not exists");
	});

	// rate table
	sql =
		"CREATE TABLE IF NOT EXISTS rate(\n" +
		"rate_id INT NOT NULL AUTO_INCREMENT,\n" +
		"rate_start_date DATE NOT NULL,\n" +
		"rate_end_date DATE,\n" +
		"rate DECIMAL(4,2) NOT NULL,\n" +
		"site_type_id INT NOT NULL,\n" +
		"PRIMARY KEY (rate_id),\n" +
		"FOREIGN KEY (site_type_id) REFERENCES site_type(site_type_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: rate table created if not exists");
	});

	// user table
	sql =
		"CREATE TABLE IF NOT EXISTS user(\n" +
		"user_id INT NOT NULL AUTO_INCREMENT,\n" +
		"first_name VARCHAR(50) NOT NULL,\n" +
		"last_name VARCHAR(50) NOT NULL,\n" +
		"military_affiliation VARCHAR(50) NOT NULL,\n" +
		"military_rank VARCHAR(50) NOT NULL, \n" +
		"permanent_change_of_station BOOL NOT NULL,\n" +
		"email VARCHAR(255) NOT NULL,\n" +
		"phone VARCHAR(15) NOT NULL, \n" +
		"salt VARCHAR(255) NOT NULL,\n" +
		"hashed_password VARCHAR(255) NOT NULL,\n" +
		"role_id INT NOT NULL,\n" +
		"PRIMARY KEY (user_id),\n" +
		"FOREIGN KEY (role_id) REFERENCES role(role_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: user table created if not exists");
	});

	// payment table
	sql =
		"CREATE TABLE IF NOT EXISTS payment(\n" +
		"payment_id INT NOT NULL AUTO_INCREMENT,\n" +
		"user_id INT NOT NULL,\n" +
		"stripe_transaction_id VARCHAR(36) NOT NULL,\n" +
		"payment_date DATETIME NOT NULL,\n" +
		"payment_amount DECIMAL(15,2) NOT NULL,\n" +
		"payment_status VARCHAR(255) NOT NULL,\n" +
		"PRIMARY KEY (payment_id),\n" +
		"FOREIGN KEY (user_id) REFERENCES user(user_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: payment table created if not exists");
	});

	// user_document table
	sql =
		"CREATE TABLE IF NOT EXISTS user_document(\n" +
		"user_document_id INT NOT NULL AUTO_INCREMENT,\n" +
		"user_id INT NOT NULL,\n" +
		"file_type_id INT NOT NULL,\n" +
		"filename VARCHAR(156) NOT NULL,\n" +
		"upload_date DATETIME NOT NULL,\n" +
		"PRIMARY KEY (user_document_id),\n" +
		"FOREIGN KEY (user_id) REFERENCES user(user_id),\n" +
		"FOREIGN KEY (file_type_id) REFERENCES allowed_file_type(file_type_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: user_document table created if not exists");
	});

	// site table
	sql =
		"CREATE TABLE IF NOT EXISTS site(\n" +
		"site_id INT NOT NULL AUTO_INCREMENT,\n" +
		"site_type_id INT NOT NULL,\n" +
		"site_name VARCHAR(50) NOT NULL,\n" +
		"site_length_in_feet INT,\n" +
		"PRIMARY KEY (site_id),\n" +
		"FOREIGN KEY (site_type_id) REFERENCES site_type(site_type_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: site table created if not exists");
	});

	// reservation table
	sql =
		"CREATE TABLE IF NOT EXISTS reservation(\n" +
		"reservation_id INT NOT NULL AUTO_INCREMENT,\n" +
		"start_date DATE NOT NULL,\n" +
		"end_date DATE NOT NULL,\n" +
		"user_id INT NOT NULL,\n" +
		"payment_id INT NOT NULL,\n" +
		"reservation_status VARCHAR(50) NOT NULL,\n" +
		"total_cost DECIMAL(15,2) NOT NULL,\n" +
		"reservation_notes VARCHAR(3000),\n" +
		"PRIMARY KEY (reservation_id),\n" +
		"FOREIGN KEY (user_id) REFERENCES user(user_id),\n" +
		"FOREIGN KEY (payment_id) REFERENCES payment(payment_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: reservation table created if not exists");
	});

	// reservation_details table
	sql =
		"CREATE TABLE IF NOT EXISTS reservation_details(\n" +
		"reservation_details_id INT NOT NULL AUTO_INCREMENT,\n" +
		"reservation_id INT NOT NULL,\n" +
		"site_id INT NOT NULL,\n" +
		"PRIMARY KEY (reservation_details_id),\n" +
		"FOREIGN KEY (reservation_id) REFERENCES reservation(reservation_id),\n" +
		"FOREIGN KEY (site_id) REFERENCES site(site_id)\n" +
		")";
	con.query(sql, (err, results, fields) => {
		if (err) {
			throw err;
		}
		console.log("database.js: reservation_details table created if not exists");
	});
}
//#endregion

//#region Stored Procedures
async function createStoredProcedures() {
	// create role stored procedure
	let sql =
		"CREATE PROCEDURE IF NOT EXISTS `create_role`(\n" +
		"IN Role VARCHAR(50)\n" +
		")\n" +
		"BEGIN\n" +
		"INSERT IGNORE INTO role (role)\n" +
		"VALUES (Role);\n" +
		"END;";
	con.query(sql, (error, results, fields) => {
		if (error) {
			console.log(error.message);
			throw error;
		}
		console.log("\nCreating Stored Procedures\n***********************************************");
		console.log("\tdatabase.js: Stored Procedure create_role created successfully");
	});

	// Seems like weird placement but very necessary for the
	// create user stored procedure to reference Customer role default
	await CreateRole("customer");
	await CreateRole("admin");
	await CreateRole("unregistered");
	// create user stored procedure
	// Defaults role to customer
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `create_user`(\n" +
		"IN FirstName VARCHAR(50), \n" +
		"IN LastName VARCHAR(50), \n" +
		"IN MilitaryRank VARCHAR(50), \n" +
		"IN MilitaryAffiliation VARCHAR(50), \n" +
		"IN PermanentChangeOfStation BOOL, \n" +
		"IN Email VARCHAR(255), \n" +
		"IN Phone VARCHAR(15), \n" +
		"IN Salt VARCHAR(255),\n" +
		"IN HashedPassword VARCHAR(255) \n" +
		")\n" +
		"BEGIN\n" +
		"INSERT INTO user (first_name, last_name, military_rank, military_affiliation,\n" +
		"permanent_change_of_station, email, phone, salt, hashed_password, role_id) \n" +
		"VALUES (FirstName, LastName, MilitaryAffiliation, MilitaryRank, \n" +
		"PermanentChangeOfStation, Email, Phone, Salt, HashedPassword, \n" +
		"(SELECT role_id FROM role WHERE role.role = 'customer'));\n" +
		"END;";
	con.query(sql, (error, results, fields) => {
		if (error) {
			console.log("create_user " + error.message);
			throw error;
		}
		console.log("\tdatabase.js: Stored Procedure create_user created successfully");
	});

	// create change user role stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `change_user_role`(\n" +
		"IN email VARCHAR(255),\n" +
		"IN new_role VARCHAR(50)\n" +
		")\n" +
		"BEGIN\n" +
		"UPDATE user\n" +
		"SET role_id = (SELECT role_id FROM role WHERE role.role = new_role)\n" +
		"WHERE user.email = email;" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure change_user_role created successfully");
		}
	});

	// create insert site type stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `insert_site_type`(\n" +
		"IN site_type VARCHAR(50)\n" +
		")\n" +
		"BEGIN\n" +
		"INSERT INTO site_type (site_type)\n" +
		"SELECT site_type FROM DUAL\n" +
		"WHERE NOT EXISTS (\n" +
		"SELECT * FROM site_type\n" +
		"WHERE site_type.site_type=site_type LIMIT 1\n" +
		");\n" +
		"END;";

	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure insert_site_type created successfully");
		}
	});

	// create insert rate stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `insert_rate`(\n" +
		"IN new_rate DECIMAL(4,2),\n" +
		"IN site_type VARCHAR(50)\n" +
		")\n" +
		"BEGIN\n" +
		"DECLARE site_type_id_for_rate INT;\n" +
		"SELECT site_type_id INTO site_type_id_for_rate\n" +
		"FROM site_type\n" +
		"WHERE site_type.site_type = site_type LIMIT 1;\n" +
		"IF site_type_id_for_rate IS NULL THEN\n" +
		"INSERT INTO site_type(site_type)\n" +
		"VALUES (site_type);\n" +
		"SELECT LAST_INSERT_ID() INTO site_type_id_for_rate;\n" +
		"END IF;\n" +
		"INSERT INTO rate (rate_start_date, rate, site_type_id)\n" +
		"VALUES (NOW(), new_rate, site_type_id_for_rate\n" +
		// "SELECT NOW(), new_rate, site_type_id_for_rate FROM DUAL\n" +
		// "WHERE NOT EXISTS (\n" +
		// "SELECT * FROM rate\n" +
		// "WHERE rate.rate = new_rate LIMIT 1\n" +
		");\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure insert_rate created successfully");
		}
	});

	// create insert site stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `insert_site`(\n" +
		"IN site_type_id VARCHAR(50),\n" +
		"IN site_name VARCHAR(50),\n" +
		"IN site_length_in_feet INT\n" +
		")\n" +
		"BEGIN\n" +
		//   "DECLARE this_site_type_id INT;\n" +
		//   "SELECT site_type_id INTO this_site_type_id\n" +
		//   "FROM site_type\n" +
		//   "WHERE site_type.site_type = site_type LIMIT 1;\n" +
		"INSERT INTO site (site_type_id, site_name, site_length_in_feet)\n" +
		"SELECT site_type_id, site_name, site_length_in_feet FROM DUAL\n" +
		"WHERE NOT EXISTS (\n" +
		"SELECT * FROM site\n" +
		"WHERE site.site_name=site_name LIMIT 1\n" +
		");\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure insert_site created successfully");
		}
	});

	// create update rate end date stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `update_rate_end_date`(\n" +
		"IN end_date DATE\n" +
		")\n" +
		"BEGIN\n" +
		"UPDATE rate\n" +
		"SET rate_end_date = end_date\n" +
		"WHERE rate.end_date IS NULL;" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure update_rate_end_date created successfully");
		}
	});

	//create check credentials stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `check_credentials`(\n" +
		"IN email VARCHAR(255),\n" +
		"IN hashed_password VARCHAR(255)\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT role FROM role\n" +
		"INNER JOIN user ON role.role_id=user.role_id\n" +
		"WHERE user.email = email AND user.hashed_password = hashed_password;\n" +
		"END;";

	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: procedure check_credentials created if it didn't exist");
		}
	});

	//create get salt stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_salt`(\n" +
		"IN email VARCHAR(255)\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT salt FROM user\n" +
		"WHERE user.email = email\n" +
		"LIMIT 1;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: procedure get_salt created if it didn't exist");
		}
	});

	// create get available sites stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_available_sites`(\n" +
		"IN start_date DATE,\n" +
		"IN end_date DATE,\n" +
		"IN length VARCHAR(10)\n" +
		")\n" +
		"BEGIN\n" +
		"IF length = 'all' THEN\n" +
		"SELECT site_name, site_type, site_length_in_feet, rate, site_id\n" +
		"FROM site\n" +
		"INNER JOIN site_type USING(site_type_id)\n" +
		"INNER JOIN rate USING(site_type_id)\n" +
		"LEFT OUTER JOIN (SELECT * FROM reservation_details\n" +
		"INNER JOIN reservation rz USING(reservation_id)\n" +
		"WHERE (rz.start_date >= start_date AND rz.start_date < end_date)\n" +
		"OR (rz.end_date > start_date AND rz.end_date <= end_date)\n" +
		"OR (start_date > rz.start_date AND start_date < rz.end_date)\n" +
		"OR (end_date > rz.start_date AND end_date < rz.end_date)) AS rzd USING(site_id)\n" +
		"WHERE reservation_id IS NULL OR reservation_status = 'canceled'\n" +
		"ORDER BY site_id;\n" +
		"ELSEIF length = 'none' THEN\n" +
		"SELECT site_name, site_type, site_length_in_feet, rate, site_id\n" +
		"FROM site\n" +
		"INNER JOIN site_type USING(site_type_id)\n" +
		"INNER JOIN rate USING(site_type_id)\n" +
		"LEFT OUTER JOIN (SELECT * FROM reservation_details\n" +
		"INNER JOIN reservation rz USING(reservation_id)\n" +
		"WHERE (rz.start_date >= start_date AND rz.start_date < end_date)\n" +
		"OR (rz.end_date > start_date AND rz.end_date <= end_date)\n" +
		"OR (start_date > rz.start_date AND start_date < rz.end_date)\n" +
		"OR (end_date > rz.start_date AND end_date < rz.end_date)) AS rzd USING(site_id)\n" +
		"WHERE (reservation_id IS NULL OR reservation_status = 'canceled')\n" +
		"AND site_length_in_feet IS NULL\n" +
		"ORDER BY site_id;\n" +
		"ELSE\n" +
		"SELECT site_name, site_type, site_length_in_feet, rate, site_id\n" +
		"FROM site\n" +
		"INNER JOIN site_type USING(site_type_id)\n" +
		"INNER JOIN rate USING(site_type_id)\n" +
		"LEFT OUTER JOIN (SELECT * FROM reservation_details\n" +
		"INNER JOIN reservation rz USING(reservation_id)\n" +
		"WHERE (rz.start_date >= start_date AND rz.start_date < end_date)\n" +
		"OR (rz.end_date > start_date AND rz.end_date <= end_date)\n" +
		"OR (start_date > rz.start_date AND start_date < rz.end_date)\n" +
		"OR (end_date > rz.start_date AND end_date < rz.end_date)) AS rzd USING(site_id)\n" +
		"WHERE (reservation_id IS NULL OR reservation_status = 'canceled')\n" +
		"AND site_length_in_feet = length\n" +
		"ORDER BY site_id;\n" +
		"END IF;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure get_available_sites created successfully");
		}
	});

	// create get site by id stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_site_by_id`(\n" +
		"IN siteId INT\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT site_name, site_type, site_length_in_feet, rate, s.site_id\n" +
		"FROM site s\n" +
		"INNER JOIN site_type st ON s.site_type_id = st.site_type_id\n" +
		"INNER JOIN rate r ON st.site_type_id = r.site_type_id\n" +
		"WHERE s.site_id = siteId;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure get_site_by_id created successfully");
		}
	});

	// create payment stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `create_payment`(\n" +
		"IN userId INT,\n" +
		"IN stripeTransactionId VARCHAR(36),\n" +
		"IN paymentDate DATETIME,\n" +
		"IN paymentAmount DECIMAL(15,2),\n" +
		"IN paymentStatus VARCHAR(255),\n" +
		"OUT paymentId INT\n" +
		")\n" +
		"BEGIN\n" +
		"INSERT INTO payment (user_id, stripe_transaction_id, payment_date, payment_amount, payment_status)\n" +
		"VALUES (userId, stripeTransactionId, paymentDate, paymentAmount, paymentStatus); \n" +
		"SET paymentId = (SELECT LAST_INSERT_ID());\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure get_site_by_id created successfully");
		}
	});

	// get user id by email
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_user_id_by_email`(\n" +
		"IN email VARCHAR(255)\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT user_id FROM user WHERE user.email = email;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure get_user_id_by_email created successfully");
		}
	});

	// create reservation
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `create_reservation`(\n" +
		"IN startDate DATE,\n" +
		"IN endDate DATE,\n" +
		"IN userId INT,\n" +
		"IN paymentId INT,\n" +
		"IN reservationStatus VARCHAR(255),\n" +
		"IN totalCost DECIMAL(15,2),\n" +
		"OUT reservationId INT\n" +
		")\n" +
		"BEGIN\n" +
		"INSERT INTO reservation (start_date, end_date, user_id, payment_id, reservation_status, total_cost)\n" +
		"VALUES (startDate, endDate, userId, paymentId, reservationStatus, totalCost);\n" +
		"SET reservationId = (SELECT LAST_INSERT_ID());\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure create_reservation created successfully");
		}
	});

	// create reservation_details
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `create_reservation_details`(\n" +
		"IN reservationId INT,\n" +
		"IN siteId INT\n" +
		")\n" +
		"BEGIN\n" +
		"INSERT INTO reservation_details (reservation_id, site_id)\n" +
		"VALUES (reservationId, siteId);\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure create_reservation_details created successfully"
			);
		}
	});

	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_reservations_by_email`(\n" +
		"IN email VARCHAR(255)\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT site_name, s.site_id, start_date, end_date, reservation_status, r.reservation_id\n" +
		"FROM reservation r\n" +
		"INNER JOIN user u ON u.user_id = r.user_id \n" +
		"INNER JOIN reservation_details rd on rd.reservation_id = r.reservation_id\n" +
		"INNER JOIN site s on s.site_id = rd.site_id \n" +
		"WHERE u.email = email;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure get_reservations_by_email created successfully");
		}
	});

	//Get reservations by start date
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_reservations_by_start_date`(\n" +
		"IN date DATE\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT site_name, u.first_name, u.last_name, u.phone, u.permanent_change_of_station, r.reservation_id, reservation_status, payment_status\n" +
		"FROM reservation r\n" +
		"INNER JOIN user u ON u.user_id = r.user_id \n" +
		"INNER JOIN reservation_details rd on rd.reservation_id = r.reservation_id\n" +
		"INNER JOIN payment p on p.payment_id = r.payment_id \n" +
		"INNER JOIN site s on s.site_id = rd.site_id \n" +
		"WHERE start_date >= date AND start_date < date + INTERVAL 1 DAY\n" +
		"ORDER BY start_date;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure get_reservations_by_start_date created successfully"
			);
		}
	});

	//Get reservations by end date
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_reservations_by_end_date`(\n" +
		"IN date DATE\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT site_name, u.first_name, u.last_name, u.phone, u.permanent_change_of_station, r.reservation_id, reservation_status, payment_status\n" +
		"FROM reservation r\n" +
		"INNER JOIN user u ON u.user_id = r.user_id \n" +
		"INNER JOIN reservation_details rd on rd.reservation_id = r.reservation_id\n" +
		"INNER JOIN payment p on p.payment_id = r.payment_id \n" +
		"INNER JOIN site s on s.site_id = rd.site_id \n" +
		"WHERE end_date >= date AND end_date < date + INTERVAL 1 DAY\n" +
		"ORDER BY start_date;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure get_reservations_by_end_date created successfully"
			);
		}
	});

	//Get reservations between from and to date
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_reservations_by_from_and_to_date`(\n" +
		"IN fromDate DATE,\n" +
		"IN toDate DATE\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT site_name, s.site_length_in_feet, r.start_date, r.end_date, r.reservation_notes, u.first_name, u.last_name, u.permanent_change_of_station, u.phone, r.reservation_id, reservation_status, payment_status\n" +
		"FROM reservation r\n" +
		"INNER JOIN user u ON u.user_id = r.user_id \n" +
		"INNER JOIN reservation_details rd on rd.reservation_id = r.reservation_id\n" +
		"INNER JOIN payment p on p.payment_id = r.payment_id\n" +
		"INNER JOIN site s on s.site_id = rd.site_id \n" +
		"WHERE start_date BETWEEN fromDate AND toDate OR end_date between fromDate AND toDate\n" +
		"ORDER BY start_date;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure get_reservations_by_end_date created successfully"
			);
		}
	});

	// create get reservation by id stored procedure
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_reservation_by_id`(\n" +
		"IN reservationId INT\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT reservation_id, start_date, end_date, user_id, payment_id, reservation_status, total_cost\n" +
		"FROM reservation r\n" +
		"WHERE r.reservation_id = reservationId;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure get_reservation_by_id created successfully");
		}
	});

	//Get user data
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_user_data_by_email`(\n" +
		"IN Email VARCHAR(255)\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT first_name, last_name, military_rank, military_affiliation, permanent_change_of_station, salt\n" +
		"FROM user\n " +
		"WHERE user.email = Email;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure get_user_data_by_email created successfully");
		}
	});

	// Change users hashed password by email
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `update_user_hashed_password_by_email`(\n" +
		"IN Email VARCHAR(255),\n" +
		"IN HashedPassword VARCHAR(255)\n" +
		")\n" +
		"BEGIN\n" +
		"UPDATE user\n" +
		"SET hashed_password = HashedPassword\n " +
		"WHERE user.email = Email;\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure update_user_hashed_password_by_email created successfully"
			);
		}
	});
	// create user document
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `create_user_document`(\n" +
		"IN FileTypeId INT,\n" +
		"IN UserId INT,\n" +
		"IN Filename VARCHAR(156),\n" +
		"IN UploadDate DATETIME\n" +
		")\n" +
		"BEGIN\n" +
		"INSERT INTO user_document (file_type_id, user_id, filename, upload_date)\n" +
		"VALUES (FileTypeId, UserId, Filename, UploadDate);\n " +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure create_user_document created successfully");
		}
	});

	// create allowed file type
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `create_allowed_file_type`(\n" +
		"IN FileType VARCHAR(4)\n" +
		")\n" +
		"BEGIN\n" +
		"INSERT INTO allowed_file_type (file_type)\n" +
		"VALUES (FileType);\n " +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure create_allowed_file_type created successfully");
		}
	});

	// get allowed file type
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_allowed_file_type_id_by_file_name`(\n" +
		"IN FileType VARCHAR(4)\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT file_type_id FROM allowed_file_type WHERE allowed_file_type.file_type = FileType;\n " +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure get_allowed_file_type_id_by_file_name created successfully"
			);
		}
	});

	// get user document by email
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_user_document_by_email`(\n" +
		"IN Email VARCHAR(255)\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT filename FROM user_document ud\n" +
		"INNER JOIN user u on u.user_id = ud.user_id\n" +
		"WHERE u.email = Email;\n " +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure get_user_document_by_email created successfully"
			);
		}
	});

	// delete user document by name
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `delete_user_doc_by_file_name`(\n" +
		"IN Filename VARCHAR(156)\n" +
		")\n" +
		"BEGIN\n" +
		"DELETE FROM user_document u\n" +
		"WHERE u.filename = Filename;\n " +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure delete_user_doc_by_file_name created successfully"
			);
		}
	});

	// update user pcs status by email
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `update_user_pcs_status_by_email`(\n" +
		"IN PcsStatus BOOL,\n" +
		"IN Email VARCHAR(255)\n" +
		")\n" +
		"BEGIN\n" +
		"UPDATE user\n" +
		"SET permanent_change_of_station = PcsStatus\n" +
		"WHERE user.email = Email;\n " +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure update_user_pcs_status_by_email created successfully"
			);
		}
	});

	// get daily rate for site using reservation id
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `get_site_rate_by_reservation_id`(\n" +
		"IN reservationId INT\n" +
		")\n" +
		"BEGIN\n" +
		"SELECT rate\n" +
		"FROM rate r\n" +
		"JOIN site s ON r.site_type_id = s.site_type_id\n" +
		"JOIN reservation_details rd ON s.site_id = rd.site_id\n" +
		"JOIN reservation res ON rd.reservation_id = res.reservation_id\n" +
		"WHERE res.reservation_id = reservationId;\n " +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure get_site_rate_by_reservation created successfully"
			);
		}
	});

	// change reservation status
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `update_reservation_status`(\n" +
		"IN reservationId INT,\n" +
		"IN status VARCHAR(50)\n" +
		")\n" +
		"BEGIN\n" +
		"UPDATE reservation\n" +
		"SET reservation_status = status\n" +
		"WHERE reservation.reservation_id = reservationId;" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure update_reservation_status created successfully");
		}
	});

	// change reservation status
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `update_reservation_notes`(\n" +
		"IN reservationId INT,\n" +
		"IN notes VARCHAR(3000)\n" +
		")\n" +
		"BEGIN\n" +
		"UPDATE reservation\n" +
		"SET reservation_notes = notes\n" +
		"WHERE reservation.reservation_id = reservationId;" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure update_reservation_notes created successfully");
		}
	});

	// create unregistered client with a reservation
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `create_unregistered_user`(\n" +
		"IN Email VARCHAR(255),\n" +
		"IN FirstName VARCHAR(50),\n" +
		"IN LastName VARCHAR(50)\n" +
		")\n" +
		"BEGIN\n" +
		"INSERT INTO user (first_name, last_name, military_rank, military_affiliation,\n" +
		"permanent_change_of_station, email, phone, salt, hashed_password, role_id) \n" +
		"VALUES (FirstName, LastName, 'unregistered', 'unregistered', \n" +
		"0, Email, 'unregistered', 'unregistered', 'unregistered', \n" +
		"(SELECT role_id FROM role WHERE role.role = 'unregistered'));\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log("\tdatabase.js: Stored Procedure create_unregistered_user created successfully");
		}
	});

	// register a user with a reservation by email
	sql =
		"CREATE PROCEDURE IF NOT EXISTS `update_unregistered_user_by_email`(\n" +
		"IN FirstName VARCHAR(50), \n" +
		"IN LastName VARCHAR(50), \n" +
		"IN MilitaryRank VARCHAR(50), \n" +
		"IN MilitaryAffiliation VARCHAR(50), \n" +
		"IN PermanentChangeOfStation BOOL, \n" +
		"IN Email VARCHAR(255), \n" +
		"IN Phone VARCHAR(15), \n" +
		"IN Salt VARCHAR(255),\n" +
		"IN HashedPassword VARCHAR(255) \n" +
		")\n" +
		"BEGIN\n" +
		"UPDATE user\n" +
		"SET first_name = FirstName, last_name = LastName, military_rank = MilitaryRank,\n" +
		"military_affiliation = MilitaryAffiliation, permanent_change_of_station = PermanentChangeOfStation,\n" +
		"phone = Phone, salt = Salt, hashed_password = HashedPassword,\n" +
		"role_id = (SELECT role_id FROM role WHERE role.role = 'customer')\n" +
		"WHERE user.email = Email  \n" +
		"AND user.role_id = (SELECT role_id FROM role WHERE role.role = 'unregistered');\n" +
		"END;";
	con.query(sql, function (err, results, fields) {
		if (err) {
			console.log(err.message);
			throw err;
		} else {
			console.log(
				"\tdatabase.js: Stored Procedure update_unregistered_user_by_email created successfully"
			);
		}
	});
}
//#endregion

//#region Add Table Data
async function addTableData() {
	if (!(await DatabaseHasBeenSeeded())) {
		let userCreatedSuccessfully = await CreateUser(
			"Jane",
			"Doe",
			"Marines",
			"E-8",
			false,
			"jane.doe@us.af.mil",
			"8015559323",
			"dc1998bcdb6320dc",
			"518210a7b7adc34a3aac2d440bb3a2796a07e3bcc918783559528b44ca5ab26a"
		);
		if (userCreatedSuccessfully) {
			console.log("User created successfully with CreateUser()!");
		} else {
			console.log("Uh oh. Failed to create user with CreateUser() function call.");
		}

		userCreatedSuccessfully = await CreateUser(
			"John",
			"Doe",
			"Army",
			"E-4",
			false,
			"john.doe@us.af.mil",
			"8015559312",
			"dc1998bcdb6320dc",
			"518210a7b7adc34a3aac2d440bb3a2796a07e3bcc918783559528b44ca5ab26a"
		);
		if (userCreatedSuccessfully) {
			console.log("User created successfully with CreateUser()!");
		} else {
			console.log("Uh oh. Failed to create user with CreateUser() function call.");
		}

		userCreatedSuccessfully = await CreateUser(
			"admin",
			"admin",
			"admin",
			"admin",
			false,
			"admin@admin",
			"8015555555",
			"aa973db842b4b6aa",
			"e1223c88d6afb93acbc169eda1ebc184edfa0a0b0d06430347761819f01aa78b"
		);
		if (userCreatedSuccessfully) {
			console.log("User created successfully with CreateUser()!");
		} else {
			console.log("Uh oh. Failed to create user with CreateUser() function call.");
		}

		sql = "CALL change_user_role('admin@admin', 'admin')";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: changed admin@admin to admin user role");
		});

		// add site types to database
		sql = "CALL insert_site_type('Camp Trailer')";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: Camp Trailer site added to database");
		});

		sql = "CALL insert_site_type('Motor Home')";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: Motor Home site added to database");
		});

		sql = "CALL insert_site_type('Dry')";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: dry site added to database");
		});

		sql = "CALL insert_site_type('Tent')";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: tent site added to database");
		});

		sql = "CALL insert_site_type('Storage')";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: storage site added to database");
		});

		sql = "CALL insert_site_type('Trailer Provided')";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: trailer provided site added to database");
		});

		// add rates to database
		let rateInsertedSuccessfully = await InsertRate(30, "Trailer Provided");
		if (rateInsertedSuccessfully) {
			console.log("database.js: $30 rate for Trailer Provided added to database");
		} else {
			console.log("Uh oh. Failed to insert rate with InsertRate() function call.");
		}

		rateInsertedSuccessfully = await InsertRate(25, "Camp Trailer");
		if (rateInsertedSuccessfully) {
			console.log("database.js: $25 rate for Camp Trailer added to database");
		} else {
			console.log("Uh oh. Failed to insert rate with InsertRate() function call.");
		}

		rateInsertedSuccessfully = await InsertRate(25, "Motor Home");
		if (rateInsertedSuccessfully) {
			console.log("database.js: $25 rate for Motor Home added to database");
		} else {
			console.log("Uh oh. Failed to insert rate with InsertRate() function call.");
		}

		rateInsertedSuccessfully = await InsertRate(17, "Dry");
		if (rateInsertedSuccessfully) {
			console.log("database.js: $17 rate for Dry added to database");
		} else {
			console.log("Uh oh. Failed to insert rate with InsertRate() function call.");
		}

		rateInsertedSuccessfully = await InsertRate(17, "Tent");
		if (rateInsertedSuccessfully) {
			console.log("database.js: $17 rate for Tent added to database");
		} else {
			console.log("Uh oh. Failed to insert rate with InsertRate() function call.");
		}

		rateInsertedSuccessfully = await InsertRate(5, "Storage");
		if (rateInsertedSuccessfully) {
			console.log("database.js: $5 rate for Storage added to database");
		} else {
			console.log("Uh oh. Failed to insert rate with InsertRate() function call.");
		}

		// Add sites to database
		sql = "CALL insert_site(1, 'Site 1', 55)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 1 added to database");
		});

		sql = "CALL insert_site(1, 'Site 2', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 2 added to database");
		});

		sql = "CALL insert_site(1, 'Site 3', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 3 added to database");
		});

		sql = "CALL insert_site(1, 'Site 4', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 4 added to database");
		});

		sql = "CALL insert_site(1, 'Site 5', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 5 added to database");
		});

		sql = "CALL insert_site(1, 'Site 6', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 6 added to database");
		});

		sql = "CALL insert_site(1, 'Site 7', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 7 added to database");
		});

		sql = "CALL insert_site(1, 'Site 8', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 8 added to database");
		});

		sql = "CALL insert_site(1, 'Site 9', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 9 added to database");
		});

		sql = "CALL insert_site(1, 'Site 10', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 10 added to database");
		});

		sql = "CALL insert_site(1, 'Site 11', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 11 added to database");
		});

		sql = "CALL insert_site(6, 'Site 11B', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 11B added to database");
		});

		sql = "CALL insert_site(1, 'Site 12', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 12 added to database");
		});

		sql = "CALL insert_site(6, 'Site 12B', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 12B added to database");
		});

		sql = "CALL insert_site(1, 'Site 13', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 13 added to database");
		});

		sql = "CALL insert_site(1, 'Site 14', 42)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 14 added to database");
		});

		sql = "CALL insert_site(1, 'Site 17', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 17 added to database");
		});

		sql = "CALL insert_site(1, 'Site 18', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 18 added to database");
		});

		sql = "CALL insert_site(1, 'Site 19', 55)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 19 added to database");
		});

		sql = "CALL insert_site(1, 'Site 20', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 20 added to database");
		});

		sql = "CALL insert_site(1, 'Site 21', 55)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 21 added to database");
		});

		sql = "CALL insert_site(1, 'Site 22', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 22 added to database");
		});

		sql = "CALL insert_site(1, 'Site 23', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 23 added to database");
		});

		sql = "CALL insert_site(1, 'Site 24', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 24 added to database");
		});

		sql = "CALL insert_site(1, 'Site 25', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 25 added to database");
		});

		sql = "CALL insert_site(1, 'Site 26', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 26 added to database");
		});

		sql = "CALL insert_site(1, 'Site 27', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 27 added to database");
		});

		sql = "CALL insert_site(1, 'Site 28', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 28 added to database");
		});

		sql = "CALL insert_site(1, 'Site 29', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 29 added to database");
		});

		sql = "CALL insert_site(1, 'Site 30', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 30 added to database");
		});

		sql = "CALL insert_site(1, 'Site 31', 45)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 31 added to database");
		});

		sql = "CALL insert_site(2, 'Site 32', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 32 added to database");
		});

		sql = "CALL insert_site(2, 'Site 33', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 33 added to database");
		});

		sql = "CALL insert_site(2, 'Site 34', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 34 added to database");
		});

		sql = "CALL insert_site(2, 'Site 35', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 35 added to database");
		});

		sql = "CALL insert_site(2, 'Site 36', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 36 added to database");
		});

		sql = "CALL insert_site(2, 'Site 37', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 37 added to database");
		});

		sql = "CALL insert_site(2, 'Site 38', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 38 added to database");
		});

		sql = "CALL insert_site(2, 'Site 39', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 39 added to database");
		});

		sql = "CALL insert_site(2, 'Site 40', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 40 added to database");
		});

		sql = "CALL insert_site(2, 'Site 41', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 41 added to database");
		});

		sql = "CALL insert_site(2, 'Site 42', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 42 added to database");
		});

		sql = "CALL insert_site(2, 'Site 43', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 43 added to database");
		});

		sql = "CALL insert_site(2, 'Site 44', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 44 added to database");
		});

		sql = "CALL insert_site(2, 'Site 45', 65)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site 45 added to database");
		});

		sql = "CALL insert_site(3, 'Dry A', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Dry A added to database");
		});

		sql = "CALL insert_site(3, 'Dry B', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Dry B added to database");
		});

		sql = "CALL insert_site(3, 'Dry C', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Dry C added to database");
		});

		sql = "CALL insert_site(3, 'Dry D', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Dry D added to database");
		});

		sql = "CALL insert_site(4, 'Tent 1', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Tent 1 added to database");
		});

		sql = "CALL insert_site(5, 'Storage 1', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Storage 1 added to database");
		});

		sql = "CALL insert_site(5, 'Storage 2', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Storage 2 added to database");
		});

		sql = "CALL insert_site(5, 'Storage 3', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Storage 3 added to database");
		});

		sql = "CALL insert_site(5, 'Storage 4', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Storage 4 added to database");
		});

		sql = "CALL insert_site(5, 'Storage 5', NULL)";
		con.query(sql, function (err, rows) {
			if (err) {
				console.log(err.message);
				throw err;
			}
			console.log("database.js: site Storage 5 added to database");
		});
		//*****DUMMY RESERVATION DATA***** */
		let paymentId = await CreatePayment("1", "1", "30", "Success");
		let reservationId = await CreateReservation(
			new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split("T")[0],
			new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
			"1",
			paymentId,
			"reserved",
			"30"
		);
		let reservationDetailsId = await CreateReservationDetails(reservationId, "1");
		if (reservationDetailsId) {
			console.log("database.js: added dummy reservation data");
		}

		//new reservation
		paymentId = await CreatePayment("1", "2", "30", "Success");
		reservationId = await CreateReservation(
			new Date().toISOString().split("T")[0],
			new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
			"1",
			paymentId,
			"reserved",
			"30"
		);
		reservationDetailsId = await CreateReservationDetails(reservationId, "2");
		if (reservationDetailsId) {
			console.log("database.js: added dummy reservation data");
		}

		//new reservation
		paymentId = await CreatePayment("2", "4", "30", "Success");
		reservationId = await CreateReservation(
			new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
			new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0],
			"2",
			paymentId,
			"reserved",
			"30"
		);
		reservationDetailsId = await CreateReservationDetails(reservationId, "3");
		if (reservationDetailsId) {
			console.log("database.js: added dummy reservation data");
		}

		//new reservation
		paymentId = await CreatePayment("2", "3", "30", "Success");
		reservationId = await CreateReservation(
			new Date(new Date().setDate(new Date().getDate() - 6)).toISOString().split("T")[0],
			new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0],
			"2",
			paymentId,
			"reserved",
			"30"
		);
		reservationDetailsId = await CreateReservationDetails(reservationId, "3");
		if (reservationDetailsId) {
			console.log("database.js: added dummy reservation data");
		}
		let created = await CreateFileType("jpg");
		if (!created) {
			console.log("\n\tERROR creating file type");
		}
		created = await CreateFileType("jpeg");
		if (!created) {
			console.log("\n\tERROR creating file type");
		}
		created = await CreateFileType("pdf");
		if (!created) {
			console.log("\n\tERROR creating file type");
		}
		created = await CreateFileType("png");
		if (!created) {
			console.log("\n\tERROR creating file type");
		}
	} else {
		console.log("Database has already been seeded. No table data added");
	}
}
//#endregion

/**
 * Used to check if database has been seeded. No need to insert duplicate seed data
 * @returns
 */
function DatabaseHasBeenSeeded() {
	let sql = "SELECT COUNT(*) as count FROM user";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0].count);
		});
	});
}

//#region Database Creation helpers
/**
 * Inserts a role into the role table
 * @param {string} role
 * @returns
 */
function CreateRole(role) {
	let sql = "CALL create_role('" + role + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				// if there is an error, reject the error
				console.log(err.message);
				reject(err);
			}
			// otherwise, return true
			resolve(true);
		});
	});
}

//#endregion

//#region module.export functions

/**
 * This calls the create_user stored procedure with the following parameters:
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} militaryRank
 * @param {string} militaryAffiliation
 * @param {string} permanentChangeOfStation
 * @param {string} email
 * @param {string} phone
 * @param {string} salt
 * @param {string} hashedPassword
 * @returns TRUE if user created successfully.
 */
function CreateUser(
	firstName,
	lastName,
	militaryAffiliation,
	militaryRank,
	permanentChangeOfStation,
	email,
	phone,
	salt,
	hashedPassword
) {
	if (permanentChangeOfStation == false) {
		permanentChangeOfStation = 0;
	} else {
		permanentChangeOfStation = 1;
	}
	let sql =
		"CALL create_user('" +
		firstName +
		"', '" +
		lastName +
		"', '" +
		militaryAffiliation +
		"', '" +
		militaryRank +
		"', '" +
		permanentChangeOfStation +
		"', '" +
		email +
		"', '" +
		phone +
		"', '" +
		salt +
		"', '" +
		hashedPassword +
		"')";
	return new Promise((resolve, reject) => {
		con.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error.message);
				reject(false);
			}
			console.log("\tdatabase.js: CALL create_user to create user " + firstName + " " + lastName);
			resolve(true);
		});
	});
}

/**
 * Inserts a rate into the rate table
 * @param {decimal(4,2)} new_rate
 * @param {string} site_type
 * @returns
 */
function InsertRate(new_rate, site_type) {
	let sql = "CALL insert_rate('" + new_rate + "', '" + site_type + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				// if there is an error, reject the error
				console.log(err.message);
				reject(err);
			}
			// otherwise, return true
			resolve(true);
		});
	});
}

/**
 * Updates the end date for a rate in the rate table
 * @param {string} end_date
 * @returns
 */
function UpdateRateEndDate(end_date) {
	let sql = "CALL update_rate_end_date('" + end_date + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				// if there is an error, reject the error
				console.log(err.message);
				reject(err);
			}
			// otherwise, return true
			resolve(true);
		});
	});
}

/**
 * Returns the salt associated with User having given email
 * @param {string} email
 * @returns
 */
function GetUserSalt(email) {
	let sql = "CALL get_salt('" + email + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				// if there is an error, reject the error
				console.log(err.message);
				reject(err);
			}
			// otherwise, return result
			resolve(results[0][0]);
		});
	});
}

/**
 * Returns the role associated with User having given email and hashed_password
 * @param {string} email
 * @param {string} hashed_password
 * @returns
 */
function CheckUserCredentials(email, hashed_password) {
	let sql = "CALL check_credentials('" + email + "', '" + hashed_password + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				// if there is an error, reject the error
				console.log(err.message);
				reject(err);
			}
			// otherwise, return result
			console.log(results);
			resolve(results[0][0]);
		});
	});
}

/**
 * Returns sites available for reservation between the given dates
 * @param {Date} start_date
 * @param {Date} end_date
 * @param {int} length
 * @returns table with columns: site_name, site_type, site_length_in_feet, rate, site_id
 */
function GetAvailableSites(start_date, end_date, length) {
	let sql = "CALL get_available_sites('" + start_date + "', '" + end_date + "', '" + length + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0]);
		});
	});
}

/**
 * Get a single site by site id.
 * @param {int} id
 * @returns single site with fields site_name, site_type, site_length_in_feet, rate
 */
function GetSiteById(id) {
	let sql = "CALL get_site_by_id('" + id + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0][0]);
		});
	});
}

/**
 * Creates a payment object using the following parameters
 * @param {int} userId
 * @param {string} stripeTransactionId
 * @param {double} paymentAmount
 * @param {string} paymentStatus
 * @returns paymentId integer if created successfully
 */
function CreatePayment(userId, stripeTransactionId, paymentAmount, paymentStatus) {
	var todaysDateObject = new Date();
	var formattedDateString =
		todaysDateObject.getFullYear() +
		"-" +
		(todaysDateObject.getMonth() + 1) +
		"-" +
		todaysDateObject.getDate() +
		" " +
		todaysDateObject.getHours() +
		":" +
		todaysDateObject.getMinutes() +
		":" +
		todaysDateObject.getSeconds();
	let sql =
		"SET @out = -1;\n" +
		"CALL create_payment('" +
		userId +
		"', '" +
		stripeTransactionId +
		"', '" +
		formattedDateString +
		"', '" +
		paymentAmount +
		"', '" +
		paymentStatus +
		"', @out);\n" +
		"SELECT @out;";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			console.log(results);
			resolve(results[2][0]["@out"]);
		});
	});
}

/**
 * Get users id by email. If -1 returned, user does not exist in database
 * @param {string} email
 * @returns user_id int or -1 if not found
 */
function GetUserIdByEmail(email) {
	let sql = "CALL get_user_id_by_email('" + email + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			if (results[0].length > 0) {
				resolve(results[0][0].user_id);
			} else {
				resolve(-1);
			}
		});
	});
}

/**
 * Create a reservation
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {int} userId
 * @param {int} paymentId
 * @param {string} reservationStatus
 * @param {double} totalCost
 * @returns reservation_id int
 */
function CreateReservation(startDate, endDate, userId, paymentId, reservationStatus, totalCost) {
	var startDateObject = new Date(startDate);
	var startDateFormattedDateString =
		startDateObject.getFullYear() +
		"-" +
		(startDateObject.getMonth() + 1) +
		"-" +
		startDateObject.getDate() +
		" " +
		startDateObject.getHours() +
		":" +
		startDateObject.getMinutes() +
		":" +
		startDateObject.getSeconds();
	var endDateObject = new Date(endDate);
	var endDateFormattedDateString =
		endDateObject.getFullYear() +
		"-" +
		(endDateObject.getMonth() + 1) +
		"-" +
		endDateObject.getDate() +
		" " +
		endDateObject.getHours() +
		":" +
		endDateObject.getMinutes() +
		":" +
		endDateObject.getSeconds();
	let sql =
		"SET @out = -1;\n" +
		"CALL create_reservation('" +
		startDateFormattedDateString +
		"', '" +
		endDateFormattedDateString +
		"', '" +
		userId +
		"', '" +
		paymentId +
		"', '" +
		reservationStatus +
		"', '" +
		totalCost +
		"', @out);\n" +
		"SELECT @out;";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[2][0]["@out"]);
		});
	});
}

/**
 * Create reservation details
 * @param {int} reservationId
 * @param {int} siteId
 * @returns true if succeeded
 */
function CreateReservationDetails(reservationId, siteId) {
	let sql = "CALL create_reservation_details('" + reservationId + "', '" + siteId + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(true);
		});
	});
}

/**
 * Returns a list of reservations and associated data for a particular email
 * @param {string} email
 * @returns
 */
function GetReservationsByEmail(email) {
	let sql = "CALL get_reservations_by_email('" + email + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0]);
		});
	});
}

function GetReservationsByStartDate(date) {
	let sql = "CALL get_reservations_by_start_date('" + date + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0]);
		});
	});
}

function GetReservationsByEndDate(date) {
	let sql = "CALL get_reservations_by_end_date('" + date + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0]);
		});
	});
}

function GetReservationsByFromAndToDate(from, to) {
	let sql = "CALL get_reservations_by_from_and_to_date('" + from + "', '" + to + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0]);
		});
	});
}

/**
 * Get a single reservation by reservation id.
 * @param {int} id
 * @returns single reservation with fields
 * 		reservation_id, start_date, end_date, user_id, payment_id, reservation_status, total_cost
 */
function GetReservationById(id) {
	let sql = "CALL get_reservation_by_id('" + id + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0][0]);
		});
	});
}

/**
 * Get user data by their email
 * @param {*} email
 * @returns object{first_name, last_name, military_rank, military_affiliation, permanent_change_of_station, salt}
 */
function GetUserDataByEmail(email) {
	let sql = "CALL get_user_data_by_email('" + email + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			if (results[0].length > 0) {
				resolve(results[0][0]);
			} else {
				resolve(-1);
			}
		});
	});
}

/**
 * Updates users hashed password by their email
 * @param {*} email
 * @param {*} hashedPassword
 * @returns true if successful, otherwise false
 */
function UpdateUserHashedPasswordByEmail(email, hashedPassword) {
	let sql = "CALL update_user_hashed_password_by_email('" + email + "', '" + hashedPassword + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(false);
			}
			resolve(true);
		});
	});
}

/**
 * Checks if hashed password provided is hashed password associated with email in database
 * @param {*} email
 * @param {*} hashedPassword
 * @returns true if match, otherwise false
 */
function CheckHashedPasswordByEmail(email, hashedPassword) {
	let sql = "SELECT hashed_password from user WHERE user.email = '" + email + "'";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			if (results[0].hashed_password == hashedPassword) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
}

/**
 * Create a user document
 * @param {*} userId
 * @param {*} filename
 * @param {*} uploadDate
 * @returns true if successful, otherwise false
 */
async function CreateUserDocument(userId, filename) {
	let extension = filename.split(".").slice(-1);
	let allowedFileTypeId = await GetFileTypeIdByFileName(extension);
	var uploadDateObject = new Date();
	var uploadDateFormattedString =
		uploadDateObject.getFullYear() +
		"-" +
		(uploadDateObject.getMonth() + 1) +
		"-" +
		uploadDateObject.getDate() +
		" " +
		uploadDateObject.getHours() +
		":" +
		uploadDateObject.getMinutes() +
		":" +
		uploadDateObject.getSeconds();
	let sql =
		"CALL create_user_document('" +
		allowedFileTypeId +
		"', '" +
		userId +
		"', '" +
		filename +
		"', '" +
		uploadDateFormattedString +
		"')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(false);
			}
			resolve(true);
		});
	});
}

/**
 * Creates an allowed file type in the database
 * @param {*} fileType
 * @returns
 */
function CreateFileType(fileType) {
	let sql = "CALL create_allowed_file_type('" + fileType + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(false);
			}
			resolve(true);
		});
	});
}

/**
 * Get the file type id of the requested file type
 * @param {*} filetype
 * @returns file type id
 */
function GetFileTypeIdByFileName(filetype) {
	let sql = "CALL get_allowed_file_type_id_by_file_name('" + filetype + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			resolve(results[0][0].file_type_id);
		});
	});
}

/**
 * Get a document associated with a user by email
 * @param {*} email
 * @returns filename of the document if exists, null if not
 */
function GetUserDocumentByEmail(email) {
	let sql = "CALL get_user_document_by_email('" + email + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			if (results[0].length === 0) {
				resolve(null);
			} else {
				resolve(results[0][0].filename);
			}
		});
	});
}

/**
 * Delete a user document by its filename
 * @param {*} filename
 * @returns true if delete successful, otherwise false
 */
function DeleteUserDocByFileName(filename) {
	let sql = "CALL delete_user_doc_by_file_name('" + filename + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(false);
			}
			resolve(true);
		});
	});
}

/**
 * Update user pcs status when uploading pcs documents
 * @param {*} pcsStatus
 * @param {*} email
 * @returns
 */
function UpdateUserPcsStatusByEmail(pcsStatus, email) {
	let sql = "CALL update_user_pcs_status_by_email('" + pcsStatus + "', '" + email + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(false);
			}
			resolve(true);
		});
	});
}

/**
 * Checks for invalid dates
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {String} userEmail
 * @returns false if dates are invalid, otherwise true
 */
async function ValidateDates(startDate, endDate, userEmail) {
	let date = new Date();
	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	let day = date.getDate();
	if (month < 10) {
		month = "0" + month;
	}
	if (day < 10) {
		day = "0" + day;
	}
	let today = [year, month, day].join("-");
	today = new Date(today + "T00:00:00");
	date.setDate(date.getDate() + 1);
	year = date.getFullYear();
	month = date.getMonth() + 1;
	day = date.getDate();
	if (month < 10) {
		month = "0" + month;
	}
	if (day < 10) {
		day = "0" + day;
	}
	let tomorrow = [year, month, day].join("-");
	tomorrow = new Date(tomorrow + "T00:00:00");
	date.setMonth(date.getMonth() + 6);
	year = date.getFullYear();
	month = date.getMonth() + 1;
	day = date.getDate();
	if (month < 10) {
		month = "0" + month;
	}
	if (day < 10) {
		day = "0" + day;
	}
	let sixMonths2 = [year, month, day].join("-");
	sixMonths2 = new Date(sixMonths2 + "T00:00:00");
	date.setDate(date.getDate() - 1);
	year = date.getFullYear();
	month = date.getMonth() + 1;
	day = date.getDate();
	if (month < 10) {
		month = "0" + month;
	}
	if (day < 10) {
		day = "0" + day;
	}
	let sixMonths1 = [year, month, day].join("-");
	sixMonths1 = new Date(sixMonths1 + "T00:00:00");
	let startMonth = startDate.getMonth();
	let endMonth = endDate.getMonth();
	let userPCS = await GetUserDataByEmail(userEmail);
	userPCS = userPCS["permanent_change_of_station"];
	let totalDaysThisRes = 0;
	let totalDaysAllRes = 0;
	let lastDate = new Date('2000-01-01' + "T00:00:00");
	if (!userPCS) {
		totalDaysThisRes = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
		totalDaysAllRes = totalDaysThisRes;
		let userReservations = await GetReservationsByEmail(userEmail);
		for (res of userReservations) {
			if (res["reservation_status"] == "reserved") {
				totalDaysAllRes += (res["end_date"].getTime() - res["start_date"].getTime()) / (1000 * 3600 * 24);
				if (res["end_date"] > lastDate) {
					lastDate = res["end_date"];
				}
			}
		}
	}
	let daysBetweenRes = (startDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
	if (
		endDate <= startDate ||
		startDate < today ||
		endDate < tomorrow ||
		startDate > sixMonths1 ||
		endDate > sixMonths2 ||
		(totalDaysThisRes > 14 && ((startMonth > 2 && startMonth < 9) || (endMonth > 2 && endMonth < 9))) ||
		(totalDaysAllRes > 14 && ((startMonth > 2 && startMonth < 9) || (endMonth > 2 && endMonth < 9)) && daysBetweenRes < 14)
	) {
		return false;
	}
	return true;
}

/**
 * Get the rate of a reserved site by reservation ID
 * @param {*} reservationId
 * @returns filename of the document if exists, null if not
 */
function GetSiteRateByReservationId(reservationId) {
	let sql = "CALL get_site_rate_by_reservation_id('" + reservationId + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				console.log(err.message);
				reject(err);
			}
			//return result
			resolve(results[0][0].rate);
		});
	});
}

/**
 * Updates the status of a reservation in the reservation table
 * @param {int} reservationId
 * @param {string} status
 * @returns true if successful
 */
function UpdateReservationStatus(reservationId, status) {
	let sql = "CALL update_reservation_status('" + reservationId + "', '" + status + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				// if there is an error, reject the error
				console.log(err.message);
				reject(err);
			}
			// otherwise, return true
			resolve(true);
		});
	});
}

/**
 * Updates the notes of a reservation in the reservation table
 * @param {int} reservationId
 * @param {string} notes
 * @returns true if successful
 */
function UpdateReservationNotes(reservationId, notes) {
	let sql = "CALL update_reservation_notes('" + reservationId + "', '" + notes + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (err, results, fields) => {
			if (err) {
				// if there is an error, reject the error
				console.log(err.message);
				reject(err);
			}
			// otherwise, return true
			resolve(true);
		});
	});
}

/**
 * method used to create a user that has not set up their account but has a reservation made by an admin
 * @param {string} email
 * @param {string} securityCode
 * @returns true if created successfully, false otherwise
 */
function CreateUnregisteredUser(email, firstName, lastName) {
	let sql =
		"CALL create_unregistered_user('" + email + "', '" + firstName + "', '" + lastName + "')";
	return new Promise((resolve, reject) => {
		con.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error.message);
				reject(false);
			}
			resolve(true);
		});
	});
}

/**
 * Used to update a users account that has a reservation but has not registered ('unregistered')
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} militaryAffiliation
 * @param {string} militaryRank
 * @param {bool} permanentChangeOfStation
 * @param {string} email
 * @param {string} phone
 * @param {string} salt
 * @param {string} hashedPassword
 * @returns
 */
function UpdateUnregisteredUserByEmail(
	firstName,
	lastName,
	militaryAffiliation,
	militaryRank,
	permanentChangeOfStation,
	email,
	phone,
	salt,
	hashedPassword
) {
	if (permanentChangeOfStation == false) {
		permanentChangeOfStation = 0;
	} else {
		permanentChangeOfStation = 1;
	}
	let sql =
		"CALL update_unregistered_user_by_email('" +
		firstName +
		"', '" +
		lastName +
		"', '" +
		militaryAffiliation +
		"', '" +
		militaryRank +
		"', '" +
		permanentChangeOfStation +
		"', '" +
		email +
		"', '" +
		phone +
		"', '" +
		salt +
		"', '" +
		hashedPassword +
		"')";
	return new Promise((resolve, reject) => {
		con.query(sql, (error, results, fields) => {
			if (error) {
				console.log(error.message);
				reject(false);
			}
			resolve(true);
		});
	});
}
//#endregion

module.exports = {
	con,
	CreateUser,
	InsertRate,
	UpdateRateEndDate,
	GetUserSalt,
	CheckUserCredentials,
	GetAvailableSites,
	GetSiteById,
	CreatePayment,
	GetUserIdByEmail,
	CreateReservation,
	CreateReservationDetails,
	GetReservationsByEmail,
	GetReservationsByStartDate,
	GetReservationsByEndDate,
	GetReservationsByFromAndToDate,
	GetReservationById,
	GetUserDataByEmail,
	UpdateUserHashedPasswordByEmail,
	CheckHashedPasswordByEmail,
	CreateUserDocument,
	GetUserDocumentByEmail,
	DeleteUserDocByFileName,
	UpdateUserPcsStatusByEmail,
	ValidateDates,
	GetSiteRateByReservationId,
	UpdateReservationStatus,
	UpdateReservationNotes,
	CreateUnregisteredUser,
	UpdateUnregisteredUserByEmail,
};
