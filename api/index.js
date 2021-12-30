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

	// this data is open to anyone
	if (req.url == '/stats') {
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
		return res.sendStatus(401).send("You don't have the right strategy cookie");
	}
	if (! req.cookies['auth._token.discord']) {
		return res.sendStatus(401).send("You don't have the discord token");
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


app.get('/stats', async (req, res) => {
	const stats = {};

	let data = await db.query('select count(*) as nb from users where state = "validated" ');
	stats.members = data[0].nb;

	data = await db.query('select count(*) as nb from guilds where is_active = 1 ');
	stats.guilds = data[0].nb;

	data = await db.query('select count(*) as nb from books ');
	stats.books = data[0].nb;

	res.json({stats});
})


app.get('/user', async (req, res) => {
	let sql = `
		select mid, real_name, region, adherent, state,
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

			if ( ! isGuildAdmin(guild, user.did)) {
				res.json({rows: []});
				return;
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


async function isGuildAdmin(gid, did) {
	let zeMember = await db.query("select * from members where gid = ? and did = ?", [gid, did]);

	// me
	if (did == '396752710487113729') return true;

	if (zeMember.length)
		if ((zeMember[0].state == 'owner') || zeMember[0].is_admin)
			return true;

	return false;
}


// admin action: changing status of a user
app.post('/userchange', upload.none(), async (req, res) => {
	if ( ! isGuildAdmin(req.body.gid, user.did))
		return res.sendStatus(403);
	
	if (req.body.action == 'resend_vcode') {
		// on remet le mec en "found"
		const sql = `update users set state = 'found' where mid = ? and state = 'vcode_sent'`;
		db.query(sql, [parseInt(req.body.mid)]);
	}

	return res.sendStatus(200);
})



app.get('/region', async (req, res) => {
	const rows = await db.query('select region, count(*) as nb from users where state = "validated" group by region order by region');
	const responseData = {};
	responseData.rows = rows;
	res.json(responseData);
})


app.get('/tag', async (req, res) => {

	const responseData = {};
	let   rows = undefined;

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

		rows = await db.query(sql, [req.query.tag]);
	}
	
	if (req.query.all) {
		// list all tags
		rows = await db.query(`
			select tag, count(*) as nb
			from tags
			group by tag
			order by nb desc, tag asc`
		);
	}

	if (req.query.books) {
		// list all tags attached to books
		rows = await db.query(`
			select tag, count(*) as nb
			from tags
			where book_id is not null
			group by tag
			order by nb desc, tag asc`
		);
	}
	
	responseData.tags = rows;
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


// update one's presentation
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


app.get('/book', async (req, res) => {

	let books = null;

	if (req.query.id) {
		const bid  = parseInt(req.query.id);
		books = await db.query('select * from books where id = ?', [bid]);
		if (! books.length) {
			return res.status(404).send("No book found with id=" + req.query.id);
		}
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
		books = await db.query(sql, []);
	}

	if (req.query.tag) {
		const sql = `
			select books.*
			from books, tags
			where books.id = tags.book_id
			  and tags.tag = ?
			order by id desc`;
		books = await db.query(sql, [req.query.tag]);
	}
	
	if (req.query.mid) {
		const mid = parseInt(req.query.mid);
		const sql = `
			select books.*
			from books, reviews
			where books.id = reviews.book_id
			  and reviews.mid = ?
			order by id desc`;
		books = await db.query(sql, [mid]);
	}
	
	if (req.query.all) {
		const sql = `select * from books order by id desc`;
		books = await db.query(sql);
	}

	books = await booksAddReviewsAndTags(books);

	return res.json({books: books, mid: user.mid});
});


async function booksAddReviewsAndTags(books) {
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

		// get tags
		const zetags = await db.query('select tag from tags where book_id = ?', [books[i].id]);
		let tags = [];
		for (const i in zetags) {
			tags.push(zetags[i].tag);
		}
		books[i].tags = tags;
	}
	return books;
}




async function getReviewsForBook(req, res) {
	let bid;
	if (req.query.id ) bid  = parseInt(req.query.id);
	if (req.body.id)   bid  = parseInt(req.body.id);

	if (bid) {
		const reviews = await db.query(`
			select reviews.*,
				users.mid,
				users.did,
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
		// book edit or comment add
		bid = parseInt(req.body.id);

		const book = await db.query('select * from books where id = ?', [bid]);
		
		if (! book.length) {
			return res.send('404: No book found with id=' + bid);
		}

		// book edit
		if (req.body.title || req.body.authors || req.body.year || req.file || req.body.tags) {
			if ((book[0].mid != user.mid) && (user.mid != 11248)) {
				return res.send('403: Not authorized to change book ' + bid);
			}
	
			await db.query('update books set title=?, authors=?, year=? where id = ?', [
				req.body.title,
				req.body.authors,
				parseInt(req.body.year),
				bid
			]);
		}

	} else {
		// add the book
		const book = await db.query('insert into books (title, authors, year, created_at, mid) values (?, ?, ?, ?, ?)', [
			req.body.title,
			req.body.authors,
			parseInt(req.body.year),
			moment().format('YYYY-MM-DD HH:mm:ss'),
			user.mid
		]);
		bid = book.insertId;
	}

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
	if (req.body.tags) {
		await db.query('delete from tags where book_id = ?', [bid]);

		req.body.tags.split(',').map((tag) => {
			tag = tag.trim();
			if (tag) {
				db.query('insert into tags (book_id, tag) values (?, ?)', [bid, tag]);
			}
		});
	}
	
	// add review
	if (req.body.rating) {
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
	}

	// case we were on the book page
	if (req.body.id) {
		return getReviewsForBook(req, res);
	}

	return res.sendStatus(200);
	// return getAllBooks(req, res);
})

