// API module based on:
// https://dev.to/prisma/adding-an-api-and-database-to-your-nuxt-app-with-prisma-2nlp

import express from 'express'
import { auth0 } from '@nuxtjs/auth-next';
const cookieParser = require("cookie-parser");
const db = require('../mods/db');


const app = express()

app.use(cookieParser());
app.use(express.json())

function checkAccess(req, res, next) {
	console.log(req.cookies);
	if (req.cookies['auth.strategy'] != 'discord') {
		return res.sendStatus(401);
	}
	if (! req.cookies['auth._token.discord']) {
		return res.sendStatus(401);
	}
	// 
//	console.log(req.cookies['auth._token_expiration.discord']);
	next();
}
// app.use(checkAccess)




app.get('/users', async (req, res) => {
	const users = await db.query('select real_name, mid, region from users where state = "validated" order by real_name');
	const responseData = {};
	responseData.users = users;
	res.json(responseData);
})

app.get('/user', async (req, res) => {
	const mid = parseInt(req.query.mid);
	const row = await db.query('select * from users where state = "validated" and mid = ' + mid);
	if (row) {
		const responseData = {};
		responseData.row = row[0];
		res.json(responseData);
	}
})

app.get('/region', async (req, res) => {
	const rows = await db.query('select region, count(*) as nb from users where state = "validated" group by region order by region');
	const responseData = {};
	responseData.rows = rows;
	res.json(responseData);
})





// in case of problem with BigInt
// (_, v) => typeof v === 'bigint' ? v.toString() : v

/*
app.get('/user/did/:did', async (req, res) => {
	const { did } = req.params
	const user = await prisma.users.findUnique({
		where: {
			did: Number(did),
		}
	})
	res.json(user)
})
*/

/** 
* logic for our api will go here
*/
export default {
	path: '/api',
	handler: app
}
