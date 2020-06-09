const bot = require('./mods/bot.js');


// we connect to Discord
bot.connect();

// welcome new users
setInterval(bot.welcome, 2000);
