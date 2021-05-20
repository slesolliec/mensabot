<template>
	<div>

		<h2>Tag : <span class="tags">{{ tag }}</span></h2>

		<client-only>

			<table v-if="rows.length" class="list">
				<thead>
					<tr>
						<th><abbr title="A rédigé une présentation">P.</abbr></th>
						<th>Mensan</th>
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

			<div v-if="books.length">
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

	data() {
		return {
			tag: '',
			rows: [],
			books: []
		}
	},

	methods: {
		
		getRows: async function () {
			this.tag = this.$route.params.tag.split(' ')[0];
			let {data} = await this.$axios.get('/api/tag?tag=' + this.tag);
			this.rows = data.rows;
			document.title = document.title.split('/')[0] + " / Tag / " + this.tag;
		},

		getBooks: async function() {
			let {data} = await this.$axios.get('/api/book?tag=' + this.tag);
			this.books = data.rows;
		}
},

	mounted: function() {
		this.getRows();
		this.getBooks();
	}

}

</script>

<style>

h2 span.tags {
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