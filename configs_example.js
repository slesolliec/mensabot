const configs = {
	botToken: 	"",
	mysql: {
		host: '127.0.0.1',
		user: 'mensabot',
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
		email: "admin@example.com"
	},
	web: {
		userid:   "",
		password: "",
		headless: true,
		url: 'https://mensa-france.net/membres/annuaire/?id='
	}
}

module.exports = configs;
