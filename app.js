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

  // SEED DB WITH SOME BOOK_LOANS
  let bookLoanData = [
    [ '0440475333','99','2018-03-06', '2018-02-14', null ],         //Loan_id=1, being fined, person 99
    [ '1400045088','99','2018-01-20', '2018-03-06', null ],         //Loan_id=2, being fined, person 99
    [ '1400045088','99','2018-02-25', '2018-03-01', '2018-03-07' ], //Loan_id=3, being fined, person 99
    [ '0875346197','75','2017-12-20', '2018-03-04', '2018-03-06' ], //Loan_id=4, fined, not-paid(FINES)
    [ '0671664948','12','2018-03-06', '2018-03-20', null ],         //Loan_id=5, not due yet
    [ '0439136369','15','2017-01-05', '2017-01-19', '2017-02-15']   //Loan_id=6, fined, paid(FINES)
  ];
  sql = "INSERT INTO BOOK_LOANS (Isbn, Card_id, Date_out, Due_date, Date_in) VALUES ?";
  con.query(sql, [bookLoanData], function(err, result) {
    if (err) throw err;
    console.log("Number of book_author links inserted: " + result.affectedRows);
  });

  // SEED DB WITH SOME FINES
  let finesData = [
    [4, '0.25', '0'],
    [6, '10.50', '1']
  ];
  sql = "INSERT FINES (Loan_id, Fine_amt, Paid) VALUES ?";
  con.query(sql, [finesData], function(err, result) {
    if (err) throw err;
    console.log("Number of fines inserted: " + result.affectedRows);
  });
  console.log('\n********************\n\n')

  //JOIN PUBLIC DIRECTORY FOR CSS
  app.use(express.static(path.join(__dirname, "public")));

  //SERVE HOMEPAGE
  app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname + "/public/views/index.html"));
  });

  //SERVE BORROWER PAGE
  app.get("/borrower", function(req, res) {
    res.sendFile(path.join(__dirname + "/public/views/borrower.html"));
  });

  //SERVE FINES PAGE
  app.get("/fine", function(req, res) {
    res.sendFile(path.join(__dirname + "/public/views/fine.html"));
  });


  //SERVE LOANS PAGE
  app.get("/loans", function(req, res) {
    res.sendFile(path.join(__dirname + "/public/views/loans.html"));
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
    //select all loans that would incur a fine
    sql = `
      SELECT Loan_id, Isbn, Card_id, date(Date_out), date(Due_date), date(Date_in), DateDiff(Date_in, Due_Date) AS exactFineDays, DateDiff(NOW(), Due_Date) AS estimateFineDays
      FROM  BOOK_LOANS
      WHERE NOW() > Due_date
            OR Date_in > Due_date;`
    con.query(sql, req.body, function(err, fineableLoans) {
      if (err) throw err;
      // console.log(fineableLoans);
      for (let i = 0; i < fineableLoans.length; i++) {
        //CALCULATE FINES
        //IF HAS Date_in (Date_in != null)--Exact Finest
        let loan_id = fineableLoans[i].Loan_id;
        let days;
        if(fineableLoans[i].Date_in !=null){
          days = fineableLoans[i].exactFineDays;
        }
        //IF STILL CHECKED OUT (Date_in==null)--Estimate Fine
        else{
          days = fineableLoans[i].estimateFineDays;
        }
        let fine = days * .25;

        //UPDATE FINE TABLE
        sql = `SELECT COUNT(Loan_id) AS fineExists, Paid FROM FINES WHERE Loan_id =`+fineableLoans[i].Loan_id+`;`;
        con.query(sql, req.body, function(err, result) {
          if (err) throw err;
          if (result[0].fineExists == 1) {

            //IF FINE ROW EXISTS && Paid, DO NOTHING
            if(result[0].Paid == 1){
              console.log('One record skipped (already paid)');
            }
            //IF FINE ROW EXISTS && !Paid
            else{
              // console.log('UPDATING: '+loan_id);
              sql = `UPDATE FINES SET Fine_amt = `+fine+` WHERE Loan_id = '`+loan_id+`';`;
              con.query(sql, req.body, function(err, result) {
                if (err) throw err;
                console.log('One record updated in FINES');
              });
            }
          }
          //IF FINE ROW DOES NOT EXIST
          else{
            // console.log('INSERTING Loan_id: '+loan_id);
            sql = `INSERT INTO FINES (Loan_id, Fine_amt, Paid) VALUES ('`+loan_id+`','`+fine+`','0');`;
            con.query(sql, req.body, function(err, result) {
              if (err) throw err;
              console.log('One record inserted into FINES');
            });
          }
        });

      }
      res.send("Fines Updated");
    });
  });

  //LIST FINES
  app.get("/viewfines", function(req,res){
    let Isbn = req.query.Isbn;
    sql = `
      SELECT  BOOK_LOANS.Card_id, SUM(FINES.Fine_amt) AS Total
      FROM    FINES
      NATURAL JOIN BOOK_LOANS
      WHERE   FINES.Paid = 0
      GROUP   BY BOOK_LOANS.Card_id; `;
    // console.log(sql);
    con.query(sql, req.body, function(err, result) {
      if (err) throw err;
      let table = "";
      for (let i = 0; i < result.length; i++) {
        let payFineButton = "<button type=\"button\" class=\"btn btn-sm btn-outline-secondary\" data-toggle=\"modal\" data-target=\"#payFinesModal\" data-whatever=\""+result[i].Card_id+"\">Pay</button>";
        let newRow = "<p>"+result[i].Card_id+"\t|\t$"+result[i].Total+"\t|\t"+payFineButton+"</p>";
        table+=newRow;
      };
      // console.log("table\n"+table);
      res.send(table)
    });
  });

  //PAY FINE
  app.get("/payfine", function(req,res){
    let Card_id = req.query.Card_id;

    console.log('PAYFINE CALLED!');

    // FIND ALL FINES WHERE Card_id= Card_id
    sql = `
    SELECT      *
    FROM        FINES
    INNER JOIN  BOOK_LOANS
    WHERE       FINES.Loan_id = BOOK_LOANS.Loan_id
                AND Card_id =  `+Card_id+`; `;

    con.query(sql, req.body, function(err, result) {
      if (err) throw err;

      let returned = true; //boolean
      for (let i = 0; i < result.length; i++) {
        console.log('HHHHHHHHHHHHHH');
        console.log(result[i]);
        console.log('HHHHHHHHHHHHHH');
        if (result[i].Date_in == null){
          console.log('Fine payment DECLINED for one book record.\nMust return book first.');
          returned = false;
        }
        else {
          sql = `UPDATE FINES SET Paid = 1 WHERE Loan_id = '`+result[i].Loan_id+`';`;
          con.query(sql, req.body, function(err, result) {
            if (err) throw err;
            console.log('Fine payment received for one book record.');
          });
        }

      }
      if (returned == true) {
        res.send('Payment received for Library Card: '+Card_id);
      }else{
        res.send('You must return books before you can pay fine for them.\n Fine adjusted accordingly for library card: '+Card_id);
      }
    });

  });

});

try {
  app.listen(3000);
  console.log("Connected on Port 3000!");
} catch (e) {
  console.log("There has been a problem connecting to Port 3000");
}
