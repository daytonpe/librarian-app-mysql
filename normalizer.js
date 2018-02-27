var fs = require("fs");

//NORMALIZE THE BORROWER DATA
module.exports = {
  normalizeBorrowers: function() {
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
    return borrowerData;
  }
};
