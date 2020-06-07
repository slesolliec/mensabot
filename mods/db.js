const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./db/chatbot.sqlite3', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the chatbot database.');
});


/*
// close the database connection
db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
  */

module.exports = db;
