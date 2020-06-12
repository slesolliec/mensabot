const bot = require('./mods/bot.js');


// we connect to Discord
bot.connect();

// welcome new users
setInterval(bot.welcome, 10 * 1000);

setInterval(bot.sendCode, 20 * 1000);
