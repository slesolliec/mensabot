<template>
	<div>

		<client-only>

		<table>
			<thead>
				<tr>
					<th>Nom</th>
					<th>Région</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="row in rows" :key="row.mid">
					<td><nuxt-link :to="'/user/mid/' + row.mid">{{ row.real_name }}</nuxt-link></td>
					<td>{{ row.region }}</td>
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
			let {data} = await this.$axios.get('http://localhost:3000/api/user');
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
