const Discord = require('discord.js');
const client  = new Discord.Client({ ws: { intents: Discord.Intents.ALL }});
const conf    = require('../configs');
const db      = require('./db');
const fs      = require('fs');
const log     = require('./log');
const nodemailer = require('nodemailer');

const bot = {};

bot.isMaintenance = false;

client.once('ready', () => {
    log.debug('Bot is connected to Discord');

    // set all guilds to is_active = 0
    db.query("update guilds set is_active = 0");

    // loop on my guilds
    client.guilds.cache.forEach(processOneGuild);
});

client.on('guildMemberAdd', reMember);
client.on('message', handleIncomingMessage);


/**
 * Take a guild and list all of its members
 * @param {Discord.Guild} guild 
 */
async function processOneGuild(guild) {
    console.log("=== " + guild.name + " (" + guild.memberCount + " membres) ===");

    // check we know that guild
    const checkGuild = await db.getGuild(guild.id);
    if (! checkGuild)
        await db.query("insert into guilds(gid, name) values(?, ?, 1)", [guild.id, guild.name]);

    db.query("update guilds set is_active = 1 where gid = ?", [guild.id]);


    // set owner of guild in members table
    db.query("update members set state='owner' where gid = ? and did = ?", [guild.id, guild.ownerID]);
    // console.log(guild.ownerID);
    
    // list roles of guild
    guild.roles.cache.map(role => console.log('rôle:', '[', role.guild.name, ']', role.name, 'id:', role.id));

    // we get the list of members of that guild
    guild.members.fetch()
        .then(processAllMembers)
        .catch(console.error)
}

// loop on member map
function processAllMembers(memberMap) {
    memberMap.forEach(reMember)
}

/**
 * Store that member into DataBase, so that we remember that member.
 * @param {Discord.GuildMember} member
 */
async function reMember(member) {
    // we don't care about bots
    if (member.user.bot) return;

    // check we know that user
    let theUser = await db.getUser(member.user.id);
    if (! theUser) {
        // member is not here
        await db.query("insert into users(did, discord_name, discord_discriminator, discord_avatar) values(?, ?, ?, ?)", [
            member.user.id,
            member.user.username,
            member.user.discriminator,
            member.user.avatar
        ]);
        // theUser = await db.getUser(member.user.id);
    } else {
        // we update the avatar
        await db.query("update users set discord_avatar = ? where did = ?", [
            member.user.avatar,
            member.user.id
        ]);
    }

    // check we know the guild
    let theGuild = await db.getGuild(member.guild.id);
    if (! theGuild) {
        await db.query("insert into guilds(gid, name) values(?, ?)", [member.guild.id, member.guild.name]);
        theGuild = await db.getGuild(member.guild.id);
    }

    // check we have the user / guild relationship
    let theMember = await db.getMember(member.guild.id, member.user.id);
    if (! theMember) {
        // member is not here
        await db.query("insert into members(gid, did) values(?, ?)", [member.guild.id, member.user.id]);
        theMember = await db.getMember(member.guild.id, member.user.id);
    }

    // check if the member is alreayd identified as Mensan
    if (theMember.state == 'member')
        return;

    // we check if the member has already the mensan role
    if (theGuild.mensan_role)
        if (member.roles.cache.has(theGuild.mensan_role))
            db.query('update members set state="member" where gid = ? and did = ?', [member.guild.id, member.user.id]);
}


/**
 * This gets the message to send to a user. Each guild has its set of personnal messages.
 * @param {*} newUser 
 * @param {string} type: type of the message: can be 'welcome' or 'validated'
 * @returns {string} : template of the message
 */
async function getMessage(newUser, type) {
    // we get the guild of the user
    const guild = await db.getOne("select * from members where did = ? limit 1", [newUser.did]);

    if (! guild) {
        log.error("user " + newUser.did + " has no guild");
        throw "user " + newUser.did + " has no guild";
    }

    // we read the guild's message
    const msg = fs.readFileSync('./messages/guild_' + guild.gid + '/' + type + '.txt', 'utf-8');

    return msg;
}


