const conf    = require('./configs');
const needle  = require('needle');
const cheerio = require('cheerio');


async function with_needle(mid) {

	// we get the token
	let resp = await needle("get","https://auth.mensa-france.net/");
	let $ = cheerio.load(resp.body);
	const token = $('#token').attr('value');
	console.log('got token:', token);

	// we get the cookie
	resp = await needle("post","https://auth.mensa-france.net/", {
		token,
		user:     conf.web.userid,
		password: conf.web.password
	});
	const cookies = resp.cookies;
	console.log('got cookie:', cookies.lemonldap);

	// get member page
	resp = await needle("get", conf.web.url + 'id=' + mid, {cookies});
	let html = resp.body.slice(resp.body.indexOf('<body'));
    $ = cheerio.load(html);
    let name = $('#identite span:nth-child(2)').text();
    if (! name) {                           
        let message = $('#fiche-perso').text().trim();
        throw `Error getting info for ${mid}: ${message}`;
    }       
	let region = $('#identite').text().split("\n")[2].trim().split('-').slice(-1)[0].trim();
	let email  = $('#contacts div.email a').text();

	// check email well formed
	if (! /\S+@\S+\.\S+/.test(email)) {
		throw `Email ${email} not valid for user ${mid}`;
	}

	// now check if still a member
	let adherent = false;
	const query = `recherche=(nom:${name.split(' ').slice(-1)[0]})(region:${region})(type_contact:mail)(contact:${email})(cotisation:oui)`;
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


try {
	with_needle(4098);
} catch (err) {
	console.error(err);

}


