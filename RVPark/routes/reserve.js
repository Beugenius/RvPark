var express = require("express");
var router = express.Router();
var db = require("../lib/database");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

/* GET reserve page. */
router.get("/", function (req, res, next) {
	//res.render("reserve", {});
});

/* POST reserve page. */
router.post("/", async (req, res, next) => {
	const isPayment = req.body.isPayment == "true";
	const siteId = req.body.siteId;
	const adminIsMakingReservation = req.session.role == "admin";
	// if we are making a payment
	if (isPayment) {
		let email = "";
		let stripeTransactionId = uuidv4();
		let userId = "";
		let userData = "";
		let customerDoesNotHaveAccount = false;
		console.log(adminIsMakingReservation)
		if (adminIsMakingReservation) {
			email = req.body.email;
			// check to see if cash or nah
			const isCash = req.body.cashOrCredit == "2";
			if (isCash) {
				stripeTransactionId = "na-cash-payment";
			}
			let userData = await db.GetUserDataByEmail(email);
			console.log("USER DATA: ");
			console.log(userData);
			if (userData == -1) {
				customerDoesNotHaveAccount = await db.CreateUnregisteredUser(email, req.body.firstName, req.body.lastName);
			}
			userId = await db.GetUserIdByEmail(email);
		} else {
			email = req.session.email;
			userId = await db.GetUserIdByEmail(email);
			userData = await db.GetUserDataByEmail(email);
		}
		// In the future this will reach out to Stripe
		const paymentAmount = req.body.totalCost;
		const paymentStatus = "Payment processed successfully!";
		const startDate = req.body.startDate;
		const endDate = req.body.endDate;
		const siteName = req.body.siteName;
		// Create payment object
		let paymentId = await db.CreatePayment(
			userId,
			stripeTransactionId,
			paymentAmount,
			paymentStatus
		);
		// create reservation
		let reservationId = await db.CreateReservation(
			startDate,
			endDate,
			userId,
			paymentId,
			"reserved",
			paymentAmount
		);
		const sgMail = require("@sendgrid/mail");
		sgMail.setApiKey(process.env.SENDGRID_API_KEY);
		if (customerDoesNotHaveAccount) {
			let fullName = req.body.firstName + " " + req.body.lastName; 
			const msg = {
				from: "brycehutchinson@mail.weber.edu",
				personalizations: [
					{
						to: [
							{
								email: email,
							},
						],
						dynamic_template_data: {
							full_name: fullName,
							reservation_id: reservationId,
							total_cost: req.body.totalCost,
							total_days: req.body.totalDays,
							site_name: siteName
						},
					},
				],
				template_id: "d-aeef1559aeb74d12af0c5c31a76798e5",
			};
			sgMail
				.send(msg)
				.then(async () => {
					console.log("Email sent");
					let reservationDetails = await db.CreateReservationDetails(reservationId, siteId);
					res.redirect("/admindashboard");
				})
				.catch((error) => {
					console.error(error);
				});
		} else {
			const msg = {
				from: "brycehutchinson@mail.weber.edu",
				personalizations: [
					{
						to: [
							{
								email: req.session.email,
							},
						],
						dynamic_template_data: {
							first_name: userData.first_name,
							last_name: userData.last_name,
							reservation_id: reservationId,
							total_cost: req.body.totalCost,
							total_days: req.body.totalDays,
							site_name: siteName,
						},
					},
				],
				template_id: "d-8fa0942b46314f1d9466342f0c0c8c1a",
			};
			sgMail
				.send(msg)
				.then(async () => {
					console.log("Email sent");
					let reservationDetails = await db.CreateReservationDetails(reservationId, siteId);
					if(adminIsMakingReservation) {
						res.redirect("/admindashboard");
					}else {
						res.redirect("/reservations");
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}
		// return to reservations page on success
	} else if (siteId) {
		// otherwise we are being routed here from availability page
		if (req.session.loggedIn == true) {
			let site = await db.GetSiteById(siteId);
			let startDate = new Date(req.body.startDate + "T00:00:00");
			let endDate = new Date(req.body.endDate + "T00:00:00");
			let datesValid = await db.ValidateDates(startDate, endDate, req.session.email);
			let totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
			let totalCost = site.rate * totalDays;
			let formattedStartDate = startDate.toLocaleString("default", {
				year: "numeric",
				day: "2-digit",
				month: "short",
			});
			let formattedEndDate = endDate.toLocaleString("default", {
				year: "numeric",
				day: "2-digit",
				month: "short",
			});
			let role = req.session.role;
			let todaysDateString =
				new Date().getFullYear().toString() + "-" + (new Date().getMonth() + 1).toString();
			res.render("reserve", {
				site,
				startDate,
				endDate,
				totalCost,
				formattedStartDate,
				formattedEndDate,
				role,
				todaysDateString,
				datesValid,
				totalDays,
			});
		} else {
			res.redirect("/login");
		}
	} else {
		// something went wrong
		console.log("Something went wrong");
	}
});

module.exports = router;
