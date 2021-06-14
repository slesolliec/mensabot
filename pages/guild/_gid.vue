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

				<table class="legend">
					<tr>
						<th>Status</th>
						<th>Explications</th>
					</tr>
					<tr>
						<td>Nouveau</td>
						<td>Nouvel utilisateur. Le bot ne lui a pas encore souhaité la bienvenue.</td>
					</tr>
					<tr>
						<td>Bienvenu</td>
						<td>Le bot a envoyé le message de bienvenue à la personne, en lui demandant son numéro d'adhérent Mensa-France.</td>
					</tr>
					<tr>
						<td>Trouvé</td>
						<td>Le bot a trouvé la personne dans l'annuaire de Mensa-France.</td>
					</tr>
					<tr>
						<td>Code&nbsp;envoyé</td>
						<td>Le bot a envoyé le code de confirmation au membre sur son courriel.</td>
					</tr>
				</table>

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
								<span v-if="row.state == 'found'">Trouvé</span>
								<span v-if="row.state == 'vcode_sent'">
									Code envoyé
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


<style>
table.legend th {
	background: #CCC;
	padding: 4px;
}

table.legend td {
	background: linear-gradient(90deg, #DDD, #EEE);
	vertical-align: top;
	padding: 4px;
}

</style>