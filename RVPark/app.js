var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
var MySQLStore = require("express-mysql-session")(session);
require("dotenv").config();

var indexRouter = require("./routes/index");
var loginRouter = require("./routes/login");
var registerRouter = require("./routes/register");
var accountRouter = require("./routes/account");
var availabilityRouter = require("./routes/availability");
var infoRouter = require("./routes/info");
var reserveRouter = require("./routes/reserve");
var cancelRouter = require("./routes/cancel");
var adminDashboardRouter = require("./routes/admindashboard");
var adminReportRouter = require("./routes/adminreport");
var reservationsRouter = require("./routes/reservations");
var uploadRouter = require("./routes/upload");
var deleteUserDocRouter = require("./routes/deleteUserDoc");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
//npm install bootstrap & bootstrap-icons
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap-icons/")));
app.use(express.static(path.join(__dirname, "node_modules/crypto-js/")));
app.use(express.static(path.join(__dirname, "node_modules/uuid/")));
app.use(express.static(path.join(__dirname, "node_modules/@18f/us-federal-holidays/")));


// set up the database
var dbCon = require("./lib/database");
// Session management to store cookies in a mysql server (has bug, so we assist by creating the database for it)
var dbSessionPool = require("./lib/sessionPool");
var sessionStore = new MySQLStore({}, dbSessionPool);
// necessary middleware to store session cookies in mysql
app.use(
	session({
		key: "session_cookie_name",
		secret: "session_cookie_secret1234",
		store: sessionStore,
		resave: false,
		saveUninitialized: false,
		cookie: {
			sameSite: "strict",
		},
	})
);

// middleware to make session variables available in .ejs template files
app.use((req, res, next) => {
	res.locals.session = req.session;
	next();
});

app.use("/", indexRouter);
app.use("/login", loginRouter);
app.use("/register", registerRouter);
app.use("/account", accountRouter);
app.use("/availability", availabilityRouter);
app.use("/info", infoRouter);
app.use("/reserve", reserveRouter);
app.use("/cancel", cancelRouter);
app.use("/admindashboard", adminDashboardRouter);
app.use("/adminreport", adminReportRouter);
app.use("/reservations", reservationsRouter);
app.use("/upload", uploadRouter);
app.use("/delete", deleteUserDocRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;
