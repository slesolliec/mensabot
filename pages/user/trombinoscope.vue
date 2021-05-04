<template>
	<div>

		<client-only>

			<nuxt-link :to="'/user/mid/' + row.mid" v-for="row in rows" :key="row.mid" v-if="row.discord_avatar" class="avatar-cards" :title="row.real_name">
				<img v-if="row.discord_avatar" width="128" height="128" :src="'https://cdn.discordapp.com/avatars/' + row.did + '/' + row.discord_avatar + '.png'"><br>
				{{ row.discord_name }}<span style="opacity:0.5">#{{ row.discord_discriminator }}</span>
			</nuxt-link>

		</client-only>

	</div>
</template>


<script>
export default {
	data() {
		return {
			rows: []
		}
	},

	methods: {
		
		getRows: async function () {
			let {data} = await this.$axios.get('/api/user');
			this.rows = data.rows;
			document.title = document.title.split('/')[0] + " / Trombinoscope";
		}
	},

	mounted: function() {
		this.getRows();
	}


}

</script>


<style>

a.avatar-cards {
	color: white;
	display: inline-block;
	margin: 4px;
	font-size: 12px;
	padding: 8px;
	box-shadow: inset 1px 1px 6px black;
	text-align: center;
	text-decoration: none;
	background: #8090dc;
}


a.avatar-cards img {
	border-radius: 64px;
}

</style>