// we only add a cover to the book
app.post('/book-update', upload.single('couv'), async (req, res) => {

	const bid = parseInt(req.body.id);

	// get the book
	const books = await db.query('select * from books where id = ?', [bid]);
	if (! books.length) {
		return res.status(404).send("No book found with id=" + req.query.id);
	}
	// is it my book?
	if (user.mid != books[0].mid && user.mid != 11248) {
		return res.status(403).send("you don't have write access to that book");
	}
	// handle cover upload
	if (req.file) {
		const ext = req.file.originalname.split('.').slice(-1)[0];
		if (['png', 'gif', 'jpg', 'jpeg'].includes(ext)) {
			fs.rename(req.file.path, 'static/book_cover/' + bid + '.' + ext, function (err) {
				if (err) throw err
				console.log('File ' + req.file.path + ' successfully moved to static/book_cover/' + bid + '.' + ext);
			});
			db.query('update books set cover_ext = ? where id = ?', [ext, bid]);
			books[0].cover_ext = ext;
		}
	}

	const tags = await db.query('select tag from tags where book_id = ?', [bid]);
	return res.json({rows: books, tags: tags});
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
			  and (
					adherent = 2
					or adherent is null
					or adherent_until is null
				--	or adherent_until < '` + moment().format('YYYY-MM-DD') +  `'
				  ) `);
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

	db.query(`
		update users
		set adherent  = ?,
			adherent_until = ?,
			code_postal = ?,
			departement = ?,
			pays = ?,
			birthdate = ?
			where mid = ?`, [
				noob.adherent,
				noob.adherent_until,
				noob.code_postal,
				noob.departement,
				noob.pays,
				noob.birthdate,
				noob.mid]
	);


	if (noob.region) {
		db.query(`
			update users
			set real_name = ?,
				region    = ?,
				email     = ?,
				state='found'
			where mid = ? and state = 'welcomed'`, [
				noob.name,
				noob.region,
				noob.email,
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
