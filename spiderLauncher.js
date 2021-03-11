// this looks at the database and fetches info from the annuaire

const db  = require('./mods/db');
const spider = require('./mods/spider')

const spiderlauncher = {};

/**
Strangely, we have some missing names and regions in the bot's database.
This function lists them all and tries to fill them looking up the annuaire.
*/
spiderlauncher.fillEmptyNames = async function() {
	const nonames = await db.query("select * from users where state='validated' and real_name = '' order by mid");
	// console.log(nonames);
	nonames.reverse();

	while (nonames.length) {
		const drWho = nonames.pop();
		console.log("== WHO ==\n", drWho);
		const found = await spider.searchMensannuaire(drWho.mid);
		console.log("== Found ==\n", found);
		await db.query("update users set real_name = \"" + found.real_name +"\" where mid = " + found.mid);
		if ( ! drWho.region) {
			await db.query("update users set region = \""+ found.region    +"\" where mid = " + found.mid);
		}
	}

	db.end();
}


spiderlauncher.fillEmptyNames();
