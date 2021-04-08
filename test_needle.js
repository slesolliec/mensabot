const conf    = require('./configs');
const needle  = require('needle');
const cheerio = require('cheerio');


async function with_needle(mid) {

	// we get the token
	let resp = await needle("get","https://auth.mensa-france.net/");
	let $ = cheerio.load(resp.body);
	const token = $('#token').attr('value');

	// we get the cookie
	resp = await needle("post","https://auth.mensa-france.net/", {
		token,
		user:     conf.web.userid,
		password: conf.web.password
	});
	const cookies = resp.cookies;
	console.log(cookies);

	// get member page
	resp = await needle("get", conf.web.url + 'id=' + mid, {cookies});
	$ = cheerio.load(resp.body);
	let name   = $('#identite span:nth-child(2)').text();
	let region = $('#identite').text().split("\n")[2].trim().split('-').slice(-1)[0].trim();
	let email  = $('#contacts div.email a').text();

	// TODO: check email well formed
	if (! /\S+@\S+\.\S+/.test(email)) {
		throw `Email ${email} not valid for user ${mid}`;
	}

	// now check if still a member
	let adherent = false;
	const query = `recherche=(nom:FFF${name.split(' ').slice(-1)[0]})(region:${region})(type_contact:mail)(contact:${email})(cotisation:oui)`;
	resp = await needle("get", conf.web.url + query, {cookies});
	let html = resp.body.slice(resp.body.indexOf('<body'));
	$ = cheerio.load(html);
	$('#resultats tbody tr').each((i, el) => {
		if ($(el).find('td:nth-child(1)').text() == mid) {
			adherent = true;
		}
	});

	console.log({name, region, email, adherent});
	return {name, region, email, adherent};
}

with_needle(4098);


