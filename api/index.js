// API module based on:

import express from 'express'
// import { auth0 } from '@nuxtjs/auth-next';
const cookieParser = require("cookie-parser");
const axios = require("axios");
// http://expressjs.com/en/resources/middleware/multer.html
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

const db = require('../mods/db');


const app = express()

app.use(cookieParser());
app.use(express.json())

let user = {};

async function checkAccess(req, res, next) {
	// console.log(req.cookies);
	if (req.cookies['auth.strategy'] != 'discord') {
		return res.sendStatus(401).send("You don't have the right cookie");
	}
	if (! req.cookies['auth._token.discord']) {
		return res.sendStatus(401).send("You don't have the left cookie");
	}

	const discordToken = req.cookies['auth._token.discord'].split(' ')[1];

	// do we already know that token?
	let users = await db.query("select * from users where discord_token = ? and state='validated' limit 1", [discordToken]);
	if (users[0]) {
		user = users[0];
		if (user.discord_token_expiration > Date.now()) {
			// discord token is still valid
			return next();
		} else {
			// discord token has expired
			await db.query("update users set discord_token = null, discord_token_expiration = null where did = ?", [user.did])
			user = {};
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
		return res.sendStatus(401).send("Your token seems crap");
	}
	// we get user in db
	users = await db.query("select * from users where did = ? and state='validated' limit 1", [me.id]);
	if (users[0]) {
		// we know that user, he is authenticated correctly
		// we write the token in db, so we don't need to ping Discord.com next time he makes
		// a request to the API
		db.query("update users set discord_token = ?, discord_token_expiration = ? where did = ?", [
			discordToken,
			req.cookies['auth._token_expiration.discord'],
			me.id
		]);
		user = users[0];
		return next();
	} else {
		// we don't know that user, or it is not validated
		return res.sendStatus(401).send("Unknown or un-validated user");
	}

}
app.use(checkAccess)


app.get('/user', async (req, res) => {
	let sql = `
		select mid, real_name, region,
			did, discord_name, discord_discriminator, discord_avatar,
			length(presentation) as presentationLength
		from users
		where state = "validated"`;

	// get only one user?
	if (req.query.mid) {
		const mid = parseInt(req.query.mid);
		sql += ' and mid = ' + mid;
		sql = sql.replace('select ', 'select presentation, ');
	}

	// get users from a specific region?
	if (req.query.region) {
		const region = req.query.region.slice(0, 3);
		sql += ` and region = '${region}'`;
	}

	sql += ' order by real_name';

	const users = await db.query(sql);

	const responseData = {};
	responseData.rows = users;
	res.json(responseData);
})


app.get('/region', async (req, res) => {
	const rows = await db.query('select region, count(*) as nb from users where state = "validated" group by region order by region');
	const responseData = {};
	responseData.rows = rows;
	res.json(responseData);
})

app.post('/me', upload.none(), async (req, res) => {
	const update = await db.query('update users set presentation = ? where mid = ?', [req.body.presentation , user.mid])
	res.json({result: "well done"});
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
