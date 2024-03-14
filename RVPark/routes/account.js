var express = require("express");
var router = express.Router();
var db = require("../lib/database");

/* GET account page. */
router.get("/", async function (req, res, next) {
	if (req.session.loggedIn) {
		let reservations = await db.GetReservationsByEmail(req.session.email);
		let userData = await db.GetUserDataByEmail(req.session.email);
		let userDocument = await db.GetUserDocumentByEmail(req.session.email);
		res.render("account", { reservations, userData, userDocument });
	} else {
		res.redirect("/login");
	}
});

router.post("/", async function (req, res, next) {
	let hash = req.body.hash;
	let currentHash = req.body.currentHash;
	let authenticated = await db.CheckHashedPasswordByEmail(req.session.email, currentHash);
	if (authenticated) {
		let updateSuccessful = await db.UpdateUserHashedPasswordByEmail(req.session.email, hash);
		if (updateSuccessful) {
			// password updated successfully
			let reservations = await db.GetReservationsByEmail(req.session.email);
			let userData = await db.GetUserDataByEmail(req.session.email);
			let passwordChangeMessage = "Password successfully updated!";
			res.render("account", { reservations, userData, passwordChangeMessage });
		} else {
			// error updating password
			let reservations = await db.GetReservationsByEmail(req.session.email);
			let userData = await db.GetUserDataByEmail(req.session.email);
			let passwordChangeMessage = "Error updating password";
			res.render("account", { reservations, userData, passwordChangeMessage });
		}
	} else {
		// incorrect password
		let reservations = await db.GetReservationsByEmail(req.session.email);
		let userData = await db.GetUserDataByEmail(req.session.email);
		let passwordChangeMessage = "Incorrect password";
		res.render("account", { reservations, userData, passwordChangeMessage });
	}
});

module.exports = router;
