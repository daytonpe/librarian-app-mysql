var express = require("express");
var mysql = require("mysql");
var fs = require("fs");

//NORMALIZE THE BORROWER DATA
var borrowerArr = fs
  .readFileSync("./borrowers.csv")
  .toString()
  .split("\n");
var borrowerData = [];
for (var i = 1; i < borrowerArr.length - 1; i++) {
  var borrower = borrowerArr[i].split(",");
  var Ssn = borrower[1];
  var Bname = borrower[2] + " " + borrower[3];
  var Address = borrower[5] + ", " + borrower[6] + ", " + borrower[7];
  var Phone = borrower[8].split("\r")[0];
  var normBorrower = [];
  normBorrower.push(Ssn);
  normBorrower.push(Bname);
  normBorrower.push(Address);
  normBorrower.push(Phone);
  borrowerData.push(normBorrower);
}

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
    console.log("Number of records inserted: " + result.affectedRows);
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
