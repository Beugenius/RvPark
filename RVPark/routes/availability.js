var express = require("express");
var router = express.Router();
var dbCon = require('../lib/database');

/* GET availability page. */
router.get("/", async function (req, res, next) {
	// get dates for the calendars
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
	const tomorrow = [year, month, day].join('-');
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
	const sixMonths2 = [year, month, day].join('-');
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
	const sixMonths1 = [year, month, day].join('-');
	// get available sites
	const sites = await dbCon.GetAvailableSites(today, tomorrow, "all");
	res.render("availability", {
		start : today,
		end : tomorrow,
		lengthSelect : "all",
		today : today,
		tomorrow : tomorrow,
		sixMonths1 : sixMonths1,
		sixMonths2 : sixMonths2,
		sites : sites
	});
});

/* POST availability page. */
router.post("/", async function(req, res, next) {
	const start = req.body.dateStart;
	const end = req.body.dateEnd;
	const lengthSelect = req.body.lengthSelect;
	const today = req.body.todaysDate;
	const tomorrow = req.body.tomorrowsDate;
	const sixMonths1 = req.body.sixMonths1;
	const sixMonths2 = req.body.sixMonths2;
	const sites = await dbCon.GetAvailableSites(start, end, lengthSelect);
	res.render("availability", {
		start : start,
		end : end,
		lengthSelect : lengthSelect,
		today : today,
		tomorrow : tomorrow,
		sixMonths1 : sixMonths1,
		sixMonths2 : sixMonths2,
		sites : sites
	});
});

module.exports = router;