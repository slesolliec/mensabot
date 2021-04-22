<template>
	<header>
		<div id="me">
			<button v-if=" ! $auth.loggedIn" id="loginbtn" @click="login"><i class="fab fa-discord"></i> Login with Discord</button>
			<div v-else id="avatar">
				<img width="48" height="48" :src="'https://cdn.discordapp.com/avatars/' + $auth.user.id + '/' + $auth.user.avatar + '.png'"><br>
				{{ $auth.user.username }}<span style="opacity:0.5">#{{ $auth.user.discriminator }}</span><br>
				<a href="/logout" style="margin-right:0;" @click="logout">Déconnexion</a>
			</div>
		</div>

		<h1>
			<NuxtLink to="/">Mensa.cafe</NuxtLink><br>
			<em>&nbsp;&nbsp;version 0.1.0 alpha</em>
		</h1>

		<nav>
			<NuxtLink to="/">Accueil</NuxtLink>
			<NuxtLink to="/user">Utilisateurs</NuxtLink>
			<NuxtLink to="/region">Régions</NuxtLink>
		</nav>

	</header>
</template>


<script>
export default {
    methods: {
        login() {
            this.$auth.loginWith('discord', { params: { response_type: 'token' } })
        },
		
		async logout() {
 			await this.$auth.logout()
		}
     }
}
</script>



<style>

html {
	background: #eeeeee;
}



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
	padding-top: 4px;
	cursor: pointer;
}
#avatar a:hover {
	text-decoration: underline;
}

header h1 {
    font-size: 20px;
    font-weight: normal;
	margin-bottom: 0;
	padding-bottom: 40px;
	line-height: 14px;
}
header h1 em {
	font-size: 10px;
	font-style: normal;
	opacity: .6;
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


</style>