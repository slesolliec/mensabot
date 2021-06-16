<template>
	<div>

		<h1>Membres</h1>

		<client-only>

		<table class="list">
			<thead>
				<tr>
					<th class="counter">#</th>
					<th><abbr title="A rédigé une présentation">P.</abbr></th>
					<th>Nom</th>
					<th>Discord</th>
					<th>Région</th>
					<th><abbr title="Adhésion à jour">Adh.</abbr></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(row, i) in rows" :key="row.mid">
					<td class="counter">{{ i + 1 }}</td>
					<td><i v-if="row.presentationLength" class="far fa-address-card" style="font-size: 16px;"></i></td>
					<td><nuxt-link :to="'/user/mid/' + row.mid">{{ row.real_name }}</nuxt-link></td>
					<td>{{ row.discord_name }}<span class="discriminator">#{{ row.discord_discriminator }}</span></td>
					<td style="text-align:center;"><nuxt-link :to="'/region/' + row.region">{{ row.region }}</nuxt-link></td>
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
			rows: []
		}
	},

	methods: {
		
		getRows: async function () {
			let {data} = await this.$axios.get('/api/user');
			this.rows = data.rows;
			document.title = document.title.split('/')[0] + " / Membres";
		}

	},

	mounted: function() {
		this.getRows();
	}


}

</script>


<style>
.discriminator {
	opacity: 0.4;
}

table.list td.counter, table.list th.counter {
	text-align: right;
}

</style>