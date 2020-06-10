const Discord = require('discord.js');
const client  = new Discord.Client();
const conf    = require('../configs');
const db      = require('./db');
const fs      = require('fs');
const log     = require('./log');

const bot = {};

client.once('ready', () => {
    console.log('Bot is connected to Discord');

    // loop on my guilds
    client.guilds.cache.forEach(processOneGuild);
});


// take a guild: list all its members
function processOneGuild(guild) {
    console.log("=== " + guild.name + " (" + guild.memberCount + " membres) ===");

    // check we know that guild
    db.get("select * from guilds where gid = ?", guild.id, (err, row) => {
        if (err) return console.log(err.message);

        if (row) return;
        
        db.run("insert into guilds(gid, name) values(?, ?)", [guild.id, guild.name], handlerr);
    })

    // we get the list of members of that guild
    guild.members.fetch()
        .then(processAllMembers)
        .catch(console.error)
}

// loop on member map
function processAllMembers(memberMap) {
    memberMap.forEach(checkMember)
}

// check that this member is inside our database
function checkMember(member) {
    // we don't care about bots
    if (member.user.bot) {
        return;
    }

    // check we know that user
    db.get("select * from users where did = ?", member.user.id, (err, row) => {
        if (err) return console.error(err.message);

        if (! row) {
            // member is not here
            db.run("insert into users(did, discord_name) values(?, ?)", [member.user.id, member.user.username], handlerr)
        }
    });

    // check we have the user / guild relationship
    db.get("select * from members where gid = ? and did = ?", [member.guild.id, member.user.id], (err, row) => {
        if (err) {
          return console.error(err.message);
        }

        if (! row) {
            // member is not here
            db.run("insert into members(gid, did) values(?, ?)", [member.guild.id, member.user.id], handlerr)
        }
      
    })

    console.log(member.user.username + " (" + member.user.id + ")");
}


// handle errors
function handlerr(err) {
    if (err) {
        console.error(err.message);
    }
}

// welcome new users
bot.welcome = function() {
    // we look for a new user
    db.get("select cast(did as text) as did, discord_name from users where state = 'new' and did = '396752710487113729' limit 1", [], (err, row) => {
        if (err) return console.error(err.message);

        if (! row) return;

        const msgWelcome = fs.readFileSync('./messages/welcome.txt', 'utf-8')
            .replace(/##username##/g, row.discord_name)
            .replace(/##botname##/g, client.user.username);

        let user = client.users.cache.get(row.did);
        if (! user) {
            log.error("Impossible de trouver l'utilisateur "+ row.did);
            return;
        }

        sendDirectMessage(user, msgWelcome);
        db.run("update users set state = 'welcomed' where did = ?", [row.did]);
    })
}

/**
 * Sends message msg to user destUser. (with log)
 * @param {*} destUser: Discord user
 * @param {string} msg: content of the message
 */
function sendDirectMessage(destUser, msg) {
    destUser.send(msg);
    log.msgout(destUser.username, msg);
}



// chatbot basic loop
client.on('message', handleIncomingMessage);

function handleIncomingMessage(message) {
    // check it is not our own message
    if (message.author.id == client.user.id) return;

    // check if it is not a message from a bot
    if (message.author.bot) return;

    // we only reply to direct messages
    if (message.channel.type != 'dm') return;

    // logs
    console.log(message);
    log.msgin(message.author.username, message.content);

    // get user
    db.get("select cast(did as text) as did, discord_name, mid, state from users where did = ? and did = '396752710487113729'", [message.author.id], (err, row) => {
        if (err) return console.error(err.message);

        // check we know the person
        if (! row) {
            sendDirectMessage(message.author, "Bonjour, je n'ai pas l'impression de vous connaître. Pouvez-vous me recontacter dans un moment ?");
            return;
        }

        // check the state is welcomed or new
        if ((row.state != 'new') && (row.state != 'welcomed')) {
            sendDirectMessage(message.author, "Bonjour, je n'ai rien d'autre à vous dire. Revenez dans quelques jours quand je serais plus locace.");
            return;
        }

        // we are expecting a Mensa number
        const mid = parseInt(message.content.split(' ').pop().replace(/[^0-9]/g, ''));
        if (isNaN(mid) || (mid < 0)) {
            sendDirectMessage(message.author, "Je m'attendais à votre numéro de Mensan. Pourriez-vous me le donner ?");
            return;
        }

        // we already know his mid?
        // important to check so people don't change their mid
        if (row.mid) {
            sendDirectMessage(message.author, "Vous m'avez déjà donné votre numéro de Mensan. Merci d'être patient.");
            return;
        }

        // check if we already have that number
        db.get("select * from users where mid=?", [mid], (err, row) => {
            if (err) {
                sendDirectMessage(message.author, "Aïe, une erreur interne m'empêche de traiter votre message. Je suis désolé.");
                return console.error(err.message);
            }

            if (row) {
                if (row.discord_name == message.author.name) {
                    sendDirectMessage(message.author, "Vous m'aviez déjà envoyé votre numéro de Mensa. Je l'ai bien noté, merci.");
                    return;
                }
                sendDirectMessage(message.author, "Ce numéro de Mensan est déjà dans ma base de données, mais il est attribué à un autre utilisateur. Désolé, mais je ne peux pas traiter votre demande.");
                return;
            }

            // we store the user Mensa number
            db.run("update users set mid = ? where did = ? and mid is null", [mid, message.author.id], (err) => {
                if (err) {
                    sendDirectMessage(message.author, "Aïe, une erreur interne m'empêche de traiter votre message. Je suis désolé.");
                    return console.error(err.message);
                }
                
                sendDirectMessage(message.author, "J'ai bien enregistré votre numéro de Mensa: **" + mid + "**."
                    +"\nJe vais mantenant consulter l'annuaire de Mensa France et vous envoyer un code de confirmation à votre adresse email."
                    +"\n\nMerci de consulter vos emails dans quelques minutes.");
            });
        })

        db.run("update users set mid=? where did=? and mid is null", [mid, message.author.id], handlerr);

    });
}





bot.connect = function() {
    client.login(conf.botToken);
}


module.exports = bot;
