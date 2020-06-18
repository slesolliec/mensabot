const Discord = require('discord.js');
const client  = new Discord.Client();
const conf    = require('../configs');
const db      = require('./db');
const fs      = require('fs');
const log     = require('./log');
const puppeteer  = require('puppeteer');
const nodemailer = require('nodemailer');

const bot = {};

client.once('ready', () => {
    console.log('Bot is connected to Discord');

    // loop on my guilds
    client.guilds.cache.forEach(processOneGuild);

    promoteUser('396752710487113729');
});


/**
 * Gives all mensa roles for each guild the user is in
 * @param {integer} did : discord id of the user to promote
 */
async function promoteUser(did) {
    // we don't get the discord user
    // because discord users cannot have roles
    // it's only members who can

    // we fetch all roles that should be added to the member
    let sql = `select cast(guilds.gid as text) as gid,
        cast(guilds.mensan_role as text) as mensan_role
    from guilds, members
    where guilds.gid = members.gid
      and members.did = ?
      and members.state is null
      and guilds.mensan_role is not null
    `;

    const roles = await db.all(sql, [did]);

    roles.map((role) => {
        // console.log(role);

        const guild = client.guilds.cache.get(role.gid);
        // console.log('==== The Guild ===\n', guild);

        const member = guild.members.cache.get(did);
        // console.log('=== The Member ===\n', member);

        // check if bot hasPermission(['MANAGE_ROLES'])
        if ( ! guild.me.hasPermission('MANAGE_ROLES')) {
            console.log("ouiinnnn, je n'ai pas le droit de changer les rôles sur " + guild.name);
            sendDirectMessage(member.user, "Zut, je n'ai pas le droit de changer les rôles sur le serveur **" + guild.name + "**"
                + "\nIl faut que l'administrateur me donne ce droit, ou je ne peux rien faire :-("
            );
            return;
        }

        console.log('je peux changer les roles');

        const discordRole = guild.roles.cache.get(role.mensan_role)
        // console.log('=== The Role ===\n', discordRole);
        
        member.roles.add(discordRole)
        .then(() => {
            sendDirectMessage(member.user, "Je viens de vous donner le rôle **" + discordRole.name + "** sur le serveur **" + guild.name) + "**";
        })
        
        .catch((err) => {
            console.error('Error trying to give role', discordRole.name,
                'to', member.user.username,
                'on server', guild.name,
                'with error:',  err.message);
            sendDirectMessage(member.user,
                "Mince, je n'ai pas réussi à vous donner le rôle **" + discordRole.name + "** sur le serveur **" + guild.name + "**"
                + "\nJe n'en ai peut-être pas l'autorisation.");
        });
    });
}



client.on('guildMemberAdd', processNewMember);

/**
 * Handle when a new member enters guild
 * 
 * @param {Discord.GuildMember} member
 */
function processNewMember(member) {
    // we check if we know the user


    // store all its memberships



}



// take a guild: list all its members
function processOneGuild(guild) {
    console.log("=== " + guild.name + " (" + guild.memberCount + " membres) ===");

    // check we know that guild
    db.get("select * from guilds where gid = ?", guild.id, (err, row) => {
        if (err) return console.log(err.message);

        if (row) return;
        
        db.run("insert into guilds(gid, name) values(?, ?)", [guild.id, guild.name], handlerr);
    })

    // list roles of guild
    guild.roles.cache.map(role => console.log('rôle:', role.name, 'id:', role.id));

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
        await db.run("insert into users(did, discord_name) values(?, ?)", [member.user.id, member.user.username]);
        // theUser = await db.getUser(member.user.id);
    }

    // check we know the guild
    let theGuild = await db.getGuild(member.guild.id);
    if (! theGuild) {
        await db.run("insert into guilds(gid, name) values(?, ?)", [member.guild.id, member.guild.name]);
        theGuild = await db.getGuild(member.guild.id);
    }

    // check we have the user / guild relationship
    let theMember = await db.getMember(member.guild.id, member.user.id);
    if (! theMember) {
        // member is not here
        await db.run("insert into members(gid, did) values(?, ?)", [member.guild.id, member.user.id]);
        theMember = await db.getMember(member.guild.id, member.user.id);
    }

    // check if the member is alreayd identified as Mensan
    if (theMember.state == 'member')
        return;

    // we check if the member has already the mensan role
    if (theGuild.mensan_role)
        if (member.roles.cache.has(theGuild.mensan_role))
            db.run('update members set state="member" where gid = ? and did = ?', [member.guild.id, member.user.id]);
}


// handle errors
function handlerr(err) {
    if (err) {
        console.error(err.message);
    }
}

