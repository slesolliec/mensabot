// this looks at the database and fetches info from the annuaire
// this script is supposed to run on the same server as the MensaBot
// and Mensa.cafe, but as I have stupid issues on them, I am now using
// spider2.js

const db  = require('./mods/db');
const log = require('./mods/log');
const needle  = require('needle');
const cheerio = require('cheerio');
const conf    = require('./configs');


let cookies;

async function getDataFromMensannuaire(mid) {

	if (! cookies) {
		// we get the token
		let resp = await needle("get","https://auth.mensa-france.net/");
		let $ = cheerio.load(resp.body);
		const token = $('#token').attr('value');
		log.debug("got token " + token);

		// we get the cookie
		resp = await needle("post","https://auth.mensa-france.net/", {
			token,
			user:     conf.web.userid,
			password: conf.web.password
		});
		cookies = resp.cookies;
		log.debug("got cookie " + cookies.lemonldap);
	}

	// we get member page
	resp = await needle("get", conf.web.url + 'id=' + mid, {cookies});
	let html = resp.body.slice(resp.body.indexOf('<body'));
    $ = cheerio.load(html);
    let name = $('#identite span:nth-child(2)').text();
    if (! name) {                           
        let message = $('#fiche-perso').text().trim();
		cookies = null;
        throw `Error getting info for ${mid}: ${message}`;
    }       
	let region = $('#identite').text().split("\n")[2].trim().split('-').slice(-1)[0].trim();
	let email  = $('#contacts div.email a').text();

	// we check email well formed
	if (! /\S+@\S+\.\S+/.test(email)) {
		throw `Email ${email} not valid for user ${mid}`;
	}

	// we check if still a member
	let adherent = false;
	const query = `recherche=(nom:${name.split(' ').slice(-1)[0]})(region:${region})(type_contact:mail)(contact:${email})(cotisation:oui)`;
	resp = await needle("get", conf.web.url + query, {cookies});
	$ = cheerio.load(resp.body);
	$('#resultats tbody tr').each((i, el) => {
		if ($(el).find('td:nth-child(1)').text() == mid) {
			adherent = true;
		}
	});

	return {name, region, email, adherent};
}



/**
Strangely, we have some missing names and regions in the bot's database.
This function lists them all and tries to fill them looking up the annuaire.
*/
async function fillEmptyNames() {
	const nonames = await db.query("select * from users where state='validated' and real_name = '' order by mid");
	// console.log(nonames);
	nonames.reverse();

	while (nonames.length) {
		const drWho = nonames.pop();
		console.log("== WHO ==\n", drWho);
		const found = await spider.searchMensannuaire(drWho.mid);
		console.log("== Found ==\n", found);
		await db.query("update users set real_name = ? where mid = ?", [found.real_name, found.mid]);
		if ( ! drWho.region) {
			await db.query("update users set region = ? where mid = ?",  [found.region, found.mid]);
		}
	}

	db.end();
	spider.close();
}


/**
 * Takes users from state 'welcomed' to state 'found' or 'err_not_found'
 */
findNewMensans = async function() {
	let newUsers;
	try {
		newUsers = await db.query(`
		select *
		from users
		where state='welcomed'
		  and mid is not null
		order by mid desc`);
	} catch (error) {
		if (error.code == 'POOL_CLOSED') {
			log.error("db connection pool was closed.");
//			db.end();
			return;
		} else {
			log.error("Error trying to find new mensan in db.");
			console.error(error);
			process.exit();
		}
	}

	if (newUsers.length == 0) {
		db.query("update store set val = ? where `key` = 'spider_lastping'", [Date.now()]);
	}

	while (newUsers.length) {
		const drWho = newUsers.pop();
		console.log("== WHO ==\n", drWho);
		let found;
		try {
			found = await getDataFromMensannuaire(drWho.mid);
		} catch (err) {
			log.error("Failed visiting page of mensan member " + drWho.mid);
			console.error(err);
			continue;
		}
		console.log("== Found ==\n", found);
		if (found) {
			await db.query(`
				update users
				set real_name = ?,
				    region    = ?,
					email     = ?,
					state='found'
				where mid = ?`, [found.name, found.region, found.email, drWho.mid]);
			db.query("update store set val = ? where `key` = 'spider_lastping'", [Date.now()]);
		} else {
			await db.query("update users state='err_not_found' where mid = ?", [drWho.mid]);
		}
	}

}


// fillEmptyNames();

setInterval(findNewMensans, 60 * 1000);

findNewMensans();
