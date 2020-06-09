const colors = require('colors/safe');
const moment = require('moment');

var conf = require('../configs');

// that object will be exported (commonJS module patern)
var log = {}


// gives memory used in Mega-Bytes
function memoryUsed() {
	var memory = Math.round(process.memoryUsage().heapUsed /1024 /1024 * 100).toString();
	return memory.slice(0,-2) + "." + memory.slice(-2) + "MB";
}


function logger(msg) {
	console.log(moment().format('YYYY-MM-DD HH:mm:ss'), colors.bold(memoryUsed()), msg);
}


log.msgout = function(to, msg) {
    logger(colors.green('[>> ' + to + ']') + ' ' + msg);
}

log.msgin = function(from, msg) {
    logger(colors.yellow('[' + from + ' >>]') + ' ' + msg);
}

log.debug = function (msg) {
	logger(colors.cyan(msg));
}

log.warning = function (msg) {
	logger( colors.yellow("[] ") + msg);
}

log.error = function (msg, e) {
	// console.log(e);
	logger( colors.bold.red("[ERROR] ") + msg + (e || ''));
}

module.exports = log;
