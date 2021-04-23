<template>
	<div>

		<client-only>

		<table class="list">
			<thead>
				<tr>
					<th>Nom</th>
					<th>Discord</th>
					<th>Région</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.mid">
					<td><nuxt-link :to="'/user/mid/' + row.mid">{{ row.real_name }}</nuxt-link></td>
					<td>{{ row.discord_name }}<span class="discriminator">#{{ row.discord_discriminator }}</span></td>
					<td><nuxt-link :to="'/region/' + row.region">{{ row.region }}</nuxt-link></td>
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
			rows: []
		}
	},

	methods: {
		
		getRows: async function () {
			let {data} = await this.$axios.get('/api/user');
			this.rows = data.rows;
			document.title = document.title.split('/')[0] + " / Membres";
		}
	},

	async fetch() {
		this.getRows();
	}


}

</script>


<style>
.discriminator {
	opacity: 0.4;
}
</style>