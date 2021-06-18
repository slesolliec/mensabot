<template>
	<div>

		<client-only>

			<div class="avatar">
				<img v-if="row.discord_avatar" width="128" height="128" :src="'https://cdn.discordapp.com/avatars/' + row.did + '/' + row.discord_avatar + '.png'"><br>
				{{ row.discord_name }}<span style="opacity:0.5">#{{ row.discord_discriminator }}</span>
			</div>


			<h2>{{ row.real_name }}</h2>

			<p>Région: <NuxtLink :to="'/region/' + row.region">{{ row.region }}</NuxtLink></p>

			<p><a :href="'https://mensa-france.net/membres/annuaire/?id=' + row.mid">Fiche dans l'annuaire Mensa France</a></p>

			<ul class="tags"><li v-for="tag in row.tags" :key="tag"><nuxt-link :to="'/tag/' + tag">{{tag}}</nuxt-link></li></ul>

			<div id="presentation" v-if="row.presentation" v-html="$md.render(row.presentation)"></div>

			<div class="editwrapper">
				<h3 @click="showHideForm" style="cursor: pointer;">
					<i v-if="showForm" class="fas fa-minus-circle"></i>
					<i v-else class="fas fa-plus-circle"></i>
					Rédiger ma présentation
				</h3>

				<form v-if="(row.did == $auth.user.id) && showForm" v-on:submit.prevent="present" method="post">

					<p>
						Et si vous vous présentiez ? <em>(écrivez en <a href="https://fr.wikipedia.org/wiki/Markdown#Quelques_exemples">MarkDown</a>)</em>

					</p>
					<textarea style="width: 100%; height: 400px;" v-model="row.presentation"></textarea><br>
					<h4>Etiquettes</h4>				
					<multiselect v-model="row.tags" :options="options"
						:multiple="true"
						:close-on-select="false"
						:clear-on-select="false"
						:taggable="true"
						:tag-placeholder="'Ajouter ce nouveau tag'"
						:placeholder="'Choisir un tag'"
						@tag="addTag"></multiselect><br>
					
					<button type="submit">Enregistrer</button>  &lt;-- n'oubliez pas de cliquer
				</form>
			</div>



		</client-only>

	</div>
</template>

<script>


export default {

	data() {
		return {
			showForm: true,
			row: {},
			options: ['TDA', 'TDAH', 'TSA']
		}
	},

	methods: {

		showHideForm: function () {this.showForm = ! this.showForm},
		
		getRow: async function () {
			const mid = this.$route.params.mid.split(' ')[0];
			let {data} = await this.$axios.get('/api/user?mid=' + mid);
			if (data.rows.length) {
				this.row = data.rows[0];
				document.title = document.title.split('/')[0] + " / " + this.row.real_name;
			}
		},

		present: async function() {
			const bodyFormData = new FormData();
			bodyFormData.append('presentation', this.row.presentation);
			bodyFormData.append('tags', this.row.tags);
			let {data} = await this.$axios.post('/api/me', bodyFormData);
			console.log(data);
		},

		addTag (newTag) {
			this.options.push(newTag);
			this.row.tags.push(newTag);
		}
	},

	mounted: function() {
		this.getRow();
	}
}

</script>


<style>

div.avatar {
	color: white;
	float: right;
	font-size: 12px;
	padding: 8px;
	box-shadow: inset 1px 1px 6px black;
	text-align: center;
	background: #8090dc;
}


div.avatar img {
	border-radius: 64px;
}

ul.tags {
	list-style: none;
	padding-left: 0;
}

ul.tags li {
	display: inline-block;
	padding: 4px 8px;
	background: #41b883;
	color: white;
	border-radius: 5px;
	margin-right: 10px;
	margin-bottom: 10px;
}

ul.tags li a {
	text-decoration: none;
	color: white;
}

</style>