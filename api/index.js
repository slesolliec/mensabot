// API module based on:

import express from 'express'
import { fstat } from 'fs';
// import { auth0 } from '@nuxtjs/auth-next';
const cookieParser = require("cookie-parser");
const axios        = require("axios");
// http://expressjs.com/en/resources/middleware/multer.html
const multer       = require('multer');
const upload       = multer({ dest: 'uploads/' });
const basicAuth    = require('basic-auth');
const moment       = require('moment');
const fs           = require('fs');


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

	// get only one user?
	if (req.query.did) {
		const did = req.query.did.split(' ')[0];
		sql += ' and did = ' + did;
		sql = sql.replace('select ', 'select presentation, ');
	}

	// get users from a specific region?
	if (req.query.region) {
		const region = req.query.region.slice(0, 3);
		sql += ` and region = '${region}'`;
	}

	// get users from a specific guild?
	if (req.query.guild) {
		const guild = req.query.guild.split(' ')[0];
		sql += ` and did in (select did from members where gid = '${guild}')`;

		// special case: unvalidated users for admins
		if (req.query.unval == 'idated') {
			// we check we are guild owner
			let isOwner = db.query("select * from members where gid = ? and did = ?", [
				guild, user.did
			]);

			if (user.did != '396752710487113729') {
				if (isOwner.length == 0) {
					res.json({rows: []});
					return;
				}
				
				if (isOwner[0].state != 'owner') {
					res.json({rows: []});
					return;
				}
			}

			sql = sql.replace('state = "validated"', 'state <> "validated"');
		} 

	}

	sql += ' order by real_name, discord_name';

	// get noob users for home page
	if (req.query.noobs) {
		sql = `
		select mid, real_name, region, 
			did, discord_name, discord_discriminator,
			length(presentation) as presentationLength,
			created_at
		from users
		where state = "validated"
		  and created_at is not null
		order by created_at desc
		limit 5
		`;
	}

	// console.log(sql);
	const users = await db.query(sql);

	const responseData = {};
	responseData.rows = users;

	// just one user?
	if (responseData.rows.length == 1) {
		// we get the tags
		if (responseData.rows[0].mid) {
			const tags = await db.query("select tag from tags where mid=? order by tag", [responseData.rows[0].mid]);
			responseData.rows[0].tags = [];
			for (const i in tags) {
				responseData.rows[0].tags.push(tags[i].tag);
			}
		}
	}
	res.json(responseData);
})


app.get('/region', async (req, res) => {
	const rows = await db.query('select region, count(*) as nb from users where state = "validated" group by region order by region');
	const responseData = {};
	responseData.rows = rows;
	res.json(responseData);
})


app.get('/tag', async (req, res) => {

	const responseData = {};

	if (req.query.tag) {
		// list all users with that tag
		let sql = `
		select mid, real_name, region, adherent,
			did, discord_name, discord_discriminator, discord_avatar,
			length(presentation) as presentationLength
		from users
		where state = "validated"
		 and mid in (
			 select mid from tags where tag = ?
		 )
		order by real_name, discord_name`;

		// console.log(sql);
		const users = await db.query(sql, [req.query.tag]);
	
		responseData.rows = users;
	} else {
		// list all tags
		const rows = await db.query(`
			select tag, count(*) as nb
			from tags
			group by tag
			order by nb desc, tag asc`
		);
		responseData.rows = rows;
	}
	res.json(responseData);
})


app.get('/guild', async (req, res) => {
	const rows = await db.query(`
		select g.gid, g.name, count(*) as nb
		from guilds as g, members as m, users as u
		where g.gid = m.gid
		  and m.did = u.did
		  and u.state = "validated"
		  and g.is_active = 1
		group by g.gid
		order by g.name`);
	const responseData = {};
	responseData.rows = rows;
	res.json(responseData);
})


app.post('/me', upload.none(), async (req, res) => {
	// console.log(req.body.tags);
	let update = await db.query('update users set presentation = ? where mid = ?', [req.body.presentation, user.mid])
	// set created_at for user if empty
	if (! user.created_at) {
		db.query('update users set created_at = ? where mid = ?', [
			moment().format('YYYY-MM-DD HH:mm:ss'),
			user.mid
		]);
	}
	update = await db.query('delete from tags where mid = ?', [user.mid]);
	req.body.tags.split(',').map((tag) => {
		tag = tag.trim();
		if (tag) {
			db.query('insert into tags (mid, tag) values (?, ?)', [user.mid, tag]);
		}
	});
	res.json({result: "well done"});
})


