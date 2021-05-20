<template>
	<div>

		<client-only>

			<img class="cover" v-if="row.cover_ext" :src="'/book_cover/' + row.id + '.' + row.cover_ext" width="100" height="180">

			<h2>{{ row.title }}</h2>

			<div class="authors">{{ row.authors }}</div>
			<div class="year">{{ row.year }}</div>

			<ul class="tags"><li v-for="tag in row.tags" :key="tag"><nuxt-link :to="'/tag/' + tag.tag">{{tag.tag}}</nuxt-link></li></ul>

			<div class="reviews">
				<div v-for="rev in reviews" class="review">
					<div v-if="rev.comment" v-html="$md.render(rev.comment)"></div>

					<i :class="rev.rating > 0 ? 'fas fa-star' : 'far fa-star'"></i><i
						:class="rev.rating > 1 ? 'fas fa-star' : 'far fa-star'"></i><i
						:class="rev.rating > 2 ? 'fas fa-star' : 'far fa-star'"></i><i
						:class="rev.rating > 3 ? 'fas fa-star' : 'far fa-star'"></i><i
						:class="rev.rating > 4 ? 'fas fa-star' : 'far fa-star'"></i>
					par <nuxt-link :to="'/user/mid/' + rev.mid">{{ rev.real_name }}</nuxt-link>
					le {{ rev.created_at | utc2cet }}
				</div>
			</div>

			<h3 @click="showForm = ! showForm" style="cursor: pointer;">
				<i v-if="showForm" class="fas fa-minus-circle"></i>
				<i v-else class="fas fa-plus-circle"></i>
				Ajouter une revue
			</h3>

			<form v-if="showForm" v-on:submit.prevent="addReview" method="post">

				<label for="rating">Note</label>
				<i :class="rating > 0 ? 'fas fa-star' : 'far fa-star'" @click="rating = 1"></i>
				<i :class="rating > 1 ? 'fas fa-star' : 'far fa-star'" @click="rating = 2"></i>
				<i :class="rating > 2 ? 'fas fa-star' : 'far fa-star'" @click="rating = 3"></i>
				<i :class="rating > 3 ? 'fas fa-star' : 'far fa-star'" @click="rating = 4"></i>
				<i :class="rating > 4 ? 'fas fa-star' : 'far fa-star'" @click="rating = 5"></i>
				<br>

				<div id="newReview" style="margin-left:125px;" v-if="newReview" v-html="$md.render(newReview)"></div>
				<label for="review">Commentaire</label>
				<textarea name="review" style="width: 400px; height: 300px;" v-model="newReview"></textarea><br>
				
				<label></label> <button type="submit">Enregistrer</button>
			</form>

		</client-only>

	</div>
</template>

<script>


export default {

	data() {
		return {
			row: {},
			reviews: [],
			showForm: false,
			rating: 0,
			newReview: '',
			options: ['BD', 'SF', 'Polar']
		}
	},

	methods: {
		
		getBook: async function () {
			const bid = this.$route.params.bid.split(' ')[0];
			let {data} = await this.$axios.get('/api/book?id=' + bid);
			if (data.rows.length) {
				this.row = data.rows[0];
				document.title = document.title.split('/')[0] + " / " + this.row.title;
			}
			if (data.tags.length) {
				this.row.tags = data.tags;
			}
		},
		
		getReviews: async function () {
			this.reviews = [];
			const bid = this.$route.params.bid.split(' ')[0];
			let {data} = await this.$axios.get('/api/reviews?id=' + bid);
			if (data.rows.length) {
				this.reviews = data.rows;
			}
		},

		addReview: async function() {
			const bodyFormData = new FormData();
			bodyFormData.append('rating',  this.rating);
			bodyFormData.append('review',  this.newReview);
			bodyFormData.append('id',      this.row.id);
			let {data} = await this.$axios.post('/api/book', bodyFormData);
			// reset book desc
			this.reviews = data.rows;
			// reset form
			this.showForm   = false;
			this.rating     = 0;
			this.newReview  = '';
		},
	},

	mounted: function() {
		this.getBook();
		this.getReviews();
	}
}

</script>


<style>

img.cover {
	float:left;
	margin-right: 12px;
	margin-bottom: 16px;
	box-shadow: 1px 1px 3px #666666;
}

div.reviews {
	margin-top: 12px;
	clear: left;
}


div.review {
	margin:  8px 0;
	padding: 4px 8px 0 8px;
	border: 1px solid #CCC;
	background: linear-gradient(90deg, #ddd, #ccc);
	box-shadow: inset 1px 1px 3px #666666;
}

</style>