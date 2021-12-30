<template>
	<header>
		<div id="me">
			<button v-if=" ! $auth.loggedIn" id="loginbtn" @click="login"><i class="fab fa-discord"></i> Login with Discord</button>
			<div v-else id="avatar">
				<img width="48" height="48" :src="'https://cdn.discordapp.com/avatars/' + $auth.user.id + '/' + $auth.user.avatar + '.png'"><br>
				{{ $auth.user.username }}<span style="opacity:0.5">#{{ $auth.user.discriminator }}</span><br>
				<a :href="'/user/did/' + $auth.user.id" style="margin-right:0;padding-bottom:0;">Ma fiche</a><br>
				<a href="/logout" style="margin-right:0;padding-bottom:0;" @click="logout">Déconnexion</a>
			</div>
		</div>

		<h1>
			<NuxtLink to="/">Mensa.cafe</NuxtLink><br>
			<em>&nbsp;&nbsp;version 0.4.0 beta</em>
		</h1>


		<!-- table id="statistics" v-if="$auth.user" -->
		<table id="statistics">
			<tbody>
				<tr><td style="text-align:right;">{{ stats.members }}</td><td>membres</td></tr>
				<tr><td style="text-align:right;">{{ stats.guilds  }}</td><td>serveurs</td></tr>
				<tr><td style="text-align:right;">{{ stats.books   }}</td><td>livres</td></tr>
			</tbody>
		</table>


		<nav>
			<NuxtLink to="/"><i class="fas fa-home"></i></NuxtLink>
			<NuxtLink to="/user">Utilisateurs</NuxtLink>
			<NuxtLink to="/region">Régions</NuxtLink>
			<NuxtLink to="/departement">Départements</NuxtLink>
			<NuxtLink to="/guild">Serveurs</NuxtLink>
			<NuxtLink to="/book">Livres</NuxtLink>
			<NuxtLink to="/tag">Tags</NuxtLink>
			<NuxtLink to="/user/trombinoscope">Trombinoscope</NuxtLink>
		</nav>

	</header>
</template>


<script>
export default {

	data() {
		return {
			stats: {}
		}
	},


	methods: {

		getRows: async function () {
			let {data} = await this.$axios.get('/api/stats');
			this.stats = data.stats;
		},

		login() {
            this.$auth.loginWith('discord', { params: { response_type: 'token' } })
        },
		
		async logout() {
 			await this.$auth.logout()
		}
     },

	mounted: function() {
		this.getRows();
	}


}
</script>



<style>

header {
	width: 760px;
	margin-top: 16px;
	margin-left: auto;
	margin-right: auto;
	padding: 16px 8px 4px 16px;
	background: linear-gradient(90deg, #a09d9e, #616060);
	color: white;
	position: relative;
	box-shadow: inset 1px 1px 6px black;
}

/*
header {
	background: url(/header_005.jpg);
	background-position: 0px -26px;
	background-size: 100%;
}
*/

#me {
	position: absolute;
	top: -10px;
	right: -10px;
}


#avatar {
	font-size: 12px;
	padding: 4px;
	box-shadow: 1px 1px 6px black;
	text-align: center;
	background: #8090dc;
}


#avatar img {
	border-radius: 24px;
}

#avatar a {
	display: inline-block;
	padding-top: 0px;
	cursor: pointer;
}
#avatar a:hover {
	text-decoration: underline;
}

header h1 {
    font-size: 24px;
    font-weight: normal;
	margin-bottom: 0;
	padding-bottom: 40px;
	line-height: 14px;
	text-shadow: 1px 1px 1px black;
}
header h1 em {
	font-size: 10px;
	font-style: normal;
	opacity: .6;
	text-shadow: none;
}

header a {
	margin: 0 16px 0 0 ;
	padding: 4px;
	text-decoration: none;
	color: white;
}

header a:hover {
	text-decoration: underline;
}

header nav a.nuxt-link-exact-active {
	color: black;
	background: #EEEEEE;
	box-shadow: 2px -3px 2px #666666 ;
}


header div {
	font-size: 14px;
}

header div span {
	opacity: .6;
}

#loginbtn {
	position: relative;
	top: 22px; right: 22px;
	padding-bottom: 4px;
	background: #8090dc;
	color: white;
	border: 0;
	border-radius: 4px;
	box-shadow: 1px 1px 5px black;
	cursor: pointer;
	font-size: 14px;
}

#loginbtn i {
	font-size: 18px;
	position:relative;
	top: 3px;
}

nav {
}

#statistics {
	position: absolute; top: 10px; left: 550px;
	font-size: 12px;
	border-spacing: 0;
	opacity: 0.8;
}


div.editwrapper {
	clear: left;
	margin:  8px 0;
	padding: 10px 10px 8px 10px;
	border: 1px solid #CCC;
	background: linear-gradient(135deg, rgb(118, 209, 168), #CCC, #CCC);
	box-shadow: inset 1px 1px 3px #666666;
}

div.editwrapper h3 {
	margin-top: 0;
}


</style>