"use strict"

const mysql = require('mysql')
const util  = require('util')
const log   = require('./log')
const conf  = require('./configs')

let pool = mysql.createPool({
	connectionLimit: 10,
	host     : conf.host,
	user     : conf.user,
	password : conf.password,
	database : conf.database,
	charset  : 'utf8mb4',
	timezone : 'Z'
})

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
        log.error(err.message)
    }
    if (connection) {
      log.debug('Connected to the chatbot database.')
      connection.release()
    }
    return
})

pool.query = util.promisify(pool.query)


// empty all data from db
pool.clean_db = async function() {
  await db.query("delete from users");
  await db.query("delete from members");
  await db.query("delete from guilds");
}


pool.getGuild = async function(gid) {
  return await db.get(`select * from guilds where gid = ?`, [gid]);
}


pool.getUser = async function(did) {
  return await db.get(`select * from users where did = ?`, [did]);
}


pool.getMember = async function(gid, did) {
  return await db.query(`select * from members where gid = ? and did = ?`, [gid, did]);
}


/*
// close the database connection
db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Close the database connection.');
  });
  */

module.exports = pool
