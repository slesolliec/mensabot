<template>
	<div>

		<client-only>

			<div class="avatar">
				<img v-if="row.discord_avatar" width="128" height="128" :src="'https://cdn.discordapp.com/avatars/' + row.did + '/' + row.discord_avatar + '.png'"><br>
				{{ row.discord_name }}<span style="opacity:0.5">#{{ row.discord_discriminator }}</span>
			</div>


			<h2>{{ row.real_name }}</h2>

			<div id="presentation" v-if="row.presentation" v-html="$md.render(row.presentation)"></div>


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
			const did = this.$route.params.did.split(' ')[0];
			let {data} = await this.$axios.get('/api/user?did=' + did);
			if (data.rows.length) {
				this.row = data.rows[0];
				document.title = document.title.split('/')[0] + " / " + this.row.real_name;
				if (this.row.mid) {
					this.$router.push('/user/mid/' + this.row.mid);
				}
			}
		}
	},

	mounted: function() {
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


ul.tags {
	list-style: none;
	padding-left: 0;
}

ul.tags li {
	display: inline-block;
	padding: 4px 8px;
	background: #41b883;
	color: white;
	border-radius: 5px;
	margin-right: 10px;
	margin-bottom: 10px;
}
</style>