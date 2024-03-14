var express = require("express");
var router = express.Router();
var db = require("../lib/database");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
var multer = require("multer");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, "../public/pcs"));
	},
	filename: async function (req, file, cb) {
		let userData = await db.GetUserDataByEmail(req.session.email);
		const uniqueSuffix = uuidv4();
		cb(
			null,
			userData.first_name +
				"-" +
				userData.last_name +
				"-pcs-documentation-" +
				uniqueSuffix +
				"." +
				file.originalname.split(".").slice(-1)
		);
	},
});
const upload = multer({ storage: storage });

router.post("/", upload.single("pcsFile"), async (req, res, next) => {
	console.log(req.file, req.body);
	// create user_document 
	let userId = await db.GetUserIdByEmail(req.session.email);
	let documentCreatedSuccessfully = await db.CreateUserDocument(userId, req.file.filename);
	let updatePcsStatus = await db.UpdateUserPcsStatusByEmail(1, req.session.email); 
	res.redirect("account");
});

module.exports = router;
