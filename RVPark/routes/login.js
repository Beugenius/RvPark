var express = require("express");
var router = express.Router();
var dbCon = require('../lib/database');

var CryptoJS = require('crypto-js');

/* GET login page. */
router.get("/", function (req, res, next) {
	console.log("login.js: GET");
	res.render("login", {});
});

/* POST page. */
router.post('/', async function(req, res, next) {
	console.log("login.js: POST");
	const email = req.body.email;
	const password = req.body.password;
	//Get salt associated with user
	var result = await dbCon.GetUserSalt(email);
	if(result) { //salt found
		req.session.email = email;
		req.session.salt = result.salt;
		var hashed_password = CryptoJS.SHA256(password + ":" + result.salt).toString(CryptoJS.enc.Hex);
		result = await dbCon.CheckUserCredentials(email, hashed_password);
		if(result){ //password correct
			console.log("login.js: Credentials matched");
			req.session.loggedIn = true;
			console.log("Logged in a " + result.role + " user");
			req.session.role = result.role
			req.session.save((err) => {
                if(err) {
                    throw err; 
                }
				if(result.role == "admin")
				{
					res.redirect("/admindashboard");
				}
				else
				{
					res.redirect("/availability");
				}
            });
		}
		else //password incorrect
		{
			console.log("login.js: No login credentials found");
			res.render('login', {message: "Password not valid for user '" + email + "'.  Please log in again."});
		}
	}
	else //no salt found
	{
		console.log("login: No results found");
		res.render('login', {message: "Email '" + email + "' not found"});
	}
});

module.exports = router;