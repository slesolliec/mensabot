<template>
	<div>

		<h2>Région : {{ region }}</h2>

		<client-only>

			<table class="list">
				<thead>
					<tr>
						<th><abbr title="A rédigé une présentation">P.</abbr></th>
						<th>Nom</th>
						<th>Discord</th>
						<th><abbr title="Adhésion à jour">Adh.</abbr></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in rows" :key="row.mid">
						<td><i v-if="row.presentationLength" class="far fa-address-card" style="font-size: 16px;"></i></td>
						<td><nuxt-link :to="'/user/mid/' + row.mid">{{ row.real_name }}</nuxt-link></td>
						<td>{{ row.discord_name }}<span class="discriminator">#{{ row.discord_discriminator }}</span></td>
						<td style="text-align:center">
							<i v-if="row.adherent == 1" class="fas fa-certificate" style="color: green;"></i>
							<i v-if="row.adherent == 0" class="fas fa-certificate" style="color: red;"></i>
						</td>
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
			let {data} = await this.$axios.get('/api/user?region=' + this.region);
			this.rows = data.rows;
			document.title = document.title.split('/')[0] + " / Régions / " + this.region;
		}
	},

	async fetch() {
		this.getRows();
	}

}

</script>