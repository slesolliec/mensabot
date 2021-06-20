<template>
	<div class="bookwrapper">
		<div class="cover"><img v-if="book.cover_ext" :src="'/book_cover/' + book.id + '.' + book.cover_ext" width="80" height="130"></div>
		<div class="book">
			<nuxt-link :to="'/book/' + book.id">{{ book.title }}</nuxt-link><br>
			{{ book.authors }}<br>
			<span v-if="book.year">{{ book.year }}<br></span>
		</div>
		<div class="reviews">
			<div v-for="rev in book.reviews" :key="rev.mid">
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
				<li v-for="tag in book.tags" :key="tag"><nuxt-link :to="'/tag/' + tag">{{tag}}</nuxt-link></li>
			</ul>
		</div>
	</div>
</template>

<script>
export default {

	props: ['book'],

}
</script>


<style>

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