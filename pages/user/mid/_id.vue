<template>
	<div>

		<client-only>

			<div class="avatar">
				<img v-if="row.discord_avatar" width="128" height="128" :src="'https://cdn.discordapp.com/avatars/' + row.did + '/' + row.discord_avatar + '.png'"><br>
				{{ row.discord_name }}<span style="opacity:0.5">#{{ row.discord_discriminator }}</span>
			</div>


			<h2>{{ row.real_name }}</h2>

			<p>Région: <NuxtLink :to="'/region/' + row.region">{{ row.region }}</NuxtLink></p>

			<div id="presentation" v-if="row.presentation" v-html="$md.render(row.presentation)"></div>

			<form v-if="row.did == $auth.user.id" v-on:submit.prevent="present" method="post" style="margin-top:40px;">
				<p>
					Et si vous vous présentiez ? <em>(écrivez en <a href="">MarkDown</a>)</em>

				</p>
				<textarea style="width: 400px; height: 400px;" v-model="row.presentation"></textarea>
				<br><button type="submit">Enregistrer</button>  &lt;-- n'oubliez pas de cliquer
			</form>



		</client-only>

	</div>
</template>

<script>


export default {

	data() {
		return {
			row: {}
		}
	},

	methods: {
		
		getRow: async function () {
			const mid = parseInt(this.$route.params.id);
			let {data} = await this.$axios.get('/api/user?mid=' + mid);
			if (data.rows.length) {
				this.row = data.rows[0];
				document.title = document.title.split('/')[0] + " / " + this.row.real_name;
			}
		},

		present: async function() {
			const bodyFormData = new FormData();
			bodyFormData.append('presentation', this.row.presentation);
			let {data} = await this.$axios.post('/api/me', bodyFormData);
			console.log(data);
		}
	},

	async fetch() {
		this.getRow();
	}
}

</script>


<style>

div.avatar {
	color: white;
	float: right;
	font-size: 12px;
	padding: 8px;
	box-shadow: inset 1px 1px 6px black;
	text-align: center;
	background: #8090dc;
}


div.avatar img {
	border-radius: 64px;
}

</style>