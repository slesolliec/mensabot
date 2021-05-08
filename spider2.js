// does the same as spider.js except that it is not supposed to run on the same
// server as Mensa.cafe and Mensabot.
// It calls the Mensa.cafe API instead and sends back the data it got from
// the Mensa France annuaire.

// TODO: handle when cookie is too old

const needle  = require('needle');
const cheerio = require('cheerio');
const axios   = require('axios');
const log     = require('./mods/log');
const conf    = require('./configs');


let cookies = {};

async function getCookies() {
	if (! cookies.lemonldap) {
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
	return;
}


async function checkIsMember(mid, name, region, email) {

	await getCookies();

	let adherent = null;

	// search via email
	let query = `recherche=(region:${region})(type_contact:mail)(contact:${email})(cotisation:oui)`;
	console.log(query);
	let resp = await needle("get", conf.web.url + query, {cookies});
	$ = cheerio.load(resp.body);
	$('#resultats tbody tr').each((i, el) => {
		id = parseInt($(el).text().trim().split("\n")[0].trim());
		console.log('id=', id);
		if (id == mid) {
			adherent = true;
		}
	});
	if (adherent) { return true; }

	// search via name
	query = `recherche=(nom:${name.split(' ').slice(-1)[0]})(region:${region})(cotisation:oui)`;
	console.log(query);
	resp = await needle("get", conf.web.url + query, {cookies});
	$ = cheerio.load(resp.body);
	$('#resultats tbody tr').each((i, el) => {
		id = parseInt($(el).text().trim().split("\n")[0].trim());
		console.log('id=', id);
		if (id == mid) {
			adherent = true;
		}
	});
	if (adherent) { return true; }

	// search via email
	query = `recherche=(region:${region})(type_contact:mail)(contact:${email})(cotisation:non)`;
	console.log(query);
	resp = await needle("get", conf.web.url + query, {cookies});
	$ = cheerio.load(resp.body);
	$('#resultats tbody tr').each((i, el) => {
		id = parseInt($(el).text().trim().split("\n")[0].trim());
		console.log('id=', id);
		if (id == mid) {
			adherent = 'faux';
		}
	});
	if (adherent == 'faux') { return false; }

	// search via name
	query = `recherche=(nom:${name.split(' ').slice(-1)[0]})(region:${region})(cotisation:non)`;
	console.log(query);
	resp = await needle("get", conf.web.url + query, {cookies});
	$ = cheerio.load(resp.body);
	$('#resultats tbody tr').each((i, el) => {
		id = parseInt($(el).text().trim().split("\n")[0].trim());
		console.log('id=', id);
		if (id == mid) {
			adherent = 'faux';
		}
	});
	if (adherent == 'faux') { return false; }

	// search via first name
	query = `recherche=(prenom:${name.split(' ')[0]})(region:${region})(cotisation:oui)`;
	console.log(query);
	resp = await needle("get", conf.web.url + query, {cookies});
	$ = cheerio.load(resp.body);
	$('#resultats tbody tr').each((i, el) => {
		id = parseInt($(el).text().trim().split("\n")[0].trim());
		console.log('id=', id);
		if (id == mid) {
			adherent = true;
		}
	});
	if (adherent) { return true; }

	// search via first name
	query = `recherche=(prenom:${name.split(' ')[0]})(region:${region})(cotisation:nom)`;
	console.log(query);
	resp = await needle("get", conf.web.url + query, {cookies});
	$ = cheerio.load(resp.body);
	$('#resultats tbody tr').each((i, el) => {
		id = parseInt($(el).text().trim().split("\n")[0].trim());
		console.log('id=', id);
		if (id == mid) {
			adherent = "faux";
		}
	});
	if (adherent == "faux") { return false; }

	return '2';
}



async function getDataFromMensannuaire(mid) {

	await getCookies();

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
	const adherent = await checkIsMember(mid, name, region, email);

	return {name, region, email, adherent};
}


/**
 * Takes users from state 'welcomed' to state 'found' or 'err_not_found'
 */
findNewMensans = async function() {
	let {data} = await axios.get(conf.spider.url + '/api/spider', {
		auth: {
			username: 'spider',
			password: conf.spider.password
		  }
	});

	// console.log(data);
	
	let noobs    = data.noobs;
	let unknowns = data.unknowns;

	log.debug("Found " + noobs.length + " new Mensan(s).");
	if (noobs.length) {
		console.log(noobs);
	}

	while (noobs.length) {
		const drWho = noobs.pop();
		console.log("== WHO ==\n", drWho);
		let found;
		try {
			found = await getDataFromMensannuaire(drWho.mid);
			found.mid = drWho.mid;
			// nan mais c'est quoi ce sexisme d'un autre age !!! ;-)
			found.name = found.name
				.replace('Monsieur ',     '')
				.replace('Madame ',       '')
				.replace('Mademoiselle ', '');
		} catch (err) {
			log.error("Failed visiting page of mensan member " + drWho.mid);
			console.error(err);
			continue;
		}
		console.log("== Found ==\n", found);
		if ( ! found) {
			found = { mid: drWho.mid, status: 404};
		}

		axios.post(conf.spider.url + '/api/spider', found, {
			auth: {
				username: 'spider',
				password: conf.spider.password
			}
		});
	}


	// console.log(unknowns);

	while (unknowns.length) {
		const drWho = unknowns.pop();
		console.log("== WHO ==\n", drWho);

		const adherent = await checkIsMember(drWho.mid, drWho.real_name, drWho.region, drWho.email);
		console.log(drWho.real_name, 'is', adherent);

		axios.post(conf.spider.url + '/api/spider', {mid: drWho.mid, adherent: adherent}, {
			auth: {
				username: 'spider',
				password: conf.spider.password
			}
		});
	}

}


// fillEmptyNames();

setInterval(findNewMensans, 60 * 1000);

findNewMensans();