// welcome new users
bot.welcome = async function() {

    if (bot.isMaintenance) return;

    db.query("update store set val = ? where `key` = 'bot_lastping'", [Date.now()]);

    // we look for a new user that belongs to a guild that is active (= mensan_role not null)
    const newUser = await db.getOne(`
        select users.did, users.discord_name
        from users, members, guilds
        where users.state = 'new'
          and users.did = members.did
          and members.gid = guilds.gid
          and guilds.mensan_role is not null
        limit 1
        `, []);

    if (! newUser) return;

    // compose welcome message
    let msgWelcome = await getMessage(newUser, 'welcome');
    msgWelcome = msgWelcome
        .replace(/##username##/g, newUser.discord_name)
        .replace(/##botname##/g, client.user.username);

    // get Discord user
    let user = client.users.cache.get(newUser.did);
    if (! user) {
        log.error("Impossible de trouver l'utilisateur "+ newUser.did);
        return;
    }

    sendDirectMessage(user, msgWelcome);
    db.query("update users set state = 'welcomed' where did = ?", [user.id]);
}


/**
 * Sends message msg to user destUser. (with log)
 * @param {*} destUser: Discord user
 * @param {string} msg: content of the message
 */
function sendDirectMessage(destUser, msg) {
    destUser.send(msg);
    log.msgout(destUser.username + ' / ' + destUser.id, msg);
}


/**
 * This is the chatbot base loop
 * @param {Discord.Message} message
 */
async function handleIncomingMessage(message) {
    // check it is not our own message
    if (message.author.id == client.user.id) return;

    // check if it is not a message from a bot
    if (message.author.bot) return;

    // we only reply to direct messages
    if (message.channel.type != 'dm') return;

    // logs
    // console.log(message);
    log.msgin(message.author.username + ' / ' + message.author.id, message.content);

    // commands from admin
    if (message.author.id == conf.botAdmin.did) {
        switch (message.content) {
            case 'maintenance':
                bot.isMaintenance = true;
                client.user.setPresence({ activity: { name: 'En maintenance.' }, status: 'dnd' });
                break;
            case 'wake up':
            case 'wakeup':
            case 'wakup':
                bot.isMaintenance = false;
                client.user.setPresence({ activity: { name: 'A votre service.' }, status: 'idle' });
                break;
        }
    }

    if (bot.isMaintenance) {
        sendDirectMessage(message.author, "Je suis en maintenance. Revenez plus tard.");
        return;
    }

    // get user
    const theUser = await db.getUser(message.author.id);

    // check we know the person
    if (! theUser) {
        sendDirectMessage(message.author, "Bonjour, je n'ai pas l'impression de vous connaître. Pouvez-vous me recontacter dans un moment ?");
        return;
    }

    if ((theUser.state != 'vcode_sent') && (theUser.state != 'new') && (theUser.state != 'welcomed')) {
        sendDirectMessage(message.author, "Bonjour, je n'ai rien d'autre à vous dire. Revenez dans quelques jours quand je serais plus locace.");
        return;
    }

    // check the state is welcomed or new
    if ((theUser.state == 'new') || (theUser.state == 'welcomed')) {

        // we are expecting a Mensa number
        const mid = parseInt(message.content.split(' ').pop().replace(/[^0-9]/g, ''));
        if (isNaN(mid) || (mid < 1)) {
            sendDirectMessage(message.author, "Je m'attendais à votre numéro de Mensan. Pourriez-vous me le donner ?");
            return;
        }

        // we already know his mid?
        // important to check so people don't change their mid
        if (theUser.mid) {
            sendDirectMessage(message.author, "Vous m'avez déjà donné votre numéro de Mensan. Merci d'être patient.");
            return;
        }

        // check if we already have that number
        const checkUser = await db.getOne("select cast(did as char) as did from users where mid=?", [mid]);
        if (checkUser) {
            if (checkUser.did == message.author.id) {
                sendDirectMessage(message.author, "Vous m'aviez déjà envoyé votre numéro de Mensa. Je l'ai bien noté, merci.");
                return;
            }
            sendDirectMessage(message.author, "Ce numéro de Mensan est déjà dans ma base de données, mais il est attribué à un autre utilisateur. Désolé, mais je ne peux pas traiter votre demande.");
            return;
        }

        // we store the user Mensa number
        db.query("update users set mid = ? where did = ? and mid is null", [mid, message.author.id]);
        sendDirectMessage(message.author, "J'ai bien enregistré ton numéro d'adhérant: **" + mid + "**"
            + "\nMerci de patienter pendant que je vérifie ton identité dans l'annuaire de l'association.");
        return;
    }


    if (theUser.state == 'vcode_sent') {

        // we are expecting a validation code
        const vcode = message.content.split(' ').pop().trim().replace(/[^0-9]/g, '');
        if (vcode.length != 6) {
            sendDirectMessage(message.author, "Je n'ai pas compris votre code de validation. Pourriez-vous me le redonner ?\n"
                + "Il s'agit d'un code à 6 chiffres qui vous a été envoyé par email.");
            return;
        }

        // maximum 3 trials
        if (theUser.validation_trials > 2) {
            sendDirectMessage(message.author, "Vous avez déjà essayé 3 fois de valider votre inscription.\n"
                + "Merci de contacter un administrateur du serveur pour qu'il vous valide manuellement.");
            return;
        }

        // we check the validation code is good
        if (theUser.validation_code == vcode) {
            db.query("update users set state='validated' where did = ?", [message.author.id]);

            sendDirectMessage(message.author, await getMessage(theUser, 'validated'));
            return;

        } else {
            sendDirectMessage(message.author, "Votre code de validation ne semble pas être le bon.\n"
                +"Ré-essayez, ou bien contactez un administrateur du serveur, pour voir ce qu'il peut faire.");
            db.query("update users set validation_trials = validation_trials + 1 where did = ?", [message.author.id]);
        }
    }
}


/**
 * We get one member that should receive a validation code
 * and process it
 */
bot.sendCode = async function() {
    // log.debug("Any new user?");
    if (bot.isMaintenance) return;

    const newUsers = await db.query(
        `select cast(did as char) as did,
            mid,
            discord_name,
            real_name,
            region,
            departement,
            email,
            state,
            validation_code,
            validation_trials
        from users
        where state = 'found'
        limit 1`);
    newUsers.map(processFoundMensan);
}


async function processFoundMensan(rowUser) {

    if (bot.isMaintenance) return;

    // get discord user
    let discordUser = client.users.cache.get(rowUser.did);
    if (! discordUser) {
        log.error("Impossible de trouver l'utilisateur "+ rowUser.did + " / " + rowUser.mid);
        return;
    }

    // check he has a name
    if ( ! rowUser.real_name) {
        log.warning("Mensa member " + rowUser.mid + " does not seem to have a name. We probably don't have a good Mensa id");
        console.log(rowUser);
        sendDirectMessage(discordUser, "Ah mince, je n'arrive pas à trouver votre nom dans l'annuaire des membres de Mensa."
            + "\nMerci de contacter un des administrateurs du serveur pour valider votre état de membre de Mensa.");
        db.query("update users set state = 'err_no_name' where did = ?", [rowUser.did]);
        return;
    }

    // check he has email
    if ( ! rowUser.email) {
        console.log("Mensa member does not seem to have an email address.");
        console.log(rowUser);
        sendDirectMessage(discordUser, "Ah mince, votre adresse email n'est pas présente dans l'annuaire des membres de Mensa."
            + "\nMerci de contacter un des administrateurs du serveur pour valider **manuellement** votre état de membre de Mensa.");
        db.query("update users set state = 'err_no_mail' where did = ?", [rowUser.did]);
        return;
    }

    // we create the validation code if not already created
    if ( ! rowUser.validation_code) {
        function getRandomInt(max) {
            return Math.floor(Math.random() * Math.floor(max));
        }
    
        rowUser.validation_code = ''
            + getRandomInt(10)
            + getRandomInt(10)
            + getRandomInt(10)
            + getRandomInt(10)
            + getRandomInt(10)
            + getRandomInt(10);
    
        db.query("update users set validation_code = ? where mid = ?", [rowUser.validation_code, rowUser.mid])
    }

    sendValidationCode(rowUser, discordUser);
}


// send validation code via email
async function sendValidationCode(rowUser, discordUser) {

    if (bot.isMaintenance) return;

    // send the email with validation code
    const transporter = nodemailer.createTransport({
        host: conf.smtp.host,
        port: 465,  //
        secure: true, // true for 465, false for other ports
        auth: {
            user: conf.smtp.user,
            pass: conf.smtp.password
        }
    });

    let msgWelcome = await getMessage(rowUser, 'email_validation_code');
    msgWelcome = msgWelcome
        .replace(/##real_name##/g,      rowUser.real_name)
        .replace(/##validationCode##/g, rowUser.validation_code)
        .replace(/##botAdminName##/g,   conf.botAdmin.name)
        .replace(/##botAdminEmail##/g,  conf.botAdmin.email);

    const mailOptions = {
        from:    'MensaBot <' + conf.botAdmin.email + '>',
        to:      rowUser.email,
        subject: 'Votre code de confirmation MensaBot Discord',
        text:    msgWelcome
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log("Error sending email to", rowUser, error);
        } else {
            console.log('Email sent: ' + info.response);
            db.query("update users set state = 'vcode_sent' where mid = ?", [rowUser.mid]);
            sendDirectMessage(discordUser, "Un code de validation vient d'être envoyé à ton adresse email."
               + "\nIl ne te reste plus qu'à le recopier ici-même.");
        }
    });
}


/**
 * We give the discord roles to all who deserve it
 */
bot.promote = async function() {

    if (bot.isMaintenance) return;

    // we fetch all roles that should be added to the member
    let sql = `
    select cast(guilds.gid         as char) as gid,
           cast(guilds.mensan_role as char) as rid, -- role id
           cast(users.did          as char) as did
    from guilds, members, users
    where guilds.gid = members.gid
      and members.did = users.did
      and members.state is null
      and users.state = 'validated'
      and guilds.mensan_role is not null
    `;

    const roles = await db.query(sql);

    // log.debug(roles);
    roles.map(giveRoleToMember);
}

/**
 * Gives all mensa roles for each guild the user is in
 * @param {integer} did : discord id of the user to promote
 */
async function giveRoleToMember(row) {
    // we don't get the discord user
    // because discord users cannot have roles
    // it's only members who can

    // console.log(row);
    if (bot.isMaintenance) return;

    const guild = client.guilds.cache.get(row.gid);
    if (! guild) {
        log.error("Error404: Guild " + row.gid + " not found !!!");
        return;
    }
    // console.log('==== The Guild ===\n', guild);

    const member = guild.members.cache.get(row.did);
    if (! member) {
        log.error("Error404: Member " + row.did + " not found in guild " + guild.name);
        return;
    }
    // console.log('=== The Member ===\n', member);

    // check if bot hasPermission(['MANAGE_ROLES'])
    if ( ! guild.me.hasPermission('MANAGE_ROLES')) {
        log.error("ouiinnnn, je n'ai pas le droit de changer les rôles sur " + guild.name);
        /* TOO Dangerous of producing too many messages
        sendDirectMessage(member.user, "Zut, je n'ai pas le droit de changer les rôles sur le serveur **" + guild.name + "**"
            + "\nIl faut que l'administrateur me donne ce droit, ou je ne peux rien faire :-("
        );
        */
        return;
    }

    log.debug('je peux changer les roles sur ' + guild.name);

    const discordRole = guild.roles.cache.get(row.rid)
    if (! discordRole) {
        log.error("Error404: Role " + row.rid + " not found in guild " + guild.name);
        return;
    }
    // console.log('=== The Role ===\n', discordRole);
        
    member.roles.add(discordRole)
        .then(() => {
            sendDirectMessage(member.user, "Je viens de vous donner le rôle **" + discordRole.name + "** sur le serveur **" + guild.name + "**");
            db.query("update members set state='member' where gid=? and did=?", [guild.id, member.user.id]);
        })
        
        .catch((err) => {
            log.error('Error trying to give role ' + discordRole.name
                 + ' to ' + member.user.username
                 + ' on server ' + guild.name
                 + ' with error: ' +  err.message);

            // case user is owner:
            if (member.guild.ownerID == row.did) {
                db.query("update members set state = 'owner' where gid=? and did=?", [row.gid, row.did]);
                log.warning("This is the owner of the server. I've noted it.");
            } else {
                console.log(member.roles.cache);
            }
            /* !!!! DANGER of message loop
            sendDirectMessage(member.user,
                "Mince, je n'ai pas réussi à vous donner le rôle **" + discordRole.name + "** sur le serveur **" + guild.name + "**"
                + "\nJe n'en ai peut-être pas l'autorisation.");
                */
        });
}


bot.connect = function() { client.login(conf.botToken); }

module.exports = bot;
