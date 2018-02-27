var express = require("express");
var mysql = require("mysql");
var fs = require("fs");
var normalizer = require("./normalizer");

//NORMALIZE THE DATA
borrowerData = normalizer.normalizeBorrower();
bookData = normalizer.normalizeBook();

//SET UP THE DATABASE CREDENTIALS
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "LIBRARY"
});

//INITIALIZE EXPRESS APPLICATION
var app = express();

//CONNECT TO DATABASE
con.connect(function(err) {
  if (!err) {
    console.log("Database is connected ... \n\n");
  } else {
    console.log("Error connecting database ... \n\n");
  }

  //IMPORT BORROWER DATA INTO DATABASE
  var sql = "INSERT INTO BORROWER (Ssn, Bname, Address, Phone) VALUES ?";
  con.query(sql, [borrowerData], function(err, result) {
    if (err) throw err;
    console.log("Number of borrowers inserted: " + result.affectedRows);
  });

  var sql = "TRUNCATE TABLE BOOK;";
  con.query(sql, function(err, result) {
    if (err) throw err;
    console.log("Old Books Cleared");
  });

  // IMPORT BOOK DATA INTO DATABASE
  var sql = "INSERT INTO BOOK (Isbn, Title) VALUES ?";
  con.query(sql, [bookData], function(err, result) {
    if (err) throw err;
    console.log("Number of books inserted: " + result.affectedRows);
  });

  // SHOW ALL BORROWERS
  // con.query("SELECT * FROM BORROWER", function(err, result, fields) {
  //   if (err) throw err;
  //   console.log(result);
  // });
});

// app.get("/", function(req, res) {
// con.query("SELECT * from EMPLOYEE LIMIT 2", function(err, rows, fields) {
//   con.end();
//   if (!err) console.log("The solution is: ", rows);
//   else console.log("Error while performing Query.");
// });
// });

// con.end();
// app.listen(3000);
