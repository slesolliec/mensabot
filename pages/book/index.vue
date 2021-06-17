<template>
	<div>

		<h1>Livres</h1>

		<client-only>

			<ul class="tags">
				<li v-for="tag in tags" :key="tag.tag"><nuxt-link :to="'/tag/' + tag.tag">
					{{tag.tag}} | {{ tag.nb }}
				</nuxt-link></li>
			</ul>

			<BookEdit @bookadded="getRows" />

			<div class="bookwrapper" v-for="row in rows" :key="row.id">
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

		</client-only>

	</div>
</template>


<script>
export default {
	data() {
		return {
			rows: [],
			allTags: [],
		}
	},

	methods: {
		getRows: async function () {
			let {data} = await this.$axios.get('/api/book');
			this.rows = data.rows;
			this.tags = data.tags;
			document.title = document.title.split('/')[0] + " / Livres";
		},

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

label {
	margin: 4px 0;
	display: inline-block;
	min-width: 120px;

}

div.addwrapper {
  	margin:  8px 0;
	padding: 10px 10px 8px 10px;
	border: 1px solid #CCC;
	background: linear-gradient(135deg, rgb(118, 209, 168), #CCC, #CCC);
	box-shadow: inset 1px 1px 3px #666666;
}

div.addwrapper h3 {
	margin-top: 0;
}


div.bookwrapper {
	display: grid;
	grid-template-columns: 90px 220px auto;
	grid-gap: 5px;
  	margin:  8px 0;
	padding: 10px 10px 8px 10px;
	border: 1px solid #CCC;
	background: linear-gradient(90deg, #ddd, #ccc);
	box-shadow: inset 1px 1px 3px #666666;
}

div.bookwrapper div.cover {
	grid-column: 1;
	grid-row: 1 / span 2;
}

div.bookwrapper div.book {
	grid-column: 2;
	grid-row: 1;
}

div.bookwrapper div.reviews {
	grid-column: 3;
	grid-row: 1;
}

div.bookwrapper div.tags {
	grid-column: 2 / span 2;
	grid-row: 2;
}

div.bookwrapper ul.tags li {
	font-size: 12px;
	margin-right: 8px;
	margin-bottom: 4px;
}

div.cover img {
	box-shadow: 1px 1px 3px #666666;
}

</style>