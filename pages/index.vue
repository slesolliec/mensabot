
<template>
  <div>
    <h1>Bienvenue</h1>
    <p>Bienvenue au Mensa Café, le petit lieu de convivialité des Mensans membres
      de certains obscurs serveurs Discord.<br>
      Si vous êtes de ceux-là, connectez-vous en cliquant en haut à droite.</p>

    <p><strong>Astuce :</strong> consultez votre fiche dans la liste des membres. Vous trouverez sur cette
      page un champ texte qui vous permetra de rédiger votre présentation.</p>

    <p>Ceci est un site expérimental ... si ça déconne, soyez indulgents.</p>

	<div id="botstatus" :class="botstatus.cssclass">
        <div style="float: left; text-align: center; margin-right: 16px;">
  				<img width="48" height="48" src="https://cdn.discordapp.com/app-icons/719154428355018813/996f3b1932094cd8f0e8d6f1a677aa7c.png"><br>
	  			MPloBot<span style="opacity:0.5">#4071</span>
        </div>
        <div>
          Bonjour, je suis le bot qui vous authentifie en tant que membre de Mensa sur les serveurs Discord de Mensans.<br>
          Je gère aussi ce site web: le <a href="https://mensa.cafe/">Mensa.cafe</a>.
          Je suis en cours de développement. Mon status&nbsp;:<br>
          &nbsp;&nbsp;Bot :      <strong>{{ botstatus.bot }}</strong><br>
          &nbsp;&nbsp;Annuaire : <strong>{{ botstatus.annuaire }}</strong>
          <span v-if="botstatus.nbnoobs"><br>&nbsp;&nbsp;{{ botstatus.nbnoobs }} fiche<span v-if="botstatus.nbnoobs > 1">s</span> à consulter dans l'annuaire.</span>
        </div>
	</div>

	<client-only>
		<div v-if="noobs.length">

			<h3>Les derniers utilisateurs arrivés ...</h3>
			<table class="list">
				<thead>
					<tr>
						<th><abbr title="A rédigé une présentation">P.</abbr></th>
						<th>Nom</th>
						<th>Discord</th>
						<th>Arrivé le</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="row in noobs" :key="row.mid">
						<td><i v-if="row.presentationLength" class="far fa-address-card" style="font-size: 16px;"></i></td>
						<td><nuxt-link :to="'/user/mid/' + row.mid">{{ row.real_name }}</nuxt-link></td>
						<td>{{ row.discord_name }}<span class="discriminator">#{{ row.discord_discriminator }}</span></td>
						<td>{{ row.created_at | utc2cet }}</td>
					</tr>
				</tbody>
			</table>

		</div>

		<div v-if="books.length">
			<h3>Les livres les plus populaires ...</h3>

			<div class="bookwrapper" v-for="row in books" :key="row.id">
				<div class="cover"><img v-if="row.cover_ext" :src="'/book_cover/' + row.id + '.' + row.cover_ext" width="80" height="130"></div>
				<div class="book">
					<nuxt-link :to="'/book/' + row.id">{{ row.title }}</nuxt-link><br>
					{{ row.authors }}<br>
					<span v-if="row.year">{{ row.year }}<br></span>
				</div>
				<div class="reviews">
					<div v-for="rev in row.reviews">
						<i :class="rev.rating > 0 ? 'fas fa-star' : 'far fa-star'"></i><i
							:class="rev.rating > 1 ? 'fas fa-star' : 'far fa-star'"></i><i
							:class="rev.rating > 2 ? 'fas fa-star' : 'far fa-star'"></i><i
							:class="rev.rating > 3 ? 'fas fa-star' : 'far fa-star'"></i><i
							:class="rev.rating > 4 ? 'fas fa-star' : 'far fa-star'"></i>
						par <nuxt-link :to="'/user/mid/' + rev.mid">{{ rev.real_name }}</nuxt-link>
					</div>
				</div>
				<div class="tags">
					<ul class="tags">
						<li v-for="tag in row.tags" :key="tag.tag"><nuxt-link :to="'/tag/' + tag.tag">{{tag.tag}}</nuxt-link></li>
					</ul>
				</div>
			</div>
		</div>

	</client-only>


  </div>
</template>


<script>
export default {
  auth: false,

	data() {
		return {
			botstatus: {},
			noobs: [],
			books: []
		}
	},

 	methods: {
		
		getStatus: async function () {
			let {data} = await this.$axios.get('/api/status');
			this.botstatus = data.status;
		},

		getNoobs: async function() {
			let {data} = await this.$axios.get('/api/user?noobs=1');
			this.noobs = data.rows;
		},

		getBooks: async function() {
			let {data} = await this.$axios.get('/api/book?best=1');
			this.books = data.rows;
		}

  },

	mounted: function() {
		this.getStatus();
		this.getNoobs();
		this.getBooks();
		document.title = document.title.split('/')[0] + ' / Accueil';
	}

}
</script>

<style>
#botstatus {
  min-height: 80px;
	color: white;
	font-size: 12px;
	padding: 8px;
	box-shadow: inset 1px 1px 6px black;
	background: #8090dc;
}

#botstatus img {
	border-radius: 24px;
}

#botstatus a {
  color: white;
}

#botstatus.allok     { background: #06a065;}
#botstatus.spideroff { background: #a05e08;}
#botstatus.offline   { background: #ad2c2c;}


</style>