// welcome new users
bot.welcome = async function() {
    // we look for a new user
    let newUser = await db.get("select cast(did as text) as did, discord_name from users where state = 'new' and did = '396752710487113729' limit 1", []);

    if (! newUser) return;

    // compose welcome message
    const msgWelcome = fs.readFileSync('./messages/welcome.txt', 'utf-8')
        .replace(/##username##/g, newUser.discord_name)
        .replace(/##botname##/g, client.user.username);

    // get Discord user
    let user = client.users.cache.get(newUser.did);
    if (! user) {
        log.error("Impossible de trouver l'utilisateur "+ newUser.did);
        return;
    }

    sendDirectMessage(user, msgWelcome);
    db.run("update users set state = 'welcomed' where did = ?", [user.id]);
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


// chatbot basic loop
client.on('message', handleIncomingMessage);

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

    // get user
    let theUser = await db.getUser(message.author.id);

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
        const checkUser = await db.get("select cast(did as text) as did from users where mid=?", [mid]);
        if (checkUser) {
            if (checkUser.did == message.author.id) {
                sendDirectMessage(message.author, "Vous m'aviez déjà envoyé votre numéro de Mensa. Je l'ai bien noté, merci.");
                return;
            }
            sendDirectMessage(message.author, "Ce numéro de Mensan est déjà dans ma base de données, mais il est attribué à un autre utilisateur. Désolé, mais je ne peux pas traiter votre demande.");
            return;
        }

        // we store the user Mensa number
        db.run("update users set mid = ? where did = ? and mid is null", [mid, message.author.id]);
        sendDirectMessage(message.author, "J'ai bien enregistré votre numéro de Mensa: **" + mid + "**."
            +"\nJe vais mantenant consulter l'annuaire de Mensa France et vous envoyer un code de confirmation à votre adresse email."
            +"\nMerci de consulter vos emails dans quelques minutes.");
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
            db.run("update users set state='validated' where did = ?", [message.author.id]);

            // promote user on the discord guilds he belongs
            promoteUser(message.author.id);

            sendDirectMessage(message.author, "Vous appartenance à Mensa est bien validée.\n"
                + "Merci d'avoir bien voulu suivre cette procédure.\n"
                + "Vous pouvez à présent accéder à tous les salons.\n");
            return;

        } else {
            sendDirectMessage(message.author, "Votre code de validation ne semble pas être le bon.\n"
                +"Ré-essayez, ou bien contactez un administrateur du serveur, pour voir ce qu'il peut faire.");
            db.run("update users set validation_trials = validation_trials + 1 where did = ?", [message.author.id]);
        }
    }
}


// we consult the Mensa France address book and get the user info
bot.sendCode = async function() {
    const newUser = await db.get(
       `select cast(did as text) as did, discord_name, mid, state
        from users
        where mid is not null
          and (state = 'new' or state = 'welcomed')
        limit 1`, []);
    if (newUser)
        processNewMensan(newUser);
}

async function processNewMensan(rowUser) {

    if (! rowUser) return;

    // get discord user
    const discordUser = client.users.cache.get(rowUser.did);
    if (! discordUser) {
        log.error("Impossible de trouver l'utilisateur "+ rowUser.did + " / " + rowUser.mid);
        return;
    }

    // launch puppeteer
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    const infoPageUrl = 'https://mensa-france.net/membres/annuaire/?id=' + rowUser.mid;
    console.log("going to ",  infoPageUrl);
    await page.goto(infoPageUrl);
    console.log('Current page is ' + page.url());

    // need authentification?
    if (page.url().startsWith('https://auth')) {
        await page.type("input[name='user']",     conf.m_userID);
        await page.type("input[name='password']", conf.m_password);
        await page.click('.form > .btn');
        await page.waitForNavigation();
        console.log('new page url: ', page.url());
    }

    // get data
    let region, real_name, email;
    try {
        let identite = await page.$eval('#identite', el => el.innerText);
        identite = identite.split('\n')[0].split('-');
        region = identite.pop().trim();
        identite.pop();
        real_name = identite.join('-').trim();
    } catch (err) {
        console.log("Mensa member does not seem to have a name. We probably don't have a good Mensa id");
        console.log(err.message);

        sendDirectMessage(discordUser, "Ah mince, je n'arrive pas à trouver votre fiche dans l'annuaire des membres de Mensa."
            + "\nMerci de contacter un des administrateurs du serveur pour valider votre état de membre de Mensa.");
        db.run("update users set state = 'in_error' where did = ?", [rowUser.did]);
        return;
    }

    try {
        email = await page.$eval('div.email a', el => el.innerText);
        email = email.trim().split(' ').join('');
    } catch (err) {
        console.log("Mensa member does not seem to have an email address.");
        console.log(err.message);
    }

    console.log('Found member info: ' + real_name + ' - ' + region + ' - ' + email);
    browser.close();

    db.run("update users set real_name = ?, region = ?, email = ?, state = 'found' where mid = ?", [real_name, region, email, rowUser.mid]);

    // do we have the email
    if (! email) {
        sendDirectMessage(discordUser, "Ah mince, votre adresse email n'est pas présente dans l'annuaire des membres de Mensa."
            + "\nMerci de contacter un des administrateurs du serveur pour valider **manuellement** votre état de membre de Mensa.");
        db.run("update users set state = 'in_error' where did = ?", [rowUser.did]);

        return;
    }

    // we create the validation code
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    const validationCode = ''
        + getRandomInt(10)
        + getRandomInt(10)
        + getRandomInt(10)
        + getRandomInt(10)
        + getRandomInt(10)
        + getRandomInt(10);

    // send the email with validation code
    var transporter = nodemailer.createTransport({
        host: conf.smtp.host,
        port: 465,  //
        secure: true, // true for 465, false for other ports
        auth: {
            user: conf.smtp.user,
            pass: conf.smtp.password
        }
    });
      
      var mailOptions = {
        from: 'MensaBot <stephane@metacites.net>',
        to: email,
        subject: 'Votre code de confirmation MensaBot Discord',
        text: 'Bonjour ' + real_name
            + ',\n\n'
            + 'Voici votre code de confirmation pour montrer au serveur Discord de Mensa que vous êtes bien un membre :\n'
            + validationCode + '\n\n'
            + 'Il vous suffit maintenant d\'envoyer ce code au bot Discord en Message Privé\n\n'
            + 'Merci\n'
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

    db.run("update users set validation_code = ?, state = 'vcode_sent' where mid = ?", [validationCode, rowUser.mid]);
    sendDirectMessage(discordUser, "Votre code de validation vient de vous être envoyé par email."
        + "\nIl suffit maintenant juste de me l'envoyer par message privé.\n");

}




bot.connect = function() {
    client.login(conf.botToken);
}


module.exports = bot;
