// does the same as spider.js except that it is not supposed to run on the same
// server as Mensa.cafe and Mensabot.
// It calls the Mensa.cafe API instead and sends back the data it got from
// the Mensa France annuaire.

// TODO: handle when cookie is too old

const needle  = require('needle');
const cheerio = require('cheerio');
const axios   = require('axios');
const moment  = require('moment');
const log     = require('./mods/log');
const conf    = require('./configs');


let cookies = {};

async function getCookies() {
	if (! cookies || ! cookies.lemonldap) {
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
	let birthdate = $('#identite div span').text().split("(")[0].trim().split(" ")[2].trim();
	let [bday, bmonth, byear] = birthdate.split("/");
	// to avoid SQL injections
	bday   = bday.slice(0, 2);
	bmonth = bmonth.slice(0, 2);
	byear  = byear.slice(0, 4);
	birthdate = byear +'-'+ bmonth +'-'+ bday;

	let pays = $('#identite div span a').html().split("<br>").slice(-1)[0].trim().split(",").slice(-1)[0].trim();
	let code_postal = null;
	let departement = null;
	if (pays.toUpperCase() == 'FRANCE') {
		code_postal = $('#identite div span a').html().split("<br>").slice(-1)[0].split(" ")[0].slice(0,5);
		if (parseInt(code_postal)) {
			departement = code_postal.slice(0,-3);
		} else {
			code_postal = null;
		}
	}

	let adherent_until = $('#fiche-perso table tbody tr td:nth-child(2)').html();
	let [aday, amonth, ayear] = adherent_until.split("/");
	// to avoid SQL injections
	aday   = aday.slice(0, 2);
	amonth = amonth.slice(0, 2);
	ayear  = ayear.slice(0, 4);
	adherent_until = ayear +'-'+ amonth +'-'+ aday;

	let adherent = 0;

	if (adherent_until > moment().format("YYYY-MM-DD")) {
		adherent = 1;
	}
	
	// we check email well formed
	if (! /\S+@\S+\.\S+/.test(email)) {
		console.error(`Email ${email} not valid for user ${mid}`);
		email = '';
	}

	// remove some un-necessary data
	name = name.replace('-information non publique-', '');

	let obj = {name, region, email, adherent, adherent_until, birthdate, code_postal, departement, pays};
	console.log(obj);

	return obj;
}


/**
 * Takes users from state 'welcomed' to state 'found' or 'err_not_found'
 */
findNewMensans = async function(old = false) {
	let url = conf.spider.url + '/api/spider';
	if (old) {
		url += '?outdated=1';
	}

	console.log("fetching", url);
	let {data} = await axios.get(url, {
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
		await processMensan(drWho);
	}

	while (unknowns.length) {
		const drWho = unknowns.pop();
		await processMensan(drWho);
	}
}

async function findOldMensans() {
	await findNewMensans(1);
}



async function processMensan(drWho) {
	// console.log("== WHO ==\n", drWho);
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
		return;
	}
	// console.log("== Found ==\n", found);
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




// fillEmptyNames();

setInterval(findNewMensans, 60 * 1000);
setInterval(findOldMensans, 24 * 60 * 60 * 1000);

findOldMensans();
