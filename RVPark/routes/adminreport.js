var express = require("express");
var router = express.Router();
var dbCon = require('../lib/database');

/* GET adminreport page. */
router.get("/", async function (req, res, next) {
    var dateTo = req.body.dateTo;
    var dateFrom = req.body.dateFrom;
	const reservations = await dbCon.GetReservationsByFromAndToDate(dateFrom, dateTo);
	res.render("adminreport", {
		dateTo : dateTo,
        dateFrom : dateFrom,
        reservations : reservations
	});
});

/* POST adminreport page. */
router.post("/", async function(req, res, next) {
	const today = req.body.today;
	const arrivals = await dbCon.GetReservationsByStartDate(today);
	const departures = await dbCon.GetReservationsByEndDate(today);
	res.render("adminreport", {
		today : today,
		arrivals : arrivals,
		departures : departures
	});
});

module.exports = router;