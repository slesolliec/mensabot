const conf = require('./configs');


export default {

    head: {
        title: 'Mensa Café',
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

	plugins: [
		{ src: '~plugins/filters.js', ssr: false },
	],
	
	modules: [
		'@nuxtjs/axios',
		'@nuxtjs/auth-next',
		'@nuxtjs/markdownit',
		'nuxt-vue-multiselect'
	],

	serverMiddleware: [
		'~/api/index.js'
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
		  home:     '/',
		  logout:   '/logout',
		  callback: '/callback'
		},
		redirectUri: 'http://localhost:3000/callback'
	  },

	markdownit: {
		runtime: true // Support `$md()`
	},

	router: {
		middleware: ['auth']
	}
}
