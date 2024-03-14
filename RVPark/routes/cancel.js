var express = require("express");
var router = express.Router();
var db = require("../lib/database");
const fedHolidays = require("@18f/us-federal-holidays");
const options = { shiftSaturdayHolidays: true, shiftSundayHolidays: true, utc: false};



/* GET cancel page. */
router.get("/", function (req, res, next) {
	//res.render("cancel", {});
});

/* POST reserve page. */
router.post("/", async (req, res, next) => {
	
	const startCancellation = req.body.startCancellation === "true";
	const completeCancellation = req.body.completeCancellation === "true";

	if(startCancellation){
		console.log("*********************************************start cancellation post");
		const reservationId = req.body.reservationId;
		let reservation = await db.GetReservationById(reservationId);
		let startDate = req.body.startDate;
		let endDate = req.body.endDate;
		let siteName = req.body.siteName;
		let amountPaid = reservation.total_cost;
		let cancellationFee = 10;
		
		//cancelation fee one night's reservation cost if canceled within 3 days of reservation
		let currentDate = new Date();
		let siteRate = await db.GetSiteRateByReservationId(reservationId);
		if((reservation.start_date - currentDate) < 3){
			cancellationFee = await db.GetSiteRateByReservationId(reservationId);
		}

		//cancellation fee one night's reservation cost if reserved for holiday
		let dateToCheck = new Date(reservation.start_date);
		const reservationEndDate = new Date(reservation.end_date);
		while(dateToCheck <= reservationEndDate){
			if(fedHolidays.isAHoliday(dateToCheck, options)){
				cancellationFee = await db.GetSiteRateByReservationId(reservationId);
			}
			dateToCheck.setDate(dateToCheck.getDate() + 1);
		}
		
		let refundAmount = amountPaid - cancellationFee;
		res.render("cancel", {
			reservationId,
			reservation,
			startDate,
			endDate,
			siteName,
			amountPaid,
			cancellationFee,
			refundAmount
		});
	}
	else if(completeCancellation){
		const reservationId = req.body.reservationId;
		const refundAmount = req.body.refundAmt;
		//set reservation status to canceled
		let canceled = await db.UpdateReservationStatus(reservationId, "canceled");

		//refund money
		//use Stripe to refund the refundAmount back to the user
		//send confirmation email for refund

		res.redirect("/reservations");
	}

});

module.exports = router;