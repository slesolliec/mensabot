<template>
	<div>

		<h1>Serveurs</h1>

		<client-only>

		<table class="list">
			<thead>
				<tr>
					<th>Nom</th>
					<th>Nb. membres</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.mid">
					<td><nuxt-link :to="'/guild/' + row.gid">{{ row.name }}</nuxt-link></td>
					<td style="text-align:right">{{ row.nb }}</td>
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
			let {data} = await this.$axios.get('/api/guild');
			this.rows = data.rows;
			document.title = document.title.split('/')[0] + " / Serveurs";
		}
	},

	async fetch() {
		this.getRows();
	}


}

</script>


<style>

</style>