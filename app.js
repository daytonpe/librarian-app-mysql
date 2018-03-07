var express = require("express");
var mysql = require("mysql");
var fs = require("fs");
var normalizer = require("./normalizer");
var path = require("path");

//NORMALIZE THE DATA
borrowerData = normalizer.normalizeBorrower();
masterData = normalizer.normalizeAll();

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

  //PARSE FROM INITIALIZER
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

  // SEED DB WITH SOME BOOK_LOANS and Fines
  let bookLoanData = [
    [ '0440475333','99','2018-03-06', '2018-02-14', null ],
    [ '1400045088','99','2018-01-20', '2018-03-06', null ],
    [ '1400045088','99','2018-02-25', '2018-03-01', null ],
    [ '0875346197','75','2017-12-20', '2018-03-04', '2018-03-06' ],
    [ '0671664948','12','2018-03-06', '2018-03-20', null ]
  ];
  sql = "INSERT INTO BOOK_LOANS (Isbn, Card_id, Date_out, Due_date, Date_in) VALUES ?";
  con.query(sql, [bookLoanData], function(err, result) {
    if (err) throw err;
    console.log("Number of book_author links inserted: " + result.affectedRows);
  });

  //JOIN PUBLIC DIRECTORY FOR CSS
  app.use(express.static(path.join(__dirname, "public")));

  //SERVE HOMEPAGE
  app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname + "/views/index.html"));
  });

  //SEARCH BOOKS
  app.get("/search", function(req, res) {
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
        let checkoutButton = "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" data-toggle=\"modal\" data-target=\"#bookCheckoutModal\" data-whatever=\""+result[i].Isbn+"\">Check Out</button>";
        let newRow = "<p>"+result[i].Isbn+"\t|\t"+result[i].Title+"\t|\t"+result[i].Authors+"\t|"+checkoutButton+"</p>";
        // console.log(newRow);
        table+=newRow;
      }
      res.send(table);
    });
  });

  //CREATE A BORROWER
  app.get("/createBorrower", function(req, res) {
    let bname = req.query.name;
    let address = req.query.address;
    let ssn = req.query.ssn;
    let phone = req.query.phone;
    sql = `INSERT INTO BORROWER (Ssn, Bname, Address, Phone) VALUES ('`+ssn+`', '`+bname+`', '`+address+`', '`+phone+`') `;
    console.log(sql);
    con.query(sql, req.body, function(err, result) {
      if (err) {
        res.send("There has been an issue creating a new borrower with these credentials.");
      }
      else{
        res.send("Borrower added: "+bname);
      }
    });
  });

  //CHECK OUT A BOOK
  //TODO: unchain this so it's more readable
  app.get("/checkout", function(req, res) {
    let Isbn = req.query.Isbn;
    let Card_id = req.query.Card_id;
    let checkoutResponseObject = {};

    //IS ID VALID?
    sql = `SELECT COUNT(Card_id) AS validIds FROM BORROWER WHERE Card_id =`+Card_id+`;`;
    con.query(sql, req.body, function(err, result) {
      if (err) throw err;
      //if 0, the id hasn't been created
      //if id>1 then there are duplicate IDs and we have a problem in the system
      if (result[0].validIds !=1) {
        checkoutResponseObject = {
          error: true,
          message: "This is not a valid ID."
        }
        res.send(checkoutResponseObject)
      }else{
        //IS BOOK ALREADY CHECKED OUT?
        sql = `SELECT COUNT(Isbn) AS checkoutCount FROM BOOK_LOANS WHERE Isbn = '`+Isbn+`' AND Date_in IS NULL;`;
        con.query(sql, req.body, function(err, result) {
          if (err) throw err;
          if (result[0].checkoutCount ==1) {
            checkoutResponseObject = {
              error: true,
              message: "This book has already been checked out."
            }
            res.send(checkoutResponseObject)
          }else{
            //DOES THE BORROWER HAVE 3 BOOKS ALREADY?
            sql = `SELECT COUNT(Card_id) AS bookloans FROM BOOK_LOANS WHERE Card_id = `+Card_id+`;`;
            con.query(sql, req.body, function(err, result) {
              if (err) throw err;
              if (result[0].bookloans >2) {
                checkoutResponseObject = {
                  error: true,
                  message: "This user already has three books."
                }
                res.send(checkoutResponseObject)
              }else{
                let Date_out = 'NOW()';
                let Due_date = 'NOW() + INTERVAL 14 DAY';
                sql = `INSERT INTO BOOK_LOANS (Isbn, Card_id, Date_out, Due_date) VALUES ('`+Isbn+`','`+Card_id+`',`+Date_out+`, `+Due_date+`)`;
                console.log(sql);
                con.query(sql, req.body, function(err, result) {
                  if (err) throw err;
                  checkoutResponseObject = {
                    error: false,
                    message: 'Book loan recorded'
                  };
                  res.send(checkoutResponseObject)
                });
              }
            });
          }
        });
      }
    });
  });

  //SEARCH LOANS
  app.get("/loan", function(req, res) {
    const searchTerm = req.query.searchLoan; //grab search term from form
    sql =
      `SELECT  BOOK_LOANS.Isbn,
              BOOK_LOANS.Card_id,
              BORROWER.Bname
      FROM    BOOK_LOANS
      INNER JOIN BORROWER ON BOOK_LOANS.Card_id = BORROWER.Card_id
      WHERE   BOOK_LOANS.Isbn LIKE '%`+searchTerm+`%'
              OR BOOK_LOANS.Card_id LIKE '%`+searchTerm+`%'
              OR BORROWER.Bname LIKE '%`+searchTerm+`%';`; //insert searchTerm into the sql query
    con.query(sql, req.body, function(err, result) {
      if (err) throw err;
      let table = "";
      for (let i = 0; i < result.length; i++) {
        let checkinButton = "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" data-toggle=\"modal\" data-target=\"#bookCheckinModal\" data-whatever=\""+result[i].Isbn+"\">Check In</button>";
        let newRow = "<p>"+result[i].Isbn+"\t|\t"+result[i].Card_id+"\t|\t"+result[i].Bname+"\t|"+checkinButton+"</p>";
        // console.log(newRow);
        table+=newRow;
      }
      res.send(table);
    });
  });

  //CHECK IN A BOOK
  app.get("/checkin", function(req,res){
    let Isbn = req.query.Isbn;
    sql = `UPDATE BOOK_LOANS SET DATE_IN = NOW() WHERE Isbn = '`+Isbn+`';`;
    console.log(sql);
    con.query(sql, req.body, function(err, result) {
      if (err) throw err;
      checkoutResponseObject = {
        error: false,
        message: 'Checkin successful.'
      };
      res.send(checkoutResponseObject)
    });
  });

  //UPDATE FINES
  app.get("/fines", function(req, res) {
    sql = "SELECT * FROM BOOK_LOANS;"
    con.query(sql, req.body, function(err, result) {
      if (err) throw err;
      let table = "";
      for (let i = 0; i < result.length; i++) {
        let checkoutButton = "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" data-toggle=\"modal\" data-target=\"#bookCheckoutModal\" data-whatever=\""+result[i].Isbn+"\">Check Out</button>";
        let newRow = "<p>"+result[i].Isbn+"\t|\t"+result[i].Title+"\t|\t"+result[i].Authors+"\t|"+checkoutButton+"</p>";
        // console.log(newRow);
        table+=newRow;
      }
      res.send("Fines Updated");
    });
  });

});

try {
  app.listen(3000);
  console.log("Connected on Port 3000!");
} catch (e) {
  console.log("There has been a problem connecting to Port 3000");
}
