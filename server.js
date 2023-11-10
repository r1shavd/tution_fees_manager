/*
server,js

This the entry point for the app, where we define all the functionalities running in the background. We define the endpoints and various backend tasks that are needed to be executed

Author: Rishav Das (github.com/r1shavd/)
*/

// Importing the required modules
const Fs = require("fs");
const Express = require("express");
const BodyParser = require("body-parser");
const Sqlite3 = require("sqlite3");

// Creating the express app and defining its properties
const app = Express()
app.set("view engine", "ejs");
// app.use(Express.static("scripts")); // Uncomment when having an additional scripts/ directory for JS and CSS files
app.use(BodyParser.urlencoded({ extended: true }));
app.use(BodyParser.json());

// Connecting the app to database
const DbConn = new Sqlite3.Database("database.db", (error) => {
	if (error) {
		// If there occurs any error
		console.log("[ Connection to database failed ]");
	} else {
		// If there occurs no error
		console.log("[ Connection to database established ]");
	}
});

// Defining the endpoints of the app
//
// Defining the HTTP GET request endpoints
//
app.get('/', (request, response) => {
	// Fetching all the students existing
	DbConn.all("SELECT * FROM students", [], (error, row) => {
		if (error) {
			// If there occured an error during the process
			return response.status(400).json({"error" : error.message});
		} else {
			// If there occurs no error
			return response.render('index', {data : row});
		}
	});
});
//
app.get("/student", (request, response) => {
	// Loading the particular student data
	const student_id = request.query.id;
	if (student_id == undefined) {
		// If the student id is not mentioned
		return response.redirect('/');
	} else {
		// Fetching the student details from the database
		DbConn.get("SELECT * FROM students WHERE id = ?", [student_id], (error, row) => {
			if (error) {
				// If there occured an error during the process
				return response.status(400).json({"error" : error.message});
			} else {
				// If there occurs no error
				if (row == undefined) {
					// Redirecting to home page if no such student found
					return response.redirect('/');
				} else {
					// Fetching the transaction details for the student
					let data = {
						"student_id" : row.id,
						"name" : row.name,
						"class" : row.class,
						"board" : row.board,
						"transactions" : [],
					};
					DbConn.all("SELECT * FROM transactions WHERE student_id = ?", [student_id], (error, row) => {
						if (error) {
							// If there occured an error
							return response.status(400).json({"error" : error.message});
						} else {
							// Displaying the information
							data.transactions = row.reverse();
							return response.render("student", {data : data});
						}
					});
				}
			}
		});
	}
});
//
// HTTP POST request endpoints
//
app.post("/add", (request, response) => {
	// Checking for the task
	if (request.body.task == "student") {
		// Getting the new student details
		let student_name = request.body.student_name;
		let student_class = request.body.student_class;
		let student_board = request.body.student_board;

		// Inserting into the database
		DbConn.run("INSERT INTO students (name, class, board) VALUES (?, ?, ?)", [student_name, student_class, student_board], (error) => {
			if (error) {
				return response.end(error.message);
			} else {
				return response.end("true");
			}
		});
	} else if (request.body.task == "transaction") {
		// Getting the details of the fees
		let student_id = request.body.student_id;
		let amount = request.body.amount;
		let month = request.body.month;
		let year = request.body.year;

		// Inserting into the database
		DbConn.run("INSERT INTO transactions (student_id, amount, month, year) VALUES (?, ?, ?, ?)", [student_id, amount, month, year], (error) => {
			if (error) {
				return response.end(error.message);
			} else {
				return response.end("true");
			}
		});
	} else {
		return response.end("false");
	}
});
//
app.post("/delete", (request, response) => {
	// Checking the task
	if (request.body.task == "student") {
		// Removing the student as per request
		const student_id = request.body.student_id;
		DbConn.run("DELETE FROM students WHERE id = ?", [student_id], (error) => {
			if (error) {
				// If there occurs an error
				return response.end(error.message);
			} else {
				// Deleting all the transactions history for the requested student
				DbConn.run("DELETE FROM transactions WHERE student_id = ?", [student_id], (error) => {
					if (error) {
						return response.end(error.message);
					} else {
						return response.end("true");
					}
				})
			}
		});
	} else if (request.body.task == "transaction") {
		// Removing the requested transaction
		const txn_id = request.body.txn_id;
		DbConn.run("DELETE FROM transactions where id = ?", [txn_id], (error) => {
			if (error) {
				// If there occurs an error
				return response.end(error.message);
			} else {
				return response.end("true");
			}
		});
	}
});
//

// Making the app to listen at port 8000
app.listen(8000, () => {
	console.log("[ Listening at port 8000 ]");
});