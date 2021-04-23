<template>
	<div>

		<h2>Région : {{ region }}</h2>

		<client-only>

			<table class="list">
				<thead>
					<tr>
						<th>Nom</th>
						<th>Discord</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in rows" :key="row.mid">
						<td><nuxt-link :to="'/user/mid/' + row.mid">{{ row.real_name }}</nuxt-link></td>
						<td>{{ row.discord_name }}<span class="discriminator">#{{ row.discord_discriminator }}</span></td>
					</tr>
				</tbody>
			</table>

		</client-only>

	</div>
</template>

<script>


export default {

	data() {
		return {
			region: '',
			rows: []
		}
	},

	methods: {
		
		getRows: async function () {
			this.region = this.$route.params.region.slice(0, 3);
			let {data} = await this.$axios.get('/api/user?region=' + this.region);
			this.rows = data.rows;
			document.title = document.title.split('/')[0] + " / Régions / " + this.region;
		}
	},

	async fetch() {
		this.getRows();
	}

}

</script>