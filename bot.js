const Discord = require('discord.js');
const client  = new Discord.Client();
const conf    = require('./configs');



client.once('ready', () => {
	console.log('Ready!');
});

client.login(conf.botToken);

client.on('message', message => {
//    console.log(message.content);
    console.log(message);
    
    if (! message.author.bot) {
        message.channel.send("je répond au message de " + message.author.username)
    }

});

