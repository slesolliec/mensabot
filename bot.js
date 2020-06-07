const Discord = require('discord.js');
const client  = new Discord.Client();
const conf    = require('./configs');



client.once('ready', () => {
    console.log('Ready!');

    // loop on my guilds
    client.guilds.cache.forEach(processOneGuild);
});


// take a guild: list all its members
function processOneGuild(guild) {
    console.log("=== " + guild.name + " (" + guild.memberCount + " membres) ===");
    guild.members.fetch()
    .then(displayMembers)
    .catch(console.error)
}

// loop on member map
function displayMembers(memberMap) {
    memberMap.forEach(displayMember)
}

// display one member
function displayMember(member) {
    console.log(member.user.username + " (" + member.user.id + ")");
}




// chat bot basic loop
client.on('message', message => {
    // console.log(message.content);
    // console.log(message);
    
    message.channel.guild.members.fetch()
        .then(displayMembers)
        .catch(console.error)
    
/*
    if (! message.author.bot) {
        message.channel.send("je répond au message de " + message.author.username)
    }
*/

});


client.login(conf.botToken);
