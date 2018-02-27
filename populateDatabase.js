var fs = require("fs");
var borrowerArr = fs
  .readFileSync("../borrowers.csv")
  .toString()
  .split("\n");

for (var i = 1; i < borrowerArr.length - 1; i++) {
  // GOAL: Card_id, Ssn, Bname, Address, Phone
  // FROM: 000006,206-26-7141,Judy,Holmes,jholmes5@github.io,6583 Manitowish Hill,Dallas,TX,(972) 898-5909

  var borrower = borrowerArr[i].split(",");
  var Ssn = borrower[1];
  var Bname = borrower[2] + " " + borrower[3];
  var Address =
    borrower[4] + ", " + borrower[5] + ", " + borrower[6] + ", " + borrower[7];
  var Phone = borrower[8];

  INSERT INTO BORROWER VALUES(Ssn, Bname, Address, Phone);

  INSERT INTO EMPLOYEE VALUES ('Red','A','Bacher','666666613','1980-05-21','196 Elm Street, Miami, FL','M','33500.00','666666612','8');

  console.log(Ssn + "\t" + Bname + "\t" + Address + "\t" + Phone + "\t");
}

// console.log(borrowerArr);
