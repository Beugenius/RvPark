var express = require("express");
var router = express.Router();
var db = require("../lib/database");
const path = require("path");
var fs = require("fs");

router.post("/", async (req, res, next) => {
	let deleted = await db.DeleteUserDocByFileName(req.body.userDoc);
	if (deleted) {
		fs.unlinkSync(path.join(__dirname, "../public/pcs/" + req.body.userDoc));
        let updatePcsStatus = await db.UpdateUserPcsStatusByEmail(0, req.session.email);
	}
	res.redirect("account");
});

module.exports = router;
