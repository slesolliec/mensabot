<template>
	<header>
		<button id="loginbtn" @click="login"><i class="fab fa-discord"></i> Login with Discord</button>

		<h1>
			Blink.ooo<br>
			<em>version 0.1.0 beta</em>
		</h1>

		<nav>
			<NuxtLink to="/users">Utilisateurs</NuxtLink>
			<NuxtLink to="/receive">Serveurs</NuxtLink>
			<NuxtLink to="/map">Carte</NuxtLink>
		</nav>

	</header>
</template>


<script>
export default {
    methods: {
        login() {
            this.$auth.loginWith('discord', { params: { response_type: 'token' } })
        },
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

header h1 {
    font-size: 20px;
    font-weight: normal;
	margin-bottom: 0;
	padding-bottom: 20px;
	line-height: 14px;
}
header h1 em {
	font-size: 10px;
	font-style: normal;
	opacity: .6;
}


header div {
	font-size: 14px;
}

header div span {
	opacity: .6;
}

#loginbtn {
	float: right;
	margin-right: 8px;
	padding-bottom: 4px;
	background: #8090dc;
	color: white;
	border: 0;
	border-radius: 4px;
	box-shadow: 1px 1px 5px black;
	cursor: pointer;
}

#loginbtn i {
	font-size: 18px;
	position:relative;
	top: 3px;
}

nav {
	text-align: right;
}

nav a {
	margin: 0 16px;
	text-decoration: none;
	color: #DDDDDD;
}

nav a:visited {
	color: #CCCCCC;
}

nav a:hover,
nav a.router-link-active {
	color: white;
	text-decoration: underline;
}

</style>