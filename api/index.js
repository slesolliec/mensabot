// API module based on:

import express from 'express'
// import { auth0 } from '@nuxtjs/auth-next';
const cookieParser = require("cookie-parser");
const axios = require("axios");
// http://expressjs.com/en/resources/middleware/multer.html
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const basicAuth = require('basic-auth');

const db = require('../mods/db');


const app = express()

app.use(cookieParser());
app.use(express.json())

let user = {};

async function checkAccess(req, res, next) {

	// this page is open to anyone
	if (req.url == '/status') {
		return next();
	}

	// basic-auth for Spider
	if (req.url == '/spider') {
		let spider = basicAuth(req);
		if (!spider || !spider.name || !spider.pass) {
			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			res.sendStatus(401).send("Please send credentials for spider");
			return;
		}
		if (spider.name != 'spider') {
			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			res.sendStatus(401).send("Wrong login for spider");
			return;
		}
		let spiderpass = await db.query("select val from store where `key` = 'spider_password'");
		spiderpass = spiderpass[0].val;
		if (spider.pass != spiderpass) {
			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			res.sendStatus(401).send("Wrong password for spider");
			return;
		}
		return next();
	}

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
		select mid, real_name, region, adherent,
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


app.get('/status', async (req, res) => {
	const status = {};
	status.cssclass = 'allok';	// I know it's bad to mix business and display
 	// await db.query("update store set val = ? where `key` = 'bot_lastping'", [Date.now()]);

	// spider status
	let lastping = await db.query("select val from store where `key` = 'spider_lastping'");
	lastping =  parseInt(lastping[0].val);
	if (Date.now() - lastping < 60 * 1000) {
		status.annuaire = "service actif";
	} else {
		status.annuaire = "service de consultation de l'annuaire Mensa France inactif :-(";
		status.cssclass = 'spideroff';
	}
	const noobs = await db.query(`
		select count(*) as nb
		from users
		where state='welcomed'
		  and mid is not null
		order by mid desc`);
	status.nbnoobs = noobs[0].nb;

	// bot status
	lastping = await db.query("select val from store where `key` = 'bot_lastping'");
	lastping =  parseInt(lastping[0].val);
	if (Date.now() - lastping < 60 * 1000) {
		status.bot = "en ligne :-)";
	} else {
		status.bot = "déconnecté :-(";
		status.cssclass = 'offline';
	}

	res.json({status});
})

app.get('/spider', async (req, res) => {
	// we get new users
	const getnoobs = await db.query("select mid from users where state='welcomed' and mid is not null");
	let noobs = [];

	if (getnoobs.length == 0) {
		db.query("update store set val = ? where `key` = 'spider_lastping'", [Date.now()]);
	}

	while (getnoobs.length) {
		let noob = getnoobs.pop();
		noobs.push({
			mid: noob.mid
		});
	}

	// we get users whose adherent status is null
	const getUnknowns = await db.query(`
			select mid, real_name, region, email
			from users
			where state='validated'
			  and (adherent = 2 or adherent is null) `);
	let unknowns = [];

	while (getUnknowns.length) {
		let unknown = getUnknowns.pop();
		unknowns.push({
			mid:       unknown.mid,
			real_name: unknown.real_name,
			region:    unknown.region,
			email:     unknown.email
		});
	}

	res.json({noobs, unknowns});
});

// we get the adherent's data from external spider
app.post('/spider', async (req, res) => {

	// console.log(req.body);
	let noob = req.body;

	console.log("noob=", noob);

	if (noob.region) {
		db.query(`
			update users
			set real_name = ?,
				region    = ?,
				email     = ?,
				adherent  = ?,
				state='found'
			where mid = ? and state = 'welcomed'`, [
				noob.name,
				noob.region,
				noob.email,
				noob.adherent,
				noob.mid]);
	} else {
		if (noob.adherent != undefined) {
			db.query(`update users set adherent = ? where mid = ?`, [noob.adherent, noob.mid]);
		} else {
			db.query("update users set state='err_not_found' where mid = ? and state = 'welcomed'", [noob.mid]);
		}
	}
	db.query("update store set val = ? where `key` = 'spider_lastping'", [Date.now()]);
	return res.send("OK thanks");
});

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
