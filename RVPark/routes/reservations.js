var express = require("express");
var router = express.Router();
var db = require("../lib/database");

/* GET reservations page. */
router.get("/", async function (req, res, next) {
	if (req.session.loggedIn) {
		let reservations = await db.GetReservationsByEmail(req.session.email);
		res.render("reservations", { reservations });
	} else {
		res.render("login", {});
	}
});

/* POST reservations page. */
router.post("/", async function(req, res, next) {
	const reservation_id = req.body.reservation_id;
	const reservation_status = req.body.reservation_status;
	const reservation_notes = req.body.reservation_notes;
	var reservation = await db.UpdateReservationStatus(reservation_id, reservation_status);
	reservation = await db.UpdateReservationNotes(reservation_id, reservation_notes)
});

module.exports = router;
