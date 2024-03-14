var express = require("express");
var router = express.Router();
var db = require("../lib/database");

/* GET home page. */
router.get("/", async function (req, res, next) {
	//let message = await db.GetExampleMessageById(1);
	//res.render("index", { title: "Hello World!", message: message });
	res.render("index", { title: "Hello World!" });
});

router.get("/logout", function (req, res) {
	req.session.destroy((err) => {
		if (err) {
			throw err;
		}
		res.redirect("/");
	});
});

module.exports = router;
