<template>
	<div>

		<h1>Livres</h1>

		<client-only>

			<ul class="tags">
				<li v-for="tag in tags" :key="tag.tag"><nuxt-link :to="'/tag/' + tag.tag">
					{{tag.tag}} | {{ tag.nb }}
				</nuxt-link></li>
			</ul>

			<BookEdit @bookadded="loadData" />

			<BookView v-for="book in books" :book="book" :key="book.id" />

		</client-only>

	</div>
</template>


<script>
export default {
	data() {
		return {
			books: [],
			tags: [],
		}
	},

	methods: {
		getBooks: async function() {
			let {data} = await this.$axios.get('/api/book?all=true');
			this.books = data.books;
			document.title = document.title.split('/')[0] + " / Livres";
		},

		getTags: async function() {
			let {data} = await this.$axios.get('/api/tag?books=true');
			this.tags  = data.tags;
		},

		loadData: function() {
			this.getBooks();
			this.getTags();
		}
	},

	mounted: function() {
		this.loadData();
	},

}

</script>


<style>
.discriminator {
	opacity: 0.4;
}

label {
	margin: 4px 0;
	display: inline-block;
	min-width: 120px;

}

div.editwrapper {
  	margin:  8px 0;
	padding: 10px 10px 8px 10px;
	border: 1px solid #CCC;
	background: linear-gradient(135deg, rgb(118, 209, 168), #CCC, #CCC);
	box-shadow: inset 1px 1px 3px #666666;
}

div.editwrapper h3 {
	margin-top: 0;
}

</style>