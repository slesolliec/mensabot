<template>
	<div>

		<client-only>

		{{ row }}

		</client-only>

	</div>
</template>

<script>


export default {

	data() {
		return {
			row: {}
		}
	},

	methods: {
		
		getRows: async function () {
			const mid = parseInt(this.$route.params.id);
			let {data} = await this.$axios.get('http://localhost:3000/api/user?mid=' + mid);
			console.log(data);
			this.row = data.row;
		}
	},

	async fetch() {
		this.getRows();
	}
}

</script>