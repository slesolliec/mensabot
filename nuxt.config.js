const conf = require('./configs');


export default {

    head: {
        title: 'Brain Link',
        htmlAttrs: {
            lang: 'fr'
        },
        meta: [
            { charset: 'utf-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { hid: 'description', name: 'description', content: '' }
        ],
        link: [
            { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
            {
                rel: 'stylesheet',
                href: 'https://use.fontawesome.com/releases/v5.8.1/css/all.css',
                integrity: 'sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf',
                crossorigin: 'anonymous'
            }
        ]
    },


	components: true,

	modules: [
		'@nuxtjs/axios',
		'@nuxtjs/auth-next'
	],
	auth: {
		strategies: {
		  discord: {
			clientId:     conf.discord.clientId,
			clientSecret: conf.discord.clientSecret,
			scope: ['identify']
		  },
		},
		redirect: {
		  home: '/',
		  logout: '/logout',
		  callback: '/callback'
		}
	  },

	
	router: {
		middleware: ['auth']
	}
}
