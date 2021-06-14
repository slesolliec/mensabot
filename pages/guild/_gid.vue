<template>
	<div>

		<h2>Serveur : {{ guild }}</h2>

		<p>Voici la liste des membres du serveur {{ guild }}.</p>

		<client-only>

			<table class="list">
				<thead>
					<tr>
						<th><abbr title="A rédigé une présentation">P.</abbr></th>
						<th>Nom</th>
						<th>Discord</th>
						<th>Région</th>
						<th><abbr title="Adhésion à jour">Adh.</abbr></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in rows" :key="row.mid">
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


			<div v-if="unvalidateds.length" class="superpower">

				<h2>Non validés</h2>

				<p>Voici les utilisateurs de ce serveur non validés comme membres de Mensa</p>

				<table class="list">
					<thead>
						<tr>
							<th><abbr title="A rédigé une présentation">P.</abbr></th>
							<th>Nom</th>
							<th>Discord</th>
							<th>Région</th>
							<th><abbr title="Adhésion à jour">Adh.</abbr></th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="row in unvalidateds" :key="row.mid">
							<td><i v-if="row.presentationLength" class="far fa-address-card" style="font-size: 16px;"></i></td>
							<td><nuxt-link :to="'/user/mid/' + row.mid">{{ row.real_name }}</nuxt-link></td>
							<td>{{ row.discord_name }}<span class="discriminator">#{{ row.discord_discriminator }}</span></td>
							<td style="text-align:center;"><nuxt-link :to="'/region/' + row.region">{{ row.region }}</nuxt-link></td>
							<td style="text-align:center">
								<i v-if="row.adherent == 1" class="fas fa-certificate" style="color: green;"></i>
								<i v-if="row.adherent == 0" class="fas fa-certificate" style="color: red;"></i>
							</td>
							<td>
								<span v-if="row.state == 'new'">Nouveau</span>
								<span v-if="row.state == 'welcomed'">Bienvenu</span>
								<span v-if="row.state == 'found'">Trouvé dans l'annuaire</span>
								<span v-if="row.state == 'vcode_sent'">
									Code de confirmation envoyé
									| <i class="fas fa-redo-alt" title="renvoyer" @click="resendCode(row.mid)" style="cursor: pointer;"></i>
								</span>
							</td>
						</tr>
					</tbody>
				</table>

			</div>


		</client-only>

	</div>
</template>

<script>


export default {

	data() {
		return {
			guild: '',
			rows: [],
			unvalidateds: []
		}
	},

	methods: {
		
		getRows: async function () {
			this.guild = this.$route.params.gid;
			let {data} = await this.$axios.get('/api/user?guild=' + this.guild);
			this.rows = data.rows;
			document.title = document.title.split('/')[0] + " / Serveur / " + this.guild;
			let resp2 = await this.$axios.get('/api/user?guild=' + this.guild + '&unval=idated');
			this.unvalidateds = resp2.data.rows;
		},

		resendCode: async function(mid) {
			const bodyFormData = new FormData();
			bodyFormData.append('action', 'resend_vcode');
			bodyFormData.append('mid', mid);
			bodyFormData.append('gid', this.guild);
			await this.$axios.post('/api/userchange', bodyFormData);

			this.getRows();
		}
	},

	mounted: function() {
		this.getRows();
	}

}

</script>