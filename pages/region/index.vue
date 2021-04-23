<template>
	<div>
		<h1>Liste des régions.</h1>

		<client-only>

		<table class="list">
			<thead>
				<tr>
					<th>Région</th>
					<th>Nombre</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.mid">
					<td><NuxtLink :to="'/region/' + row.region">{{ row.region }}</NuxtLink></td>
					<td style="text-align:right;">{{ row.nb }}</td>
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
			let {data} = await this.$axios.get('/api/region');
			this.rows = data.rows;
		}
	},

	async fetch() {
		this.getRows();
		document.title = document.title.split('/')[0] + " / Régions";
	}

}
</script>


<style scoped>


</style>