// API module based on:

import express from 'express'
// import { auth0 } from '@nuxtjs/auth-next';
const cookieParser = require("cookie-parser");
const axios = require("axios");
const db = require('../mods/db');


const app = express()

app.use(cookieParser());
app.use(express.json())

async function checkAccess(req, res, next) {
	console.log(req.cookies);
	if (req.cookies['auth.strategy'] != 'discord') {
		return res.sendStatus(401);
	}
	if (! req.cookies['auth._token.discord']) {
		return res.sendStatus(401);
	}

	const discordToken = req.cookies['auth._token.discord'].split(' ')[1];

	// do we already know that token?
	let user = await db.query("select * from users where discord_token = ? and state='validated' limit 1", [discordToken]);
	if (user[0]) {
		user = user[0];
		if (user.discord_token_expiration > Date.now()) {
			// discord token is still valid
			return next();
		} else {
			// discord token has expired
			await db.query("update users set discord_token = null, discord_token_expiration = null where did = ?", [user.did])
		}
	}

	// we check this is a good token
	let me = await axios.get('https://discord.com/api/users/@me', {
		headers: {
			authorization: req.cookies['auth._token.discord']
		}
	});
	// console.log("me=", me.data);
	me = me.data;
	if (! me.id) {
		// this token is probably crap
		console.log("Surely crap token");
		return res.sendStatus(401);
	}
	// we get user in db
	user = await db.query("select * from users where did = ? and state='validated' limit 1", [me.id]);
	if (user[0]) {
		// we know that user, he is authenticated correctly
		// we write the token in db, so we don't need to ping Discord.com next time he makes
		// a request to the API
		db.query("update users set discord_token = ?, discord_token_expiration = ? where did = ?", [
			discordToken,
			req.cookies['auth._token_expiration.discord'],
			me.id
		]);
		return next();
	} else {
		// we don't know that user, or it is not validated
		return res.sendStatus(401);
	}

}
app.use(checkAccess)




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
