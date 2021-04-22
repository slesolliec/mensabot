<template>
	<div>

		<h2>Région : {{ region }}</h2>

		<client-only>

			<table>
				<thead>
					<tr>
						<th>Nom</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in rows" :key="row.mid">
						<td><nuxt-link :to="'/user/mid/' + row.mid">{{ row.real_name }}</nuxt-link></td>
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
			let {data} = await this.$axios.get('http://localhost:3000/api/user?region=' + this.region);
			this.rows = data.rows;
		}
	},

	async fetch() {
		this.getRows();
	}

}

</script>