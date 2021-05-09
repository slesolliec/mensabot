<template>
	<div>
		<h1>Tags :</h1>

		<client-only>

		<table class="list">
			<thead>
				<tr>
					<th>Tags</th>
					<th>Nombre</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.mid">
					<td><NuxtLink :to="'/tag/' + row.tag">{{ row.tag }}</NuxtLink></td>
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
			let {data} = await this.$axios.get('/api/tag');
			this.rows = data.rows;
		}
	},

	mounted: function() {
		this.getRows();
		document.title = document.title.split('/')[0] + " / Tags";
	}

}
</script>


<style scoped>


</style>