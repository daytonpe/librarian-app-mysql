var express = require("express");
var mysql = require("mysql");
var fs = require("fs");
var normalizer = require("./normalizer");
var path = require("path");
var

//NORMALIZE THE DATA
borrowerData = normalizer.normalizeBorrower();
// bookData = normalizer.normalizeBook();
// authorData = normalizer.normalizeAuthor();
// bookAuthorData = normalizer.normalizeBookAuthor();
masterData = normalizer.normalizeAll();
// console.log(masterData[341]);

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

  //parse data from initializer
  var bookData = [];
  var authorData = [];
  var bookAuthorsData = [];
  for (var i = 0; i < masterData.length; i++) {
    bookData.push([masterData[i][0], masterData[i][1]]); //Isbn, Title
    for (var k = 0; k < masterData[i][2].length; k++) {
      authorData.push([masterData[i][2][k][0], masterData[i][2][k][1]]); //authorId, Name
      bookAuthorsData.push([masterData[i][2][k][0], masterData[i][0]]); //authorId, Isbn
    }
  }

  // //IMPORT BORROWER DATA INTO DATABASE
  var sql = "INSERT INTO BORROWER (Ssn, Bname, Address, Phone) VALUES ?";
  con.query(sql, [borrowerData], function(err, result) {
    if (err) throw err;
    console.log("Number of borrowers inserted: " + result.affectedRows);
  });

  // IMPORT BOOK DATA INTO DATABASE
  sql = "INSERT INTO AUTHORS (Author_id, Name) VALUES ?";
  con.query(sql, [authorData], function(err, result) {
    if (err) throw err;
    console.log("Number of authors inserted: " + result.affectedRows);
  });

  // IMPORT AUTHOR DATA INTO DATABASE
  sql = "INSERT INTO BOOK (Isbn, Title) VALUES ?";
  con.query(sql, [bookData], function(err, result) {
    if (err) throw err;
    console.log("Number of books inserted: " + result.affectedRows);
  });

  // IMPORT BOOK_AUTHOR DATA INTO DATABASE
  sql = "INSERT INTO BOOK_AUTHORS (Author_id, Isbn) VALUES ?";
  con.query(sql, [bookAuthorsData], function(err, result) {
    if (err) throw err;
    console.log("Number of book_author links inserted: " + result.affectedRows);
  });

  app.use(express.static(path.join(__dirname, "public")));

  app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname + "/views/index.html"));
  });

  app.get("/search", function(req, res) {
    // console.log(req.query.search);
    const searchTerm = req.query.search; //grab search term from form
    sql =
      `SELECT  BOOK.Isbn,
              BOOK.Title,
              GROUP_CONCAT(AUTHORS.Name ORDER BY AUTHORS.Name) Authors
      FROM    BOOK
              INNER JOIN BOOK_AUTHORS
                  ON BOOK.Isbn = BOOK_AUTHORS.Isbn
              INNER JOIN AUTHORS
                  ON BOOK_AUTHORS.Author_ID = AUTHORS.Author_ID
      WHERE   BOOK.Title LIKE '%`+searchTerm+`%'
              OR AUTHORS.Name LIKE '%`+searchTerm+`%'
              OR BOOK.Isbn LIKE '%`+searchTerm+`%'
      GROUP   BY BOOK.Isbn, BOOK.Title`; //insert searchTerm into the sql query
    con.query(sql, req.body, function(err, result) {
      if (err) throw err;
      let table = "";
      for (let i = 0; i < result.length; i++) {
        let newRow = "<p>"+result[i].Isbn+"\t|\t"+result[i].Title+"\t|\t"+result[i].Authors+"\t|\t<a>Check Out</a></p>";
        table+=newRow;
      }
      // console.log(table);
      res.send(table);
    });
  });
});

// app.get("/", function(req, res) {
// con.query("SELECT * from EMPLOYEE LIMIT 2", function(err, rows, fields) {
//   con.end();
//   if (!err) console.log("The solution is: ", rows);
//   else console.log("Error while performing Query.");
// });
// });

// con.end();
try {
  app.listen(3000);
  console.log("Connected on Port 3000!");
} catch (e) {
  console.log("There has been a problem connecting to Port 3000");
}
