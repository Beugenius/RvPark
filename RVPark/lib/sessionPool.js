var mysql2 = require("mysql2/promise");

// Bug tweak
// Get a plain mysql connection and create a session table (the express-mysql-session module is bugged and doesn't do it)
var db = require("../lib/database");
var dbCon = db.con; 

let sql = "CREATE DATABASE IF NOT EXISTS NodeExpressSessionStorage";
console.log("sessionPool.js: sql message will be " + sql);
dbCon.execute(sql, (err, results, fields) => {
    if(err) {
        console.log("sessionPool.js: Problem: Is the mysql server running?");
        console.log(err.message);
        throw err;
    }
    else {
        console.log("sessionPool.js: Created session database if it didn't already exist");
    }
});

// Now that the session database and table exists, create MySQL pool so it can be hooked up to expression session storage 
var dbConnectionInfo = require('../lib/connectionInfo');

var options = {
    host: dbConnectionInfo.host, 
    port: dbConnectionInfo.port,
    user: dbConnectionInfo.user, 
    password: dbConnectionInfo.password,
    database: 'NodeExpressSessionStorage'
    // createDatabaseTable: true
};

var pool = mysql2.createPool(options);

module.exports = pool;

