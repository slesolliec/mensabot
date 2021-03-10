const util   = require('util');
const conf   = require('./configs');
const moment = require('moment');

const exec = util.promisify(require('child_process').exec);



async function dump_db() {
	try {
		const cmd = 'mysqldump -u ' + conf.mysql.user + ' -p' + conf.mysql.password
			+ ' --no-tablespaces ' + conf.mysql.database
			+ ' > dumps/mensabot_dump_' + moment().format('YYYY-MM-DD') + '.sql';
		const { stdout, stderr } = await exec(cmd);
		console.log('stdout:', stdout);
		console.log('stderr:', stderr);
	} catch (err) {
		console.error(err);
	}
}


dump_db();
