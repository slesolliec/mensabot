<template>
	<div>
		Liste des régions.

		<client-only>

		<table>
			<thead>
				<tr>
					<th>Région</th>
					<th>Nombre</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.mid">
					<td>{{ row.region }}</td>
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
			let {data} = await this.$axios.get('http://localhost:3000/api/region');
			this.rows = data.rows;
		}
	},

	async fetch() {
		this.getRows();
	}


}

/*
	async fetch() {
		this.users = await fetch(
			'http://localhost:3000/api/user'
		).then(res => res.json())
	}
*/
</script>


<style scoped>


</style>