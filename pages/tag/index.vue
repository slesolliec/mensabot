<template>
	<div>
		<h1>Tags :</h1>

		<client-only>

			<NuxtLink v-for="row in rows" :key="row.tag" :to="'/tag/' + row.tag" class="tags">
				{{ row.tag }} | {{ row.nb }}
			</NuxtLink>

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
			let {data} = await this.$axios.get('/api/tag?all=true');
			this.rows = data.tags;
		}
	},

	mounted: function() {
		this.getRows();
		document.title = document.title.split('/')[0] + " / Tags";
	}

}
</script>


<style>

a.tags {
	text-decoration: none;
	display: inline-block;
	padding: 4px 8px;
	background: #41b883;
	color: white;
	border-radius: 5px;
	margin-right: 10px;
	margin-bottom: 10px;
}

</style>