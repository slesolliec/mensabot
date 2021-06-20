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

			<BookView v-for="book in books" :book="book" :key="book.id" />

		</client-only>

	</div>
</template>

<script>
import BookView from '../../components/BookView.vue';


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
			this.books = data.books;
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