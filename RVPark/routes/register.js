var express = require("express");
var router = express.Router();

let mysql = require("mysql2");

var dbConnection = require("../lib/database");

/* GET register page. */
router.get("/", function (req, res, next) {
	res.render("register", {});
});

/* POST page. */
router.post("/", async function (req, res, next) {
	console.log("register.js: POST");

	// Get the values from POST from the client
	const firstname = req.body.firstname;
	const lastname = req.body.lastname;
	const phone = req.body.phone;
	const affiliation = req.body.affiliation;
	const rank = req.body.rank;
	const pcs = req.body.pcs;
	const email = req.body.email;
	const salt = req.body.salt;
	const hashedPassword = req.body.hashedPassword;

	console.log("register.js: email: " + email);

	// Check to see if user already exists in the database
	const userData = await dbConnection.GetUserDataByEmail(email);
	const unregisteredUserCredentials = await dbConnection.CheckUserCredentials(email, "unregistered");
	// If the email address is not already in the database, add the user
	if (userData == -1) {
		const userCreated = await dbConnection.CreateUser(
			firstname,
			lastname,
			affiliation,
			rank,
			pcs,
			email,
			phone,
			salt,
			hashedPassword
		);

		if (userCreated) {
			// Set session variables
			req.session.email = email;
			req.session.loggedIn = true;
			req.session.role = "customer";
			req.session.save((err) => {
				if (err) {
					throw err;
				}
				// Redirect to home
				res.redirect("/");
			});
		} else {
			// User creation failed
			console.log("Something went wrong. User was not created.");
		}
	} else if (unregisteredUserCredentials.role == "unregistered") {
		const userUpdated = await dbConnection.UpdateUnregisteredUserByEmail(
			firstname,
			lastname,
			affiliation,
			rank,
			pcs,
			email,
			phone,
			salt,
			hashedPassword
		);

		if (userUpdated) {
			// Set session variables
			req.session.email = email;
			req.session.loggedIn = true;
			req.session.role = "customer";
			req.session.save((err) => {
				if (err) {
					throw err;
				}
				// Redirect to home
				res.redirect("/");
			});
		} else {
			// User creation failed
			console.log("Something went wrong. User was not created.");
		}
	} else {
		// the email entered is already in the database, display error message on register page
		res.render("register", { message: "User with email '" + email + "' already exists." });
	}
});

module.exports = router;
