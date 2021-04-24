const configs = {
	botToken: 	"",
	mysql: {
		host: '127.0.0.1',
		user: 'mensabot',
		port: 3306,
		password: '***',
		database: 'mensabot'
	},
	smtp: {
		host: 'smtp.truc.com',
		user: 'monemail@truc.com',
		password: 'password'
	},
	botAdmin: {
		name:  "Name of Admin",
		email: "admin@example.com",
		did: 396752710487113729
	},
	web: {
		userid:   "",
		password: "",
		headless: true,
		url: 'https://mensa-france.net/membres/annuaire/?id='
	},
	discord: {
		clientId: 'PUT_BOT_CLIENT_ID',
		clientSecret: 'PUT_BOT_CLIENT_SECRET'
	},
	spider: {
		password: '',
		url: 'https://mensa.cafe'
	}
}

module.exports = configs;
