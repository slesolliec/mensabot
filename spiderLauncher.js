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
spiderlauncher.findNewMensans = async function() {
	const newUsers = await db.query(`
		select *
		from users
		where state='welcomed'
		  and mid is not null
		order by mid desc`);

	while (newUsers.length) {
		const drWho = newUsers.pop();
		console.log("== WHO ==\n", drWho);
		try {
			const found = await spider.searchMensannuaire(drWho.mid);
		} catch (err) {
			console.error("Failed visiting page of mensan member " + drWho.mid);
			console.error(err);
			continue;
		}
		console.log("== Found ==\n", found);
		if (found.real_name) {
			await db.query("update users set real_name = ?, state='found' where mid = ?", [found.real_name, found.mid]);
			if (found.region) {
				await db.query("update users set region = ? where mid = ?",  [found.region, found.mid]);
			}
			if (found.email) {
				await db.query("update users set email = ? where mid = ?",  [found.email, found.mid]);
			}
		} else {
			await db.query("update users state='err_not_found' where mid = ?", [found.mid]);
		}
	}

	db.end();
	spider.close();
}


// spiderlauncher.fillEmptyNames();
// spiderlauncher.findNewMensans();

setInterval(spiderlauncher.findNewMensans, 120 * 1000);
