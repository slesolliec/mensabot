<template>
	<div>

		<client-only>

			<img class="cover" v-if="book.cover_ext" :src="'/book_cover/' + book.id + '.' + book.cover_ext" width="110" height="180">

			<h2>{{ book.title }}</h2>

			<div class="authors">{{ book.authors }}</div>
			<div class="year">{{ book.year }}</div>

			<ul class="tags"><li v-for="tag in book.tags" :key="tag"><nuxt-link :to="'/tag/' + tag">{{tag}}</nuxt-link></li></ul>

			<BookEdit v-if="book.id" :book="book" @bookadded="reloadContent" />

			<div class="reviews">
				<div v-for="rev in reviews" class="review" :key="rev.mid">
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


			<div class="editwrapper">

				<h3 @click="showForm = ! showForm" style="cursor: pointer;">
					<i v-if="showForm" class="fas fa-minus-circle"></i>
					<span v-else>
						<i v-if="hasReview" class="fas fa-pen-square"></i>
						<i v-else class="fas fa-plus-circle"></i>
					</span>
					<span v-if="hasReview">Modifier ma revue</span>
					<span v-else>Ajouter une revue</span>
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

			</div>

		</client-only>

	</div>
</template>

<script>


export default {

	data() {
		return {
			book: {title: '', authors: ''},
			reviews: [],
			showForm: false,
			rating: 0,
			newReview: '',
			options: ['BD', 'SF', 'Polar'],
			couv: undefined,
			mid: undefined,
			hasReview: false,
		}
	},

	methods: {
		
		getBook: async function () {
			const bid = this.$route.params.bid.split(' ')[0];
			let {data} = await this.$axios.get('/api/book?id=' + bid);
			if (data.books.length) {
				this.book = data.books[0];
				this.mid = data.mid;
				document.title = document.title.split('/')[0] + " / " + this.book.title;
			}
		},
		
		getReviews: async function () {
			this.reviews = [];
			const bid = this.$route.params.bid.split(' ')[0];
			let {data} = await this.$axios.get('/api/reviews?id=' + bid);
			if (data.rows.length) {
				this.reviews = data.rows;
				for (const i in this.reviews) {
					if (this.reviews[i].mid == this.mid) {
						this.rating    = this.reviews[i].rating;
						this.newReview = this.reviews[i].comment;
						this.hasReview = true;
					}
				}
			}
		},

		addReview: async function() {
			const bodyFormData = new FormData();
			bodyFormData.append('rating',  this.rating);
			bodyFormData.append('review',  this.newReview);
			bodyFormData.append('id',      this.book.id);
			let {data} = await this.$axios.post('/api/book', bodyFormData);
			// reset book desc
			this.reviews = data.rows;
			// reset form
			this.showForm   = false;
			for (const i in this.reviews) {
				if (this.reviews[i].did == this.$auth.user.id) {
					this.rating    = this.reviews[i].rating;
					this.newReview = this.reviews[i].comment;
				}
			}
		},

		reloadContent: async function() {
			await this.getBook();
			this.getReviews();
		}
	},

	mounted: async function() {
		await this.getBook();
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

form#addCover {
	padding: 4px 8px 4px 8px;
	background: #e2a011;
	box-shadow: inset 1px 1px 3px #333333;
}

</style>