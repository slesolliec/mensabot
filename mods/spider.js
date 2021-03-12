// this spider module is just here to craw the mensannuaire

const conf    = require('../configs');
const log     = require('./log');
const puppeteer  = require('puppeteer');

const spider = {};

let browser;
let page;

async function getHTMLbody(mid) {
    // launch puppeteer
    if (! browser) {
        try {
            log.debug("Launching web browser");
            browser = await puppeteer.launch({
                headless: conf.web.headless,
        //        args: ['--no-sandbox'],
        //        executablePath: 'chromium-browser',
                userDataDir: 'puppetdir'
            });
        } catch (err) {
            log.error("Failed to launch Web Browser with: " + err.message);
            return;
        }
    }

    // open new tab
    if (! page) {
        try {
            log.debug("Opening new page");
            page = await browser.newPage();
            page.setDefaultTimeout(20 * 1000);
        } catch (err) {
            log.error("Failed to open new browser tab with: " + err.message);
            return;
        }
    }

    const infoPageUrl = conf.web.url + mid;
    log.debug("  Going to " + infoPageUrl);
    try {
        await page.goto(infoPageUrl);
    } catch(err) {
        log.error(err.message);
        return;
    }
    log.debug('  Current page is ' + page.url());

    // need authentification?
    if (page.url().startsWith('https://auth')) {
        try {
            await page.type("input[id='userfield'",   conf.web.userid);
            await page.type("input[name='password']", conf.web.password);
            await page.click('.form > .btn');
        } catch(err) {
            log.error("Error while login: " + err.message);
            return;
        }

        try {
            await page.waitForNavigation();
        } catch(err) {
            log.error("Error after login: " + err.message);
        }
        log.debug('  New page url: ' + page.url());
    }

    // we get the content of the page
    // let bodyHTML = await page.evaluate(() => document.documentElement.outerHTML);
    let bodyHTML = await page.evaluate(() => document.body.innerHTML);

    // get rid of all the trash
    bodyHTML = bodyHTML.slice(bodyHTML.indexOf('<div id="identite">')).slice(0, bodyHTML.indexOf('<!-- #content'));
    // log.debug(bodyHTML);
    return bodyHTML;
}


/**
 * Removes from str up to needle, or leave as is.
 * @param {string} str 
 * @param {string} needle 
 * @returns (string)
 */
function cutBeforeIncluded(str, needle) {
    const iLength = str.length;
    str = str.slice(str.indexOf(needle));
    if (iLength > str.length) {
        str = str.slice(needle.length);
    }
    return str;
}


/**
 * Recherche les infos (nom, region, email ...) depuis l'annuaire Mensa
 * @param {Int} mid 
 * @returns {*} Object filled with info found on the web
 */
spider.searchMensannuaire = async function (mid) {
    // launch puppeteer
    const rowUser = {};
    rowUser.mid = mid;

    bodyHTML = await getHTMLbody(rowUser.mid);

    // get name of Mensan
    bodyHTML = cutBeforeIncluded(bodyHTML, '<span class="nom">');
    bodyHTML = bodyHTML.slice(0, bodyHTML.indexOf('<div class="sous-titre">Savoir-faire</div>'));
    rowUser.real_name = bodyHTML.slice(0, bodyHTML.indexOf('</span>')).trim();


    // get region
    bodyHTML = cutBeforeIncluded(bodyHTML, '>');
    bodyHTML = cutBeforeIncluded(bodyHTML, '-');
    bodyHTML = cutBeforeIncluded(bodyHTML, '-');
    rowUser.region = bodyHTML.slice(0, bodyHTML.indexOf('<')).trim().slice(0, 5);

    // get email
    if (bodyHTML.indexOf('href="mailto:')) {
        bodyHTML = cutBeforeIncluded(bodyHTML, 'href="mailto:');
        rowUser.email = bodyHTML.slice(0, bodyHTML.indexOf('"')).trim().split(' ').join('');
    }
	// log.debug(bodyHTML);
	// console.log(rowUser);
    return rowUser;
}

spider.close = async function() {
    await browser.close();
    log.debug('Browser closed');
}



module.exports = spider;
