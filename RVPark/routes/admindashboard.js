var express = require("express");
var router = express.Router();
var dbCon = require('../lib/database');

/* GET admindashboard page. */
router.get("/", async function (req, res, next) {
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
	const today = [year, month, day].join('-');
	const dateFrom = today;
	let weekOut = new Date();
	weekOut.setDate(date.getDate() + 7);
	year = weekOut.getFullYear();
	month = weekOut.getMonth() + 1;
	day = weekOut.getDate();
	if (month < 10) {
		month = "0" + month;
	}
	if (day < 10) {
		day = "0" + day;
	}
	const dateTo = [year, month, day].join('-');
	const arrivals = await dbCon.GetReservationsByStartDate(today);
	const departures = await dbCon.GetReservationsByEndDate(today);
	res.render("admindashboard", {
		today : today,
		arrivals : arrivals,
		departures : departures,
		dateFrom: dateFrom,
		dateTo : dateTo
	});
});

/* POST admindashboard page. */
router.post("/", async function(req, res, next) {
	const reservation_id = req.body.reservation_id;
	const reservation_status = req.body.reservation_status;
	if(req.body._method == "PUT")
	{
		const reservation = await dbCon.UpdateReservationStatus(reservation_id, reservation_status);
		res.redirect("/admindashboard");
	}
	else
	{
		const dateTo = req.body.dateTo;
		const dateFrom = req.body.dateFrom;
		const reservations = await dbCon.GetReservationsByFromAndToDate(dateFrom, dateTo);
		res.render("adminreport", {
			dateTo : dateTo,
			dateFrom : dateFrom,
			reservations : reservations
		});
	}
});

module.exports = router;