async function getAllBooks(req, res) {
	let books;
	if (req.query.tag) {
		const sql = `
			select books.*
			from books, tags
			where books.id = tags.book_id
			  and tags.tag = ?
			order by id desc`;
		books = await db.query(sql, [req.query.tag]);
	} else {
		const sql = `select * from books order by id desc`;
		books = await db.query(sql);
	}

	for (const i in books) {
		// get reviews
		books[i].reviews = await db.query(`
			select reviews.rating,
				users.mid,
				users.real_name
			from reviews, users
			where reviews.book_id = ?
			  and reviews.mid = users.mid`, [books[i].id]);
		// get tags
		books[i].tags = await db.query("select tag from tags where book_id = ?", books[i].id);
	}
	
	const responseData = {};
	responseData.rows = books;

	// get all tags
	if (! req.query.tag) {
		let tags = await db.query(`
			select tag, count(*) as nb
			from tags
			where book_id is not null
			group by tag
			order by nb desc, tag asc`);
		responseData.tags = tags;
	}

	return res.json(responseData);
}

app.get('/book', async (req, res) => {
	if (req.query.id) {
		const bid  = parseInt(req.query.id);
		const books = await db.query('select * from books where id = ?', [bid]);
		const tags = await db.query('select tag from tags where book_id = ?', [bid]);
		return res.json({rows: books, tags: tags});
	}

	if (req.query.best) {
		let sql = `
			select books.*, sum(reviews.rating) as stars
			from books, reviews
			where books.id = reviews.book_id
			group by books.id
			order by stars desc
			limit 5
			`;
		const books = await db.query(sql, []);

		for (const i in books) {
			// get reviews
			books[i].reviews = await db.query(`
				select reviews.rating,
					users.mid,
					users.real_name
				from reviews, users
				where reviews.book_id = ?
				  and reviews.mid = users.mid
				order by reviews.created_at desc`, [books[i].id]);
		}

		return res.json({rows: books});
	}

	// default
	return getAllBooks(req, res);
});

async function getReviewsForBook(req, res) {
	let bid;
	if (req.query.id ) bid  = parseInt(req.query.id);
	if (req.body.id)   bid  = parseInt(req.body.id);

	if (bid) {
		const reviews = await db.query(`
			select reviews.*,
				users.mid,
				users.real_name
			from reviews, users
			where reviews.book_id = ?
			  and reviews.mid = users.mid
			`, [bid]);
		return res.json({rows: reviews});
	}
	return res.status(404);
}


app.get('/reviews', getReviewsForBook);


// app.post('/book', upload.none(), async (req, res) => {
app.post('/book', upload.single('couv'), async (req, res) => {

	let bid;

	// console.log(req.file);
	// console.log(req.body);

	if (req.body.id) {
		bid = parseInt(req.body.id);
	} else {
		// add the book
		const book = await db.query('insert into books (title, authors, year, created_at) values (?, ?, ?, ?)', [
			req.body.title,
			req.body.authors,
			parseInt(req.body.year),
			moment().format('YYYY-MM-DD HH:mm:ss')
		]);
		bid = book.insertId;

		// handle cover
		if (req.file) {
			const ext = req.file.originalname.split('.').slice(-1)[0];
			if (['png', 'gif', 'jpg', 'jpeg'].includes(ext)) {
				fs.rename(req.file.path, 'static/book_cover/' + bid + '.' + ext, function (err) {
					if (err) throw err
					console.log('File ' + req.file.path + ' successfully moved to static/book_cover/' + bid + '.' + ext);
				});
				db.query('update books set cover_ext = ? where id = ?', [ext, bid]);
			}
		}

		// add the tags
		req.body.tags.split(',').map((tag) => {
			tag = tag.trim();
			if (tag) {
				db.query('insert into tags (book_id, tag) values (?, ?)', [bid, tag]);
			}
		});
	}


	// the new id is book.insertId
	// once we have the book we add the comment
	let rating = parseInt(req.body.rating);
	if (rating > 5) rating = 5;
	if (rating < 0) rating = 0;
	await db.query('delete from reviews where book_id = ? and mid = ?', [bid, user.mid]);
	const review = await db.query('insert into reviews (book_id, mid, created_at, rating, comment) values (?, ?, ?, ?, ?)', [
		bid,
		user.mid,
		moment().format('YYYY-MM-DD HH:mm:ss'),
		rating,
		req.body.review
	]);

	// case we were on the book page
	if (req.body.id) {
		return getReviewsForBook(req, res);
	}

	return getAllBooks(req, res);
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
