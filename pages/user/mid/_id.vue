<template>
	<div>

		<client-only>

			<h2>{{ row.real_name }}</h2>

			<p>Région: {{ row.region }}</p>

			<div id="presentation" v-if="row.presentation" v-html="$md.render(row.presentation)"></div>

			<form v-if="row.did == $auth.user.id" v-on:submit.prevent="present" method="post" style="margin-top:40px;">
				<p>
					Et si vous vous présentiez ? <em>(écrivez en <a href="">MarkDown</a>)</em>

				</p>
				<textarea style="width: 400px; height: 400px;" v-model="row.presentation"></textarea>
				<br><button type="submit">Enregistrer</button>
			</form>



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
		
		getRow: async function () {
			const mid = parseInt(this.$route.params.id);
			let {data} = await this.$axios.get('http://localhost:3000/api/user?mid=' + mid);
			if (data.rows.length) {
				this.row = data.rows[0];
				document.title += ' / ' + this.row.real_name;
			}
		},

		present: async function() {
			const bodyFormData = new FormData();
			bodyFormData.append('presentation', this.row.presentation);
			let {data} = await this.$axios.post('http://localhost:3000/api/me', bodyFormData);
			console.log(data);
		}
	},

	async fetch() {
		this.getRow();
	}
}

</script>