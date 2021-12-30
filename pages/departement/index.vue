<template>
	<div>
		<h1>Liste des départements.</h1>

		<client-only>

		<table class="list">
			<thead>
				<tr>
					<th>Département</th>
					<th>Nombre</th>
				</tr>
			</thead>
			<tbody style="text-align:right;">
				<tr v-for="row in rows" :key="row.mid">
					<td><NuxtLink :to="'/departement/' + row.departement">{{ row.departement }}</NuxtLink></td>
					<td>{{ row.nb }}</td>
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
			let {data} = await this.$axios.get('/api/departement');
			this.rows = data.rows;
		}
	},

	mounted: function() {
		this.getRows();
		document.title = document.title.split('/')[0] + " / Départements";
	}

}
</script>


<style scoped>


</style>