-- Delete the Database "LIBRARY"
DROP DATABASE IF EXISTS LIBRARY;
-- Create the Database "LIBRARY"
CREATE DATABASE LIBRARY
  DEFAULT CHARACTER SET utf8
  DEFAULT COLLATE utf8_general_ci;
-- Set the currently active database to be "COMPANY"
USE LIBRARY;

-- Create the Book Schema
DROP TABLE IF EXISTS BOOK;
CREATE TABLE BOOK(
  Isbn VARCHAR(10) NOT NULL,
  Title VARCHAR(500),
  CONSTRAINT pk_book PRIMARY KEY (Isbn)
);

-- Create the Authors Schema
DROP TABLE IF EXISTS AUTHORS;
CREATE TABLE AUTHORS(
  Author_id INT NOT NULL,
  Name VARCHAR(50) NOT NULL,
  CONSTRAINT pk_authors PRIMARY KEY (Author_id)
);

-- Create the Book_Author Schema
DROP TABLE IF EXISTS BOOK_AUTHORS;
CREATE TABLE BOOK_AUTHORS(
  Author_id INT,
  Isbn VARCHAR(10) NOT NULL,
  CONSTRAINT pk_book_authors PRIMARY KEY (Author_id, Isbn),
  CONSTRAINT fk_bookauthor_book FOREIGN KEY (Isbn) REFERENCES BOOK(Isbn),
  CONSTRAINT fk_bookauthor_author FOREIGN KEY (Author_id) REFERENCES AUTHORS(Author_id)
);

-- Create the Borrower Schema
DROP TABLE IF EXISTS BORROWER;
CREATE TABLE BORROWER(
  Card_id INT AUTO_INCREMENT,
  Ssn VARCHAR(11) NOT NULL,
  Bname VARCHAR(50) NOT NULL,
  Address VARCHAR(50) NOT NULL,
  Phone VARCHAR(16),
  CONSTRAINT pk_borrower PRIMARY KEY (Card_id),
  UNIQUE (Ssn)
);

-- Create the Book Loan Schema
DROP TABLE IF EXISTS BOOK_LOANS; 
CREATE TABLE BOOK_LOANS(
  Loan_id INT AUTO_INCREMENT,
  Isbn VARCHAR(10) NOT NULL,
  Card_id INT NOT NULL,
  Date_out DATE,
  Due_date DATE,
  Date_in DATE,
  CONSTRAINT pk_book_loan PRIMARY KEY (Loan_id),
  CONSTRAINT fk_bookloan_book FOREIGN KEY (Isbn) REFERENCES BOOK(Isbn),
  CONSTRAINT fk_bookloan_borrower FOREIGN KEY (Card_id) REFERENCES BORROWER(Card_id)
);

-- Create the Fines Schema
DROP TABLE IF EXISTS FINES;
CREATE TABLE FINES(
  Loan_id INT,
  Fine_amt DECIMAL(5,2),
  Paid BOOLEAN,
  CONSTRAINT pk_fines PRIMARY KEY (Loan_id),
  CONSTRAINT fk_fines_bookloan FOREIGN KEY (Loan_id) REFERENCES BOOK_LOANS(Loan_id)